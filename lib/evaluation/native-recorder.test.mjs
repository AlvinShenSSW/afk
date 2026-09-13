import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { createNativeRecorder } from './native-recorder.mjs';

const requestBody=JSON.stringify({model:'gpt-6-astra',input:'Synthetic input'});
const terminal=Buffer.from('event: response.completed\ndata: '+JSON.stringify({type:'response.completed',response:{id:'synthetic-response',model:'gpt-6-astra',status:'completed',output:[],usage:{input_tokens:2,output_tokens:1}}})+'\n\n');
function send(url,{body=requestBody,path='',headers={},method='POST'}={}) {
  return new Promise((resolve,reject)=>{
    const req=http.request(url+path,{method,headers:{'content-type':'application/json',authorization:'Bearer synthetic-only',...headers}},res=>{
      const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(chunks)}));res.on('error',reject);
    });req.on('error',reject);req.end(body);
  });
}
function upstream(t,{status=200,body=terminal,headers={'content-type':'text/event-stream'},hold=false}={}) {
  const calls=[];
  t.mock.method(https,'request',(url,options,callback)=>{
    const req=new EventEmitter();req.end=bytes=>{
      calls.push({url:String(url),options,body:bytes});
      if(hold) return;
      queueMicrotask(()=>{const res=new PassThrough();res.statusCode=status;res.headers=headers;callback(res);res.end(body);});
    };
    req.destroy=error=>{if(error)queueMicrotask(()=>req.emit('error',error));};
    return req;
  });return calls;
}
async function setup(t,options={}) {
  const root=mkdtempSync(join(tmpdir(),'afk-native-recorder-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const reservations=[];
  const recorder=await createNativeRecorder({directory:join(root,'capture'),authMode:'chatgpt',maxRequests:3,maxBytes:100000,
    concurrency:1,deadline:Date.now()+5000,requestTimeoutMs:1000,reserve:async record=>{reservations.push(record);return {id:`slot-${record.ordinal}`};},...options});
  t.after(()=>recorder.stop());
  return {root,recorder,reservations};
}

test('recorder reserves then forwards to fixed origin without persisting auth headers',async t=>{
  const calls=upstream(t);const {root,recorder,reservations}=await setup(t);
  const reply=await send(recorder.url);
  assert.equal(reply.status,200);assert.deepEqual(reply.body,terminal);
  assert.equal(calls.length,1);assert.equal(reservations.length,1);
  assert.equal(calls[0].url,'https://chatgpt.com/backend-api/codex/responses');
  assert.equal(calls[0].options.headers.authorization,'Bearer synthetic-only');
  const files=readdirSync(join(root,'capture'));
  const evidence=files.map(file=>readFileSync(join(root,'capture',file),'utf8')).join('\n');
  assert.equal(evidence.includes('synthetic-only'),false);
  assert.equal(JSON.parse(readFileSync(join(root,'capture','000001-terminal.json'))).observation.complete,true);
  await recorder.stop();await recorder.stop();
});

test('API auth selects its fixed Responses route and refuses caller upstream injection',async t=>{
  const calls=upstream(t);const {recorder}=await setup(t,{authMode:'api-key'});
  assert.equal((await send(recorder.url)).status,200);
  assert.equal(calls[0].url,'https://api.openai.com/v1/responses');
  await assert.rejects(()=>setup(t,{upstream:'https://example.invalid'}),/unsupported option/);
});

test('bounds and single concurrency are mandatory before listener creation',async t=>{
  for(const option of [{maxBytes:0},{maxRequests:Infinity},{deadline:0},{requestTimeoutMs:1.5},{concurrency:2},{reserve:null}]) {
    await assert.rejects(()=>setup(t,option),/bound|concurrency|reservation/);
  }
});

test('unsupported routes and content encodings never dispatch',async t=>{
  const calls=upstream(t);
  const a=await setup(t);assert.equal((await send(a.recorder.url,{path:'/compact'})).status,400);
  const b=await setup(t);assert.equal((await send(b.recorder.url,{headers:{'content-encoding':'gzip'}})).status,400);
  const c=await setup(t);assert.equal((await send(c.recorder.url,{method:'GET',body:''})).status,400);
  assert.equal(calls.length,0);assert.equal(a.reservations.length,0);
});

test('reservation failure and late completion after stop cannot dispatch',async t=>{
  const calls=upstream(t);
  const a=await setup(t,{reserve:async()=>{throw new Error('synthetic refusal');}});
  assert.equal((await send(a.recorder.url)).status,502);
  let release,entered;const started=new Promise(resolve=>{entered=resolve;});
  const b=await setup(t,{reserve:()=>new Promise(resolve=>{release=resolve;entered();})});
  const pending=send(b.recorder.url).catch(error=>({error:error.code}));await started;
  const stopped=b.recorder.stop();release({id:'late'});await stopped;await pending;
  assert.equal(calls.length,0);
});

test('unknown usage and redirect responses latch failure without retries',async t=>{
  const calls=upstream(t,{status:302,headers:{location:'https://example.invalid'}});
  const {recorder}=await setup(t);
  assert.equal((await send(recorder.url)).status,502);
  assert.equal((await send(recorder.url)).status,409);assert.equal(calls.length,1);
});

test('request and response byte limits retain failure and prohibit later dispatch',async t=>{
  const calls=upstream(t,{body:Buffer.alloc(2000,120)});
  const a=await setup(t,{maxBytes:500});assert.equal((await send(a.recorder.url,{body:'x'.repeat(501)})).status,400);
  assert.equal(calls.length,0);
  const b=await setup(t,{maxBytes:500});assert.equal((await send(b.recorder.url)).status,502);
  assert.equal((await send(b.recorder.url)).status,409);assert.equal(calls.length,1);
  assert.equal(readFileSync(join(b.root,'capture','000001-response.partial')).length,500);
  const result=JSON.parse(readFileSync(join(b.root,'capture','000001-terminal.json')));
  assert.equal(result.outputIncomplete,true);assert.equal(result.outputBytes,2000);
});

test('credential-bearing bodies are refused without storing those bytes',async t=>{
  const calls=upstream(t);const {root,recorder}=await setup(t);
  const body=JSON.stringify({model:'gpt-6-astra',input:'synthetic-only'});
  assert.equal((await send(recorder.url,{body})).status,400);assert.equal(calls.length,0);
  assert.equal(readdirSync(join(root,'capture')).map(file=>readFileSync(join(root,'capture',file),'utf8')).join('').includes('synthetic-only'),false);
});

test('physical request cap is independent of successful invocation count',async t=>{
  const calls=upstream(t);const {recorder}=await setup(t,{maxRequests:1});
  assert.equal((await send(recorder.url)).status,200);assert.equal((await send(recorder.url)).status,409);
  assert.equal(calls.length,1);
});

test('concurrent request refusal prevents a pending reservation dispatch',async t=>{
  const calls=upstream(t);let release,entered;const started=new Promise(resolve=>{entered=resolve;});
  const {root,recorder}=await setup(t,{reserve:()=>new Promise(resolve=>{release=resolve;entered();})});
  const first=send(recorder.url);await started;
  assert.equal((await send(recorder.url)).status,409);release({id:'late'});
  assert.equal((await first).status,502);assert.equal(calls.length,0);
});

test('stalled upstream reaches a retained timeout with no retry',async t=>{
  const calls=upstream(t,{hold:true});const {root,recorder}=await setup(t,{requestTimeoutMs:20});
  assert.equal((await send(recorder.url)).status,502);assert.equal(calls.length,1);
  const result=JSON.parse(readFileSync(join(root,'capture','000001-terminal.json')));
  assert.equal(result.forwarded,true);assert.equal(result.reason,'request-timeout');
});

test('missing usage is distinct from zero and its full response stays retained',async t=>{
  const body=Buffer.from(terminal.toString().replace('"usage":{"input_tokens":2,"output_tokens":1}','"usage":{}'));
  const calls=upstream(t,{body});const {root,recorder}=await setup(t);
  assert.equal((await send(recorder.url)).status,502);
  assert.equal((await send(recorder.url)).status,409);assert.equal(calls.length,1);
  const result=JSON.parse(readFileSync(join(root,'capture','000001-terminal.json')));
  assert.equal(result.observation.usage,null);
  assert.deepEqual(readFileSync(join(root,'capture','000001-response.body')),body);
});

test('upgrade refusal is recorded without forwarding or retaining credential headers',async t=>{
  const calls=upstream(t);const {root,recorder}=await setup(t);const url=new URL(recorder.url);
  await new Promise((resolve,reject)=>{
    const socket=net.connect(Number(url.port),'127.0.0.1',()=>socket.end('GET '+url.pathname+' HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nAuthorization: Bearer synthetic-only\r\n\r\n'));
    socket.on('data',()=>{});socket.on('end',resolve);socket.on('error',reject);
  });
  assert.equal(calls.length,0);
  const refusal=readFileSync(join(root,'capture','refusal.json'),'utf8');
  assert.match(refusal,/unsupported-upgrade/);assert.equal(refusal.includes('synthetic-only'),false);
});

test('client disconnect while awaiting reservation cannot lead to late dispatch',async t=>{
  const calls=upstream(t);let release,entered;const started=new Promise(resolve=>{entered=resolve;});
  const {root,recorder}=await setup(t,{reserve:()=>new Promise(resolve=>{release=resolve;entered();})});
  const req=http.request(recorder.url,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer synthetic-only'}});
  req.on('error',()=>{});req.end(requestBody);await started;req.destroy();
  const deadline=Date.now()+1000;
  while(!existsSync(join(root,'capture','000001-terminal.json'))&&Date.now()<deadline) await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(JSON.parse(readFileSync(join(root,'capture','000001-terminal.json'))).reason,'client-disconnected');
  release({id:'disconnected'});await new Promise(resolve=>setImmediate(resolve));await recorder.stop();
  assert.equal(calls.length,0);
});
