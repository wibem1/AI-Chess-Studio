import {CoachFailure} from './model-errors.js';
import {COACH_TOOLS,exchangeMessages,parseCoachCall,type CoachCall} from './coach-tools.js';
import {normalizeModelReply} from './model-reply.js';
import type {DialogueRequest,StrategicReply} from './dialogue.js';
export function coachProviderFields(request:DialogueRequest){return request.topic==='chat'&&request.toolsEnabled&&(request.toolExchanges?.length??0)<2?{tools:COACH_TOOLS,parallel_tool_calls:false}:{};}
export function coachProviderMessages(request:DialogueRequest){return exchangeMessages(request.toolExchanges??[]);}
export function coachToolReply(choice:any,request:DialogueRequest):StrategicReply|undefined{
 if(choice?.finish_reason!=='tool_calls')return;
 if(request.topic!=='chat'||!request.toolsEnabled||(request.toolExchanges?.length??0)>=2||!Array.isArray(choice.message?.tool_calls)||choice.message.tool_calls.length!==1)throw new CoachFailure('tool_format');
 let call:CoachCall;try{call=parseCoachCall(choice.message.tool_calls[0]);}catch{throw new CoachFailure('tool_format');}
 const content=typeof choice.message.content==='string'?choice.message.content.slice(0,1000):'';
 return {...normalizeModelReply({message:content||'Eine Brettaktion ist angefordert.'},request.legalMoves),toolCall:call};
}
