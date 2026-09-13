import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { shape, equal } from '../direction/schema.mjs';
import { canonicalBytes, digestBytes } from '../gate/review-receipt.mjs';
import { assertFixtureDirectory, readFixtureFile, LIMITS } from './scenarios.mjs';
import { decodeNativeRequest, decodeNativeResponse } from './native-wire.mjs';
import { nativeHostIdentity } from './native-host.mjs';
import { nativeWitnessSourcePaths, validateNativeWitnessSources } from './native-witness.mjs';
import { strictEvaluationJson } from './strict-json.mjs';
export { strictEvaluationJson } from './strict-json.mjs';

const count=value=>Number.isSafeInteger(value)&&value>=0;
const digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const parentId=value=>typeof value==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value);
const requireObserved=(value,reason)=>{if(!value)throw new Error(`issue112 ${reason}`);};
const ordinalName=ordinal=>String(ordinal).padStart(6,'0');
const read=(directory,path)=>strictEvaluationJson(readFixtureFile(directory,join(directory,path)));
function add(a,b){const result=a+b;requireObserved(count(result),'usage sum overflow');return result;}

export function validateObserver(observer){
  shape(observer,['version','profile','authMode','maxRequests','maxRequestsPerInvocation','maxBytes','requestTimeoutMs']);
  observerReference(observer.profile);
  requireObserved(observer.version===1&&['chatgpt','api-key'].includes(observer.authMode),'observer identity');
  for(const key of ['maxRequests','maxRequestsPerInvocation','maxBytes','requestTimeoutMs'])requireObserved(count(observer[key])&&observer[key]>0,'observer positive bound');
  requireObserved(observer.maxRequests<=999999&&observer.maxRequestsPerInvocation<=observer.maxRequests&&observer.maxBytes<=LIMITS.outputBytes,'observer upper bound');
  return observer;
}
function observerReference(ref){
  shape(ref,['path','digest']);const path=ref.path;
  requireObserved(typeof path==='string'&&path.length>0&&!isAbsolute(path)&&!/[\\:\0]/.test(path)
    &&path.split('/').every(part=>part&&part!=='.'&&part!=='..')&&digest(ref.digest),'observer profile reference');
}
export function observerProfileReferences(profile,models){
  shape(profile,['version','models']);
  requireObserved(profile.version===1&&Array.isArray(profile.models)&&Array.isArray(models)&&models.length>0&&models.length<=2
    &&new Set(models).size===models.length&&profile.models.length===models.length,'observer profile models');
  const seen=new Set(),refs=[];
  for(const row of profile.models){
    shape(row,['model','files']);requireObserved(models.includes(row.model)&&!seen.has(row.model),'observer profile models');seen.add(row.model);
    requireObserved(row.files&&typeof row.files==='object'&&!Array.isArray(row.files)
      &&equal(Object.keys(row.files).sort(),nativeWitnessSourcePaths().sort()),'observer profile source set');
    for(const ref of Object.values(row.files)){observerReference(ref);refs.push(ref);}
  }
  return refs;
}
export function loadObserverProfile({observer,models,readRef,codex}){
  validateObserver(observer);requireObserved(typeof readRef==='function','observer source reader');
  const source=ref=>{observerReference(ref);const bytes=readRef(ref);requireObserved((typeof bytes==='string'||Buffer.isBuffer(bytes))
    &&digestBytes(bytes)===ref.digest,'observer source digest changed');return bytes;};
  const profile=strictEvaluationJson(source(observer.profile));observerProfileReferences(profile,models);
  const files=profile.models.map(row=>({model:row.model,files:Object.fromEntries(Object.entries(row.files).map(([path,ref])=>[path,source(ref)]))}));
  const identity=nativeHostIdentity(codex);
  return {version:1,digest:observer.profile.digest,identity,models:files.map(row=>({...validateNativeWitnessSources({...row,identity}),
    builtinSources:Object.fromEntries(Object.entries(row.files).filter(([path])=>path.startsWith('native-state/skills/.system/')).map(([path,bytes])=>[path.slice('native-state/skills/.system/'.length),digestBytes(bytes)]))}))};
}

export function campaignUsage(directory,{skipParent}={}){
  assertFixtureDirectory(directory);const launchRoot=join(directory,'launches');let input=0,output=0;
  if(!existsSync(launchRoot))return {input,output};
  assertFixtureDirectory(directory,launchRoot);
  for(const name of readdirSync(launchRoot).filter(name=>name.endsWith('.started.json'))){
    const record=read(directory,`launches/${name}`);requireObserved(parentId(record.id)&&name===`${record.id}.started.json`,'launch identity');
    if(record.id===skipParent)continue;
    const path=`artifacts/${record.id}/result.json`;
    requireObserved(existsSync(join(directory,path)),'unfinished launch remains charged; inspect recovery');
    const result=read(directory,path);requireObserved(result.cleanup===true,'cleanup unresolved');
    if(record.kind==='audit'&&result.controlled===true)continue;
    const tokens=result.usage||{},i=tokens.input_tokens??tokens.input,o=tokens.output_tokens??tokens.output;
    requireObserved(count(i)&&count(o),'unknown usage stops next launch');input=add(input,i);output=add(output,o);
  }
  return {input,output};
}

function physicalRecords(directory){
  const root=join(directory,'physical');if(!existsSync(root))return [];
  assertFixtureDirectory(directory,root);const names=readdirSync(root).sort();
  requireObserved(names.length<=999999,'physical record bound');
  return names.map((name,index)=>{
    requireObserved(name===`${ordinalName(index+1)}-started.json`,'physical ordinal census');
    const record=read(directory,`physical/${name}`);
    shape(record,['version','id','ordinal','parentId','collectorOrdinal','model','requestDigest','executionHandoffDigest','startedAt']);
    requireObserved(record.version===1&&record.ordinal===index+1&&record.id===`native-${ordinalName(index+1)}`
      &&parentId(record.parentId)&&count(record.collectorOrdinal)&&record.collectorOrdinal>0
      &&typeof record.model==='string'&&record.model.length>0&&digest(record.requestDigest)&&digest(record.executionHandoffDigest)
      &&count(record.startedAt),'physical record identity');return record;
  });
}

function parentAuthority(directory,id,executionHandoffDigest){
  requireObserved(parentId(id)&&digest(executionHandoffDigest),'physical parent authority');
  const parent=read(directory,`launches/${id}.started.json`);
  requireObserved(parent.version===2&&parent.id===id&&['author','prerequisite'].includes(parent.kind)
    &&parent.executionHandoffDigest===executionHandoffDigest,'physical parent authority');return parent;
}

function exchangeUsage(directory,record,observer){
  const prefix=`artifacts/${record.parentId}/collector/${ordinalName(record.collectorOrdinal)}`;
  const started=read(directory,`${prefix}-started.json`);
  requireObserved(started.version===1&&started.ordinal===record.collectorOrdinal&&count(started.startedAt)&&started.startedAt<=record.startedAt,'collector start binding');
  const bytes=readFixtureFile(directory,join(directory,`${prefix}-request.json`),{maxBytes:observer.maxBytes});
  requireObserved(digestBytes(bytes)===record.requestDigest,'physical request digest');
  const request=decodeNativeRequest(bytes,{maxBytes:observer.maxBytes});
  requireObserved(request.status==='observed'&&request.model===record.model,'physical request model');
  requireObserved(existsSync(join(directory,`${prefix}-terminal.json`)),'physical terminal missing; unknown usage');
  const terminal=read(directory,`${prefix}-terminal.json`);
  shape(terminal,['version','ordinal','forwarded','status','reason','requestDigest','responseDigest','inputBytes','outputBytes','inputIncomplete','outputIncomplete','observation','release','finishedAt']);
  requireObserved(terminal.version===1&&terminal.ordinal===record.collectorOrdinal&&typeof terminal.forwarded==='boolean'
    &&terminal.requestDigest===record.requestDigest&&terminal.inputBytes===bytes.length&&terminal.inputIncomplete===false
    &&count(terminal.outputBytes)&&typeof terminal.outputIncomplete==='boolean'&&count(terminal.finishedAt)&&terminal.finishedAt>=record.startedAt,'physical terminal binding');
  const dispatchPath=join(directory,`${prefix}-dispatch.json`),hasDispatch=existsSync(dispatchPath);
  if(hasDispatch){const dispatch=read(directory,`${prefix}-dispatch.json`);shape(dispatch,['reservationId','requestDigest','at']);
    requireObserved(dispatch.reservationId===record.id&&dispatch.requestDigest===record.requestDigest&&count(dispatch.at)
      &&dispatch.at>=record.startedAt&&dispatch.at<=terminal.finishedAt,'physical dispatch binding');}
  if(!terminal.forwarded){
    requireObserved(terminal.status===null&&typeof terminal.reason==='string'&&terminal.reason.length>0&&terminal.outputBytes===0
      &&terminal.responseDigest===null&&terminal.observation===null,'no-forward terminal incomplete');
    return {input_tokens:0,output_tokens:0,cached_input_tokens:0};
  }
  requireObserved(hasDispatch&&terminal.status===200&&!terminal.outputIncomplete,'forwarded response usage unknown');
  requireObserved(existsSync(join(directory,`${prefix}-response.body`)),'physical response missing');
  const response=readFixtureFile(directory,join(directory,`${prefix}-response.body`),{maxBytes:observer.maxBytes});
  requireObserved(response.length===terminal.outputBytes&&digestBytes(response)===terminal.responseDigest,'physical response binding');
  const observation=decodeNativeResponse(response,{maxBytes:observer.maxBytes,contentType:'text/event-stream',requestedModel:record.model});
  requireObserved(observation.status==='observed'&&equal(observation,terminal.observation),'physical response observation changed');
  const usage=observation.usage;
  requireObserved(count(usage?.input_tokens)&&count(usage?.output_tokens)
    &&(usage.cached_input_tokens===null||count(usage.cached_input_tokens)),'forwarded response usage unknown');return usage;
}

export function observedPhysicalUsage({directory,observer,executionHandoffDigest}){
  validateObserver(observer);assertFixtureDirectory(directory);
  const records=physicalRecords(directory),parents={};
  requireObserved(records.length<=observer.maxRequests,'global request allowance exceeded');
  for(const record of records){
    requireObserved(record.executionHandoffDigest===executionHandoffDigest,'physical authority changed');
    parentAuthority(directory,record.parentId,executionHandoffDigest);
    const parent=parents[record.parentId]??={requests:0,model:record.model,usage:{input_tokens:0,output_tokens:0,cached_input_tokens:0}};
    requireObserved(parent.model===record.model&&record.collectorOrdinal===parent.requests+1,'physical parent sequence/model');
    requireObserved(++parent.requests<=observer.maxRequestsPerInvocation,'parent request allowance exceeded');
    const usage=exchangeUsage(directory,record,observer);
    for(const key of ['input_tokens','output_tokens','cached_input_tokens'])parent.usage[key]=usage[key]===null||parent.usage[key]===null?null:add(parent.usage[key],usage[key]);
  }
  for(const [id,parent]of Object.entries(parents)){
    const path=`artifacts/${id}/result.json`;if(!existsSync(join(directory,path)))continue;
    const result=read(directory,path),usage=result.usage;
    requireObserved(usage&&usage.input_tokens===parent.usage.input_tokens&&usage.output_tokens===parent.usage.output_tokens
      &&(usage.cached_input_tokens??null)===parent.usage.cached_input_tokens,'completed parent usage differs from physical evidence');
  }
  return {requests:records.length,parents};
}

export function reserveObservedRequest({directory,parentId:id,executionHandoffDigest,model,observer,spend,deadline,request}){
  validateObserver(observer);assertFixtureDirectory(directory);parentAuthority(directory,id,executionHandoffDigest);
  requireObserved(count(deadline)&&Date.now()<deadline,'physical deadline exhausted');
  requireObserved(!existsSync(join(directory,'cleanup-failed.json')),'cleanup unresolved');
  requireObserved(!existsSync(join(directory,`artifacts/${id}/result.json`)),'physical parent already finished');
  requireObserved(count(request.ordinal)&&request.ordinal>0&&request.model===model&&digest(request.requestDigest)&&count(request.startedAt),'physical request model or identity');
  const records=physicalRecords(directory);
  requireObserved(!records.some(row=>row.parentId===id&&row.collectorOrdinal===request.ordinal),'collector ordinal already reserved');
  const observed=observedPhysicalUsage({directory,observer,executionHandoffDigest}),prior=campaignUsage(directory,{skipParent:id});
  const current=observed.parents[id],own=current?.usage;
  requireObserved(observed.requests<observer.maxRequests&&(current?.requests??0)<observer.maxRequestsPerInvocation,'physical request allowance exhausted');
  requireObserved(request.ordinal===(current?.requests??0)+1,'physical request sequence');
  const input=add(prior.input,own?.input_tokens??0),output=add(prior.output,own?.output_tokens??0);
  requireObserved(count(spend.plannedMaxMicrousd)&&spend.plannedMaxMicrousd>0&&count(spend.inputTokens)&&count(spend.outputTokens)
    &&input<spend.inputTokens&&output<spend.outputTokens,'sourced spend or token planning ceiling exhausted');
  const prefix=`artifacts/${id}/collector/${ordinalName(request.ordinal)}`;
  const bytes=readFixtureFile(directory,join(directory,`${prefix}-request.json`),{maxBytes:observer.maxBytes});
  const decoded=decodeNativeRequest(bytes,{maxBytes:observer.maxBytes});
  requireObserved(digestBytes(bytes)===request.requestDigest&&decoded.status==='observed'&&decoded.model===model,'physical request source changed');
  const ordinal=records.length+1,record={version:1,id:`native-${ordinalName(ordinal)}`,ordinal,parentId:id,collectorOrdinal:request.ordinal,
    model,requestDigest:request.requestDigest,executionHandoffDigest,startedAt:request.startedAt};
  requireObserved(Date.now()<deadline,'physical deadline exhausted');
  mkdirSync(join(directory,'physical'),{recursive:true,mode:0o700});assertFixtureDirectory(directory,join(directory,'physical'));
  writeFileSync(join(directory,'physical',`${ordinalName(ordinal)}-started.json`),canonicalBytes(record),{flag:'wx',mode:0o600});return {id:record.id};
}
