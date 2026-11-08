import {COACH_TOOLS,parseCoachCall} from './coach-tools.js';
import type {DialogueRequest} from './dialogue.js';
import type {ProviderOptions} from './model-provider.js';

/** Direct OpenAI Sol uses Responses; OpenRouter retains Chat Completions. */
export const needsResponses=(config:ProviderOptions&{model:string})=>
  (config.provider??'openai')==='openai'&&/^gpt-6(?:\.\d+)?(?:-sol|-terra|-luna|-astra)(?:-|$)/.test(config.model);

export function createResponsesBody(config:ProviderOptions&{model:string},request:DialogueRequest,systemPrompt:string,current:unknown,turns:Array<{role:string;nodeId:string;fen?:string;text:string}>,maxTokens:number){
 const input:Record<string,unknown>[]=[{role:'system',content:systemPrompt}];
 for(const turn of turns)input.push({role:turn.role,content:`[Stellung ${turn.nodeId}${turn.fen?`, FEN ${turn.fen}`:''}] ${turn.text}`});
 input.push({role:'user',content:JSON.stringify(current)});
 // Continuation is rebuilt from the locally validated results, never from an untrusted model script.
 for(const e of request.toolExchanges??[]){
  const call=parseCoachCall(e.call);
  input.push({type:'function_call',call_id:call.id,name:call.function.name,arguments:call.function.arguments});
  input.push({type:'function_call_output',call_id:call.id,output:JSON.stringify(e.result)});
 }
 const toolEnabled=request.topic==='chat'&&request.toolsEnabled&&(request.toolExchanges?.length??0)<2;
 const tools=(request.matchTest?COACH_TOOLS.filter(t=>t.function.name==='show_line'):toolEnabled?COACH_TOOLS:[]).map(t=>({
  type:'function',name:t.function.name,description:t.function.description,parameters:t.function.parameters,strict:false
 }));
 return {
  model:config.model,input,store:false,parallel_tool_calls:false,
  max_output_tokens:config.reasoning?({low:8192,medium:16384,high:32768}[config.reasoning]):Math.max(maxTokens,2048),
  ...(config.reasoning?{reasoning:{effort:config.reasoning}}:{}),
  ...(tools.length?{tools,tool_choice:request.matchTest?{type:'function',name:'show_line'}:'auto'}:{})
 };
}

/** Normalize the Responses result into the already validated coach-tool and dialogue pipeline. */
export function normalizeResponses(envelope:any){
 if(!envelope||!Array.isArray(envelope.output)||typeof envelope.status!=='string')throw new Error('Ungültige Responses-Antwort.');
 if(envelope.status==='incomplete')return {choices:[{finish_reason:'length',message:{content:null}}],usage:normalizeUsage(envelope.usage)};
 if(envelope.status!=='completed')throw new Error('Responses-Anfrage nicht vollständig.');
 const calls=envelope.output.filter((item:any)=>item?.type==='function_call');
 const texts=envelope.output.filter((item:any)=>item?.type==='message').flatMap((item:any)=>Array.isArray(item.content)?item.content:[]).filter((item:any)=>item?.type==='output_text'&&typeof item.text==='string').map((item:any)=>item.text);
 if(calls.length>1)throw new Error('Mehrere Brettaktionen gleichzeitig sind unzulässig.');
 if(calls.length===1){
  const item=calls[0];
  const call=parseCoachCall({id:item.call_id,type:'function',function:{name:item.name,arguments:item.arguments}});
  return {choices:[{finish_reason:'tool_calls',message:{content:texts.join('\n'),tool_calls:[call]}}],usage:normalizeUsage(envelope.usage)};
 }
 if(!texts.length)throw new Error('Keine Textantwort.');
 return {choices:[{finish_reason:'stop',message:{content:texts.join('\n')}}],usage:normalizeUsage(envelope.usage)};
}
function normalizeUsage(usage:any){
 if(!usage||!Number.isSafeInteger(usage.input_tokens)||!Number.isSafeInteger(usage.output_tokens))return undefined;
 return {prompt_tokens:usage.input_tokens,completion_tokens:usage.output_tokens};
}
