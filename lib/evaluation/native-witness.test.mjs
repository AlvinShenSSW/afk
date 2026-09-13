import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { generateNativeWitness, witnessResponse } from './native-witness.mjs';
import { checkNativeRelease, decodeNativeResponse } from './native-wire.mjs';
import { EVALUATOR_RUNTIME_FILES } from './runtime.mjs';

for(const ordinal of [1,2,3,4])test(`owned synthetic response ${ordinal} has complete release evidence`,()=>{
  const bytes=witnessResponse({ordinal,model:'gpt-6-astra',script:'text(ALL_TOOLS);'});
  const decoded=decodeNativeResponse(bytes,{maxBytes:100000,requestedModel:'gpt-6-astra',contentType:'text/event-stream'});assert.equal(decoded.status,'observed');
  assert.equal(checkNativeRelease(decoded).allowed,true);
  assert.equal(decoded.observedModel,'gpt-6-astra');
});
test('witness refuses unknown host before any synthetic listener or launch',async t=>{
  const root=realpathSync(mkdtempSync(join(tmpdir(),'afk-native-witness-')));t.after(()=>rmSync(root,{recursive:true,force:true}));
  await assert.rejects(generateNativeWitness({directory:join(root,'witness'),codex:process.execPath,model:'gpt-6-astra',maxBytes:1000000,deadline:Date.now()+10000}),/native host/);
});
test('source-isolated invalid request fixture retains dispatch attempt and complete refused body',async t=>{
  const root=realpathSync(mkdtempSync(join(tmpdir(),'afk-witness-refusal-')));t.after(()=>rmSync(root,{recursive:true,force:true}));
  const source=join(root,'source'),repository=fileURLToPath(new URL('../..',import.meta.url));
  for(const path of EVALUATOR_RUNTIME_FILES){mkdirSync(dirname(join(source,path)),{recursive:true});writeFileSync(join(source,path),readFileSync(join(repository,path)));}
  const host=join(source,'lib/evaluation/native-host.mjs'),bytes=readFileSync(host,'utf8'),start=bytes.indexOf('export function nativeHostIdentity('),end=bytes.indexOf('function requireCatalog(',start);
  assert.ok(start>0&&end>start);writeFileSync(host,bytes.slice(0,start)+"export function nativeHostIdentity(){return {digest:'synthetic-test-only',provenance:'Source-isolated mock identity; no native qualification'};}\n"+bytes.slice(end));
  const script=join(root,'client.mjs'),binary=join(root,'client.sh');
  writeFileSync(script,`import http from'node:http';const args=process.argv.slice(2),provider=args.find(x=>x.startsWith('model_providers.')),base=JSON.parse(provider.match(/base_url=("[^"]+")/)[1]);const req=http.request(base+'/responses',{method:'POST',headers:{authorization:'Bearer '+process.env.AFK_OBSERVED_LOCAL_TOKEN}},res=>{res.resume();res.on('end',()=>process.exit(0));});req.on('error',()=>process.exit(1));req.end('{"model":"wrong-model","input":[]}');`);
  writeFileSync(binary,`#!/bin/sh\nexec '${process.execPath}' '${script}' "$@"\n`);chmodSync(binary,0o700);
  const module=await import(pathToFileURL(join(source,'lib/evaluation/native-witness.mjs'))),directory=join(root,'witness');
  await assert.rejects(module.generateNativeWitness({directory,codex:binary,model:'gpt-6-astra',maxBytes:100000,deadline:Date.now()+10000}),/native invocation incomplete/);
  const refusal=JSON.parse(readFileSync(join(directory,'refusal.json')));assert.equal(refusal.invocations,1);assert.equal(refusal.requests,1);
  assert.equal(readFileSync(join(directory,'request-1.json'),'utf8'),'{"model":"wrong-model","input":[]}');
  assert.match(JSON.parse(readFileSync(join(directory,'request-1.refusal.json'))).reason,/request model/);
});
