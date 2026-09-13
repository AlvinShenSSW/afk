import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalBytes, digestBytes } from '../gate/review-receipt.mjs';
import { decodeNativeResponse } from './native-wire.mjs';
import { witnessResponse, nativeWitnessSourcePaths } from './native-witness.mjs';
import { campaignUsage, reserveObservedRequest, observedPhysicalUsage, strictEvaluationJson, validateObserver, observerProfileReferences } from './observed-execution.mjs';

const model='gpt-6-astra',handoffDigest='a'.repeat(64);
const observer={version:1,profile:{path:'native/profile.json',digest:'b'.repeat(64)},authMode:'chatgpt',maxRequests:4,maxRequestsPerInvocation:2,maxBytes:1048576,requestTimeoutMs:10000};
function fixture(t){
  const directory=realpathSync(mkdtempSync(join(tmpdir(),'afk-physical-')));t.after(()=>rmSync(directory,{recursive:true,force:true}));
  const put=(path,value)=>{mkdirSync(join(directory,path,'..'),{recursive:true});writeFileSync(join(directory,path),Buffer.isBuffer(value)?value:canonicalBytes(value));};
  const start=id=>put(`launches/${id}.started.json`,{version:2,id,kind:'author',ordinal:readdirSync(join(directory,'launches')).length+1,startedAt:new Date().toISOString(),executionHandoffDigest:handoffDigest});
  mkdirSync(join(directory,'launches'));start('parent');
  const request=(ordinal=1)=>{const raw=Buffer.from(JSON.stringify({model,input:[],tools:[]}));put(`artifacts/parent/collector/${String(ordinal).padStart(6,'0')}-request.json`,raw);
    put(`artifacts/parent/collector/${String(ordinal).padStart(6,'0')}-started.json`,{version:1,ordinal,startedAt:Date.now()});return {ordinal,model,requestDigest:digestBytes(raw),startedAt:Date.now()};};
  const options={directory,parentId:'parent',executionHandoffDigest:handoffDigest,model,observer,spend:{plannedMaxMicrousd:100000,inputTokens:100,outputTokens:100},deadline:Date.now()+60000};
  const finish=(reservation,{ordinal=1,forwarded=true,dispatch=true,terminal=true}={})=>{
    const local=String(ordinal).padStart(6,'0'),requestDigest=digestBytes(readFileSync(join(directory,`artifacts/parent/collector/${local}-request.json`)));
    if(dispatch)put(`artifacts/parent/collector/${local}-dispatch.json`,{reservationId:reservation.id,requestDigest,at:Date.now()});
    const response=witnessResponse({ordinal:2,model,script:''}),observation=forwarded?decodeNativeResponse(response,{maxBytes:observer.maxBytes,contentType:'text/event-stream',requestedModel:model}):null;
    if(forwarded)put(`artifacts/parent/collector/${local}-response.body`,response);
    if(terminal)put(`artifacts/parent/collector/${local}-terminal.json`,{version:1,ordinal,forwarded,status:forwarded?200:null,reason:forwarded?null:'collector-deadline',requestDigest,responseDigest:forwarded?digestBytes(response):null,
      inputBytes:readFileSync(join(directory,`artifacts/parent/collector/${local}-request.json`)).length,outputBytes:forwarded?response.length:0,inputIncomplete:false,outputIncomplete:!forwarded,observation,release:null,finishedAt:Date.now()});
  };
  return {directory,put,start,request,options,finish};
}

test('optional observer requires explicit finite bounds and a safe immutable profile reference',()=>{
  assert.deepEqual(validateObserver(observer),observer);
  for(const change of [{maxRequests:0},{maxRequestsPerInvocation:5},{maxBytes:8388609},{requestTimeoutMs:Infinity},{profile:{path:'../profile',digest:'b'.repeat(64)}},{authMode:'proxy'},{extra:true}])assert.throws(()=>validateObserver({...observer,...change}));
});
test('strict evaluation JSON rejects duplicate decoded keys and excessive nesting',()=>{
  assert.throws(()=>strictEvaluationJson('{"x":1,"\\u0078":2}'),/duplicate/);
  assert.throws(()=>strictEvaluationJson('['.repeat(129)+'0'+']'.repeat(129)),/depth/);
  assert.deepEqual(strictEvaluationJson('{"x":[1]}'),{x:[1]});
});
test('profile sources bind exactly the selected model set and every native witness source',()=>{
  const row={model,files:Object.fromEntries(nativeWitnessSourcePaths().map(path=>[path,{path:'proof/'+path,digest:'c'.repeat(64)}]))},profile={version:1,models:[row]};
  assert.equal(observerProfileReferences(profile,[model]).length,nativeWitnessSourcePaths().length);
  assert.throws(()=>observerProfileReferences(profile,[model,'gpt-5.6-sol']),/models/);
  assert.throws(()=>observerProfileReferences({version:1,models:[row,row]},[model]),/models/);
  const missing=structuredClone(profile);delete missing.models[0].files['response-4.sse'];
  assert.throws(()=>observerProfileReferences(missing,[model]),/source set/);
  const unsafe=structuredClone(profile);unsafe.models[0].files['response-4.sse'].path='../escaped';
  assert.throws(()=>observerProfileReferences(unsafe,[model]),/reference/);
});
test('reservation skips only its unfinished parent and uses completed audit usage once',t=>{
  const f=fixture(t);f.start('audit');
  f.put('artifacts/audit/result.json',{cleanup:true,usage:{input:7,output:3}});
  assert.deepEqual(campaignUsage(f.directory,{skipParent:'parent'}),{input:7,output:3});
  const first=reserveObservedRequest({...f.options,request:f.request()});f.finish(first);
  const second=reserveObservedRequest({...f.options,request:f.request(2)});f.finish(second,{ordinal:2});
  assert.notEqual(first.id,second.id);
  const usage=observedPhysicalUsage(f.options);
  assert.equal(usage.requests,2);assert.deepEqual(usage.parents.parent.usage,{input_tokens:2,output_tokens:2,cached_input_tokens:null});
  f.put('artifacts/parent/result.json',{cleanup:true,usage:usage.parents.parent.usage});
  assert.deepEqual(campaignUsage(f.directory),{input:9,output:5});
});
test('a reservation cannot replay its collector ordinal or reset global/per-parent accounting',t=>{
  const f=fixture(t),request=f.request(),first=reserveObservedRequest({...f.options,request});f.finish(first);
  assert.throws(()=>reserveObservedRequest({...f.options,request}),/already reserved/);
  assert.throws(()=>reserveObservedRequest({...f.options,observer:{...observer,maxRequests:1,maxRequestsPerInvocation:1},request:f.request(2)}),/request allowance/);
  assert.throws(()=>reserveObservedRequest({...f.options,observer:{...observer,maxRequestsPerInvocation:1},request:f.request(2)}),/request allowance/);
  assert.equal(readdirSync(join(f.directory,'physical')).length,1);
});
test('missing dispatch alone is unknown; a complete no-forward terminal proves zero while retaining the reservation',t=>{
  const f=fixture(t),first=reserveObservedRequest({...f.options,request:f.request()});
  assert.throws(()=>observedPhysicalUsage(f.options),/terminal/);
  f.finish(first,{forwarded:false,dispatch:false});
  const usage=observedPhysicalUsage(f.options);
  assert.equal(usage.requests,1);assert.equal(usage.parents.parent.usage.input_tokens,0);
  assert.doesNotThrow(()=>reserveObservedRequest({...f.options,request:f.request(2)}));
});
test('a conflicting reservation, missing response or tampered usage cannot authorize another dispatch',t=>{
  const f=fixture(t),first=reserveObservedRequest({...f.options,request:f.request()});f.finish(first);
  const path='artifacts/parent/collector/000001-terminal.json',original=JSON.parse(readFileSync(join(f.directory,path)));
  f.put(path,{...original,observation:{...original.observation,usage:{input_tokens:0,output_tokens:0,cached_input_tokens:null}}});
  assert.throws(()=>reserveObservedRequest({...f.options,request:f.request(2)}),/response observation/);
  f.put(path,original);f.put('artifacts/parent/collector/000001-dispatch.json',{reservationId:'wrong',requestDigest:original.requestDigest,at:Date.now()});
  assert.throws(()=>observedPhysicalUsage(f.options),/dispatch binding/);
  f.finish(first);rmSync(join(f.directory,'artifacts/parent/collector/000001-response.body'));
  assert.throws(()=>observedPhysicalUsage(f.options),/response/);
});
test('completed parent summaries must match physical usage and are never counted twice',t=>{
  const f=fixture(t),first=reserveObservedRequest({...f.options,request:f.request()});f.finish(first);
  f.put('artifacts/parent/result.json',{cleanup:true,usage:{input_tokens:2,output_tokens:1}});
  assert.throws(()=>observedPhysicalUsage(f.options),/parent usage/);
  f.put('artifacts/parent/result.json',{cleanup:true,usage:{input_tokens:1,output_tokens:1,cached_input_tokens:null}});
  assert.equal(observedPhysicalUsage(f.options).requests,1);
});
test('unknown prior launch usage, wrong model, changed authority or exhausted tokens refuse before reservation',t=>{
  const f=fixture(t),request=f.request();f.start('earlier');
  assert.throws(()=>reserveObservedRequest({...f.options,request}),/unfinished launch/);
  f.put('artifacts/earlier/result.json',{cleanup:true,usage:{}});
  assert.throws(()=>reserveObservedRequest({...f.options,request}),/unknown usage/);
  f.put('artifacts/earlier/result.json',{cleanup:true,usage:{input:100,output:1}});
  assert.throws(()=>reserveObservedRequest({...f.options,request}),/ceiling/);
  f.put('artifacts/earlier/result.json',{cleanup:true,usage:{input:0,output:0}});
  assert.throws(()=>reserveObservedRequest({...f.options,request:{...request,model:'gpt-5.6-sol'}}),/model/);
  assert.throws(()=>reserveObservedRequest({...f.options,executionHandoffDigest:'c'.repeat(64),request}),/authority/);
  assert.throws(()=>reserveObservedRequest({...f.options,deadline:Date.now()-1,request}),/deadline/);
});
