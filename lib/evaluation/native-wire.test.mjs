import assert from 'node:assert/strict';
import { test } from 'node:test';
import { digestBytes } from '../gate/review-receipt.mjs';
import { decodeNativeRequest, decodeNativeResponse } from './native-wire.mjs';

const maxBytes = 100000;
const request = input => Buffer.from(JSON.stringify({model:'gpt-6-astra',input}));
const completed = overrides => ({id:'response-1',status:'completed',model:'gpt-6-astra',output:[],usage:{input_tokens:12,output_tokens:3},...overrides});
const sse = events => Buffer.from(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''));
const response = (events, options={}) => decodeNativeResponse(sse(events),{maxBytes,contentType:'text/event-stream',requestedModel:'gpt-6-astra',...options});

test('native additional-tools namespaces and message instructions retain actual sources', () => {
  const bytes=request([{type:'additional_tools',role:'developer',tools:[{type:'namespace',name:'functions',tools:[{type:'custom',name:'exec',description:'Registry gateway'}]}]},
    {role:'developer',content:[{type:'input_text',text:'Exact instruction\n'}]},
    {role:'user',content:[{type:'input_text',text:'Unhinted trigger'}]}]);
  const result=decodeNativeRequest(bytes,{maxBytes});
  assert.equal(result.status,'observed'); assert.equal(result.bodyDigest,digestBytes(bytes));
  assert.deepEqual(result.tools.map(t=>t.id),['functions.exec']);
  assert.equal(result.tools[0].source,'/input/0/tools/0/tools/0');
  assert.equal(result.instructions[0].text,'Exact instruction\n');
  assert.equal(result.instructions[0].digest,digestBytes('Exact instruction\n'));
  assert.equal(result.inventoryQualified,false);
});

test('ordinary Responses forms are observed without conflating descriptions and instructions', () => {
  const result=decodeNativeRequest(Buffer.from(JSON.stringify({model:'gpt-6-astra',instructions:'System input',tools:[{type:'function',name:'read',parameters:{}}],input:'Task'})),{maxBytes});
  assert.equal(result.status,'observed'); assert.deepEqual(result.tools.map(t=>t.id),['read']);
  assert.deepEqual(result.instructions.map(i=>i.text),['System input','Task']);
});

test('registry witness needs the actual fixed call and matching host output', () => {
  const output={type:'custom_tool_call_output',call_id:'registry',output:[{type:'input_text',text:'Script completed'},{type:'input_text',text:'[{"name":"exec_command","description":"Run a command"}]'}]};
  const call={type:'custom_tool_call',call_id:'registry',namespace:'functions',name:'exec',input:'text(ALL_TOOLS)'};
  const result=decodeNativeRequest(request([call,output]),{maxBytes});
  assert.deepEqual(result.registryWitnesses[0].entries.map(e=>e.name),['exec_command']);
  assert.equal(result.registryWitnesses[0].callSource,'/input/0');
  assert.equal(result.inventoryQualified,false);
  assert.equal(decodeNativeRequest(request([output]),{maxBytes}).registryWitnesses.length,0);
  assert.equal(decodeNativeRequest(request([{...call,input:'text("inventory complete")'},output]),{maxBytes}).registryWitnesses.length,0);
});

test('duplicate declarations and unsupported input stay explicit', () => {
  const duplicate={type:'additional_tools',tools:[{type:'function',name:'read'},{type:'function',name:'read'}]};
  assert.equal(decodeNativeRequest(request([duplicate]),{maxBytes}).status,'unavailable');
  const opaque=decodeNativeRequest(request([{type:'reasoning',encrypted_content:'opaque'}, {type:'future_input',value:'uninterpreted'}]),{maxBytes});
  assert.equal(opaque.opaque.length,2); assert.equal(opaque.inventoryQualified,false);
});

test('wire decoding refuses invalid UTF-8, oversized bytes and permissive bounds', () => {
  for(const bytes of [Buffer.from([0xff]),Buffer.from('{')]) assert.equal(decodeNativeRequest(bytes,{maxBytes}).status,'unavailable');
  assert.equal(decodeNativeRequest(request([]),{maxBytes:1}).status,'unavailable');
  for(const limit of [undefined,0,Infinity,1.5]) assert.throws(()=>decodeNativeRequest(request([]),{maxBytes:limit}),/bound/);
});

test('complete SSE retains exact terminal model and known usage', () => {
  const result=response([{type:'response.created',response:completed({status:'in_progress'})},{type:'response.completed',response:completed()}]);
  assert.equal(result.status,'observed'); assert.equal(result.complete,true);
  assert.deepEqual(result.usage,{input_tokens:12,output_tokens:3,cached_input_tokens:null});
  assert.equal(result.observedModel,'gpt-6-astra');
});

test('A/B/A model conflict stays conflicting instead of resetting', () => {
  const result=response([{type:'response.created',response:completed()}, {type:'response.in_progress',response:completed({model:'other'})}, {type:'response.completed',response:completed()}]);
  assert.equal(result.status,'unavailable'); assert.equal(result.observedModel,null);
  assert.match(result.reason,/model/);
});

test('partial, repeated and failed terminals never receive successful accounting', () => {
  const terminal={type:'response.completed',response:completed()};
  for(const events of [[],[terminal,terminal],[{type:'response.failed',response:completed({status:'failed'})}]]) {
    const result=response(events); assert.equal(result.status,'unavailable'); assert.equal(result.complete,false);
  }
  const bytes=sse([terminal]);
  assert.equal(decodeNativeResponse(bytes.subarray(0,bytes.length-1),{maxBytes,contentType:'text/event-stream',requestedModel:'gpt-6-astra'}).complete,false);
});

test('missing, negative and fractional usage remains unknown', () => {
  for(const usage of [undefined,{input_tokens:-1,output_tokens:2},{input_tokens:1.5,output_tokens:2},{input_tokens:1}]) {
    const result=response([{type:'response.completed',response:completed({usage})}]);
    assert.equal(result.status,'unavailable'); assert.equal(result.usage,null);
  }
});

test('unsupported content, event type and event-name mismatch are retained failures', () => {
  assert.equal(response([{type:'response.completed',response:completed()}],{contentType:'application/octet-stream'}).status,'unavailable');
  assert.equal(response([{type:'future.event'},{type:'response.completed',response:completed()}]).status,'unavailable');
  const bytes=Buffer.from('event: response.created\ndata: '+JSON.stringify({type:'response.completed',response:completed()})+'\n\n');
  assert.equal(decodeNativeResponse(bytes,{maxBytes,contentType:'text/event-stream',requestedModel:'gpt-6-astra'}).status,'unavailable');
});

test('assistant history is retained separately from instruction-source inventory', () => {
  const result=decodeNativeRequest(request([{role:'assistant',content:[{type:'output_text',text:'Untrusted prior claim'}]}]),{maxBytes});
  assert.equal(result.instructions.length,0);assert.equal(result.assistantMessages[0].text,'Untrusted prior claim');
});

test('response identity cannot change between stream envelopes', () => {
  const result=response([{type:'response.created',response:completed({id:'other-response'})},{type:'response.completed',response:completed()}]);
  assert.equal(result.status,'unavailable');assert.match(result.reason,/identity/);
});
