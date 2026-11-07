import {providerOf,type ProviderOptions} from './model-provider.js';
import {CoachFailure} from './model-errors.js';
import {COACH_TOOLS,exchangeMessages,parseCoachCall,type CoachCall} from './coach-tools.js';
import {normalizeModelReply} from './model-reply.js';
import type {DialogueRequest,StrategicReply} from './dialogue.js';
export function coachProviderFields(request:DialogueRequest){if(request.matchTest)return {tools:COACH_TOOLS.filter(t=>t.function.name==='show_line'),parallel_tool_calls:false,tool_choice:{type:'function',function:{name:'show_line'}}};return request.topic==='chat'&&request.toolsEnabled&&(request.toolExchanges?.length??0)<2?{tools:COACH_TOOLS,parallel_tool_calls:false}:{};}
export function coachProviderMessages(request:DialogueRequest){return exchangeMessages(request.toolExchanges??[]);}
export function coachToolReply(choice:any,request:DialogueRequest):StrategicReply|undefined{
 if(choice?.finish_reason!=='tool_calls')return;
 if(request.topic!=='chat'||!request.toolsEnabled||(request.toolExchanges?.length??0)>=2||!Array.isArray(choice.message?.tool_calls)||choice.message.tool_calls.length!==1)throw new CoachFailure('tool_format');
 let call:CoachCall;try{call=parseCoachCall(choice.message.tool_calls[0]);}catch{throw new CoachFailure('tool_format');}
 const content=typeof choice.message.content==='string'?choice.message.content.slice(0,1000):'';
 return {...normalizeModelReply({message:content||'Eine Brettaktion ist angefordert.'},request.legalMoves),toolCall:call};
}

/** Provider-owned continuation data never leaves this runtime or enters diagnostics. */
export class ProviderContinuity {
 private messages=new Map<string,any>();
 clear(){this.messages.clear();}
 remember(message:any){
  const call=message?.tool_calls?.[0];if(typeof call?.id!=='string'||!Array.isArray(message.tool_calls)||message.tool_calls.length!==1)return;
  this.messages.set(call.id,{role:'assistant',content:message.content??null,tool_calls:structuredClone(message.tool_calls),...(message.reasoning_details?{reasoning_details:structuredClone(message.reasoning_details)}:{})});
  while(this.messages.size>6)this.messages.delete(this.messages.keys().next().value!);
 }
 restore(messages:ReturnType<typeof coachProviderMessages>){return messages.map((m:any)=>{
  if(m.role!=='assistant')return m;const c=m.tool_calls?.[0],saved=this.messages.get(c?.id);if(!saved)return m;
  if(parseCoachCall(c).function.arguments!==parseCoachCall(saved.tool_calls[0]).function.arguments||c.function.name!==saved.tool_calls[0].function.name)throw new Error('Werkzeugkontext wurde verändert.');
  return saved;
 });}
}

export function taggedReply(reply:StrategicReply,config:ProviderOptions&{model:string},envelope:any,traceId:number):StrategicReply{
 if(providerOf(config)!=='openrouter')return reply;
 const cost=envelope?.usage?.cost;
 return {...reply,provenance:{provider:typeof envelope.provider==='string'?envelope.provider.slice(0,80):'OpenRouter',model:typeof envelope.model==='string'?envelope.model.slice(0,160):config.model,requestedModel:config.model,reasoning:config.reasoning??null,costUsd:typeof cost==='number'&&Number.isFinite(cost)&&cost>=0?cost:null,traceId}};
}
export function providerToolFields(config:ProviderOptions,request:DialogueRequest){const fields=coachProviderFields(request);if(providerOf(config)==='openrouter'){const {parallel_tool_calls,...supported}=fields;return supported;}return fields;}
