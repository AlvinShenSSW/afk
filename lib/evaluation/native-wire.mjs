import { digestBytes } from '../gate/review-receipt.mjs';

export function wireBound(value) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('explicit positive wire bound required');
  return value;
}
function bodyText(bytes, maxBytes) {
  wireBound(maxBytes);
  if (!Buffer.isBuffer(bytes) || bytes.length > maxBytes) throw new Error('wire body byte bound');
  return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
}
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const token = value => Number.isSafeInteger(value) && value >= 0;
const nonempty = value => typeof value === 'string' && value.length > 0;
const sourceDigest = value => digestBytes(JSON.stringify(value));
function requireWire(value, reason) { if (!value) throw new Error(reason); }

export function decodeNativeRequest(bytes, {maxBytes}) {
  wireBound(maxBytes);
  const result={status:'unavailable',reason:null,bodyDigest:Buffer.isBuffer(bytes)?digestBytes(bytes):null,
    model:null,tools:[],instructions:[],assistantMessages:[],calls:[],outputs:[],opaque:[],registryWitnesses:[],inventoryQualified:false};
  try {
    const body=JSON.parse(bodyText(bytes,maxBytes));
    requireWire(object(body)&&nonempty(body.model),'request model missing'); result.model=body.model;
    const ids=new Set();
    function tools(rows,source,namespace='') {
      requireWire(Array.isArray(rows),'tool declaration array missing');
      for (const [index,row] of rows.entries()) {
        const path=`${source}/${index}`;
        requireWire(object(row)&&nonempty(row.type),'invalid tool declaration');
        if(row.type==='namespace') {
          requireWire(nonempty(row.name)&&!row.name.includes('.'),'invalid tool namespace');
          tools(row.tools,`${path}/tools`,`${namespace}${row.name}.`); continue;
        }
        requireWire(['function','custom'].includes(row.type)&&nonempty(row.name),'unsupported tool declaration');
        const id=namespace+row.name; requireWire(!ids.has(id),'duplicate tool declaration'); ids.add(id);
        result.tools.push({id,type:row.type,source:path,digest:sourceDigest(row)});
      }
    }
    function instruction(text,role,source) {
      requireWire(typeof text==='string','invalid instruction text');
      (role==='assistant'?result.assistantMessages:result.instructions).push({role,text,source,digest:digestBytes(text)});
    }
    if(body.tools!==undefined) tools(body.tools,'/tools');
    if(body.instructions!==undefined&&body.instructions!==null) instruction(body.instructions,'system','/instructions');
    if(typeof body.input==='string') instruction(body.input,'user','/input');
    else {
      requireWire(Array.isArray(body.input),'request input missing');
      for(const [index,item] of body.input.entries()) {
        const source=`/input/${index}`; requireWire(object(item),'invalid input item');
        if(item.type==='additional_tools') tools(item.tools,`${source}/tools`);
        else if(['function_call','custom_tool_call'].includes(item.type)) {
          requireWire(nonempty(item.call_id)&&nonempty(item.name),'invalid tool call');
          requireWire(!result.calls.some(call=>call.callId===item.call_id),'duplicate tool call');
          result.calls.push({callId:item.call_id,name:item.name,namespace:item.namespace??null,input:item.input??item.arguments??null,source,digest:sourceDigest(item)});
        } else if(['function_call_output','custom_tool_call_output'].includes(item.type)) {
          requireWire(nonempty(item.call_id)&&item.output!==undefined,'invalid tool output');
          requireWire(!result.outputs.some(output=>output.callId===item.call_id),'duplicate tool output');
          result.outputs.push({callId:item.call_id,output:item.output,source,digest:sourceDigest(item)});
        } else if(['system','developer','user','assistant'].includes(item.role)&&(!item.type||item.type==='message')) {
          if(typeof item.content==='string') instruction(item.content,item.role,`${source}/content`);
          else {
            requireWire(Array.isArray(item.content),'message content missing');
            for(const [n,part] of item.content.entries()) {
              if(['input_text','output_text'].includes(part?.type)) instruction(part.text,item.role,`${source}/content/${n}`);
              else result.opaque.push({source:`${source}/content/${n}`,digest:sourceDigest(part),reason:'non-text message content'});
            }
          }
        } else result.opaque.push({source,digest:sourceDigest(item),reason:'uninterpreted input item'});
      }
    }
    for(const output of result.outputs) {
      const call=result.calls.find(call=>call.callId===output.callId);
      if(call?.namespace!=='functions'||call.name!=='exec'||call.input!=='text(ALL_TOOLS)') continue;
      const texts=typeof output.output==='string'?[output.output]:Array.isArray(output.output)?output.output.filter(p=>p.type==='input_text').map(p=>p.text):[];
      const candidates=[];
      for(const text of texts) {
        let entries; try { entries=JSON.parse(text); } catch { continue; }
        if(!Array.isArray(entries)||!entries.length||!entries.every(e=>object(e)&&nonempty(e.name)&&typeof e.description==='string')) continue;
        if(new Set(entries.map(e=>e.name)).size!==entries.length) continue;
        candidates.push(entries);
      }
      if(candidates.length===1) result.registryWitnesses.push({callId:call.callId,callSource:call.source,outputSource:output.source,entries:candidates[0],digest:output.digest});
    }
    result.status='observed';
  } catch(error) { result.reason=error.message; }
  return result;
}

const EVENT_TYPES=new Set(['response.created','response.in_progress','response.completed','response.failed','response.incomplete',
  'response.output_item.added','response.output_item.done','response.content_part.added','response.content_part.done',
  'response.output_text.delta','response.output_text.done','response.function_call_arguments.delta','response.function_call_arguments.done',
  'response.custom_tool_call_input.delta','response.custom_tool_call_input.done','response.reasoning_summary_part.added',
  'response.reasoning_summary_part.done','response.reasoning_summary_text.delta','response.reasoning_summary_text.done',
  'response.reasoning_text.delta','response.reasoning_text.done','response.refusal.delta','response.refusal.done','error']);

export function decodeNativeResponse(bytes, {maxBytes,contentType,requestedModel}) {
  wireBound(maxBytes);
  const result={status:'unavailable',reason:null,bodyDigest:Buffer.isBuffer(bytes)?digestBytes(bytes):null,
    complete:false,observedModel:null,observedModels:[],usage:null,events:[],response:null};
  try {
    requireWire(nonempty(requestedModel),'requested model missing');
    requireWire(/^text\/event-stream(?:\s*;|$)/i.test(contentType??''),'unsupported response content type');
    const text=bodyText(bytes,maxBytes).replaceAll('\r\n','\n');
    requireWire(text.endsWith('\n\n'),'incomplete SSE framing');
    const models=new Set(),identities=new Set(); let terminal=null,ended=false;
    for(const block of text.split('\n\n').slice(0,-1)) {
      if(!block) continue;
      const data=[]; let name=null;
      for(const line of block.split('\n')) {
        if(line.startsWith(':')) continue;
        const match=/^(event|data|id|retry): ?(.*)$/.exec(line);
        requireWire(match,'unsupported SSE field');
        if(match[1]==='event') {requireWire(name===null,'duplicate SSE event field');name=match[2];}
        if(match[1]==='data') data.push(match[2]);
      }
      if(!data.length) continue;
      if(data.join('\n')==='[DONE]') {requireWire(terminal&&!ended,'unexpected SSE done');ended=true;continue;}
      requireWire(!terminal&&!ended,'event after terminal');
      const event=JSON.parse(data.join('\n'));
      requireWire(object(event)&&EVENT_TYPES.has(event.type),'unsupported SSE event');
      requireWire(name===null||name===event.type,'SSE event name mismatch'); result.events.push(event);
      if(nonempty(event.response?.model)) models.add(event.response.model);
      if(nonempty(event.response?.id)) identities.add(event.response.id);
      result.observedModels=[...models];
      if(['response.failed','response.incomplete','error'].includes(event.type)) throw new Error('unsuccessful response terminal');
      if(event.type==='response.completed') terminal=event.response;
    }
    requireWire(object(terminal)&&terminal.status==='completed'&&nonempty(terminal.id),'complete response terminal missing');
    requireWire(identities.size===1&&identities.has(terminal.id),'response identity conflicting');
    requireWire(models.size===1&&models.has(requestedModel)&&terminal.model===requestedModel,'response model missing or conflicting');
    const usage=terminal.usage;
    requireWire(object(usage)&&token(usage.input_tokens)&&token(usage.output_tokens),'response usage unknown');
    const cached=usage.input_tokens_details?.cached_tokens;
    requireWire(cached===undefined||token(cached)&&cached<=usage.input_tokens,'invalid cached usage');
    result.usage={input_tokens:usage.input_tokens,output_tokens:usage.output_tokens,cached_input_tokens:cached??null};
    result.response=terminal; result.observedModel=requestedModel; result.complete=true; result.status='observed';
  } catch(error) { result.reason=error.message; }
  return result;
}
