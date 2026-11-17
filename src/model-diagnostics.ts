import {APP_VERSION} from './version.js';
/** Request evidence in RAM only. No credentials, headers or private reasoning text. */
export class ModelDiagnostics {
 private records:Record<string,any>[]=[];
 private sequence=0;
 private secrets=new Set<string>();
 private clean(value:unknown):any{
  const visit=(v:any):any=>{
   if(typeof v==='string'){let s=v;for(const key of this.secrets)s=s.split(key).join('[SCHLÜSSEL ENTFERNT]');return s.replace(/\bsk-[A-Za-z0-9_-]{8,}/g,'[SCHLÜSSEL ENTFERNT]').replace(/Bearer\s+[^\s"\\]+/gi,'Bearer [ENTFERNT]');}
   if(Array.isArray(v))return v.map(visit);
   if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>!/(api.?key|authorization|password|reasoning_content|reasoning_details|reasoning_text|encrypted_content|thought_signature|extra_content)/i.test(k)).map(([k,x])=>[k,visit(x)]));
   return v;
  };return visit(value);
 }
 start(request:unknown,metadata:Record<string,unknown>,secret:string){
  if(secret)this.secrets.add(secret);
  const record={id:++this.sequence,startedAt:new Date().toISOString(),...this.clean(metadata),request:this.clean(request),status:'running'};
  this.records.push(record);if(this.records.length>20)this.records.shift();
  const time=Date.now();
  return {id:record.id,
   sent:()=>Object.assign(record,{transportStartedAt:new Date().toISOString()}),
   received:(envelope:any,httpStatus:number)=>Object.assign(record,{httpStatus,response:this.clean({id:envelope?.id,model:envelope?.model,provider:envelope?.provider,usage:envelope?.usage,choices:envelope?.choices?.map((c:any)=>({finish_reason:c.finish_reason,message:{role:c.message?.role,content:c.message?.content,tool_calls:c.message?.tool_calls,refusal:c.message?.refusal}}))})}),
   finish:(status:'accepted'|'failed',errorCode?:string,httpStatus?:number,validationDetail?:string)=>Object.assign(record,{status,errorCode,...(validationDetail?{validationDetail:this.clean(validationDetail)}:{}),httpStatus:httpStatus??(record as any).httpStatus,finishedAt:new Date().toISOString(),elapsedMs:Date.now()-time})
  };
 }
 export(extra:unknown={},secret=''){if(secret)this.secrets.add(secret);return this.clean({extra,schemaVersion:1,appVersion:APP_VERSION,exportedAt:new Date().toISOString(),scope:'Last 20 provider attempts since runtime start. No automatic chess-quality score. Credential-like values are redacted; private reasoning/continuation data is omitted.',requests:this.records});}
 clear(){this.records=[];}
}

/** Default export mode: retain failure evidence while omitting raw prompts, moves, chat and model prose. */
export function compactModelDiagnostics(input:unknown):Record<string,unknown>{
 const source=input&&typeof input==='object'?input as Record<string,any>:{};
 const shortRequest=(raw:any)=>{
  const messages=Array.isArray(raw?.messages)?raw.messages:[];
  const user=[...messages].reverse().find((m:any)=>m?.role==='user');
  const content=typeof user?.content==='string'?user.content:'';
  let payload:any;
  try{payload=JSON.parse(content);}catch{}
  return {
   model:typeof raw?.model==='string'?raw.model:undefined,
   messageCount:messages.length,
   messageSizes:messages.map((m:any)=>({role:typeof m?.role==='string'?m.role:'unknown',characters:typeof m?.content==='string'?m.content.length:0})),
   ...(typeof payload?.topic==='string'?{topic:payload.topic}:{}),
   ...(typeof payload?.hintMode==='string'?{hintMode:payload.hintMode}:{}),
   ...(Array.isArray(payload?.history?.moves)?{historyPlies:payload.history.moves.length}:{}),
   ...(Array.isArray(payload?.context)?{contextParts:payload.context.length,contextCharacters:payload.context.reduce((n:number,x:unknown)=>n+(typeof x==='string'?x.length:0),0)}:{}),
   ...(typeof payload?.question==='string'?{questionCharacters:payload.question.length}:{})
  };
 };
 const shortResponse=(response:any)=>{
  const choices=Array.isArray(response?.choices)?response.choices:[];
  return {
   ...(typeof response?.id==='string'?{id:response.id}:{}),
   ...(typeof response?.model==='string'?{model:response.model}:{}),
   ...(typeof response?.provider==='string'?{provider:response.provider}:{}),
   ...(response?.usage&&typeof response.usage==='object'?{usage:Object.fromEntries(['prompt_tokens','completion_tokens','total_tokens','cost'].filter(k=>response.usage[k]!==undefined).map(k=>[k,response.usage[k]]))}:{}),
   choices:choices.map((choice:any)=>{
    const content=choice?.message?.content;
    let parsed:any;
    if(typeof content==='string')try{parsed=JSON.parse(content.trim());}catch{}
    const review=parsed?.gameReview??(Array.isArray(parsed?.moments)?parsed:undefined);
    return {
     ...(typeof choice?.finish_reason==='string'?{finishReason:choice.finish_reason}:{}),
     ...(typeof content==='string'?{contentCharacters:content.length}:{}),
     ...(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?{responseFields:Object.keys(parsed).slice(0,20)}:{}),
     ...(review&&typeof review==='object'?{gameReview:{...(typeof review.summary==='string'?{summaryCharacters:review.summary.length}:{}),...(typeof review.lesson==='string'?{lessonCharacters:review.lesson.length}:{}),...(Array.isArray(review.moments)?{moments:review.moments.length}:{})}}:{})
    };
   })
  };
 };
 const requests=Array.isArray(source.requests)?source.requests:[];
 return {
  schemaVersion:source.schemaVersion,
  appVersion:source.appVersion,
  exportedAt:source.exportedAt,
  scope:'Kompaktbericht: technische Metadaten und Fehlerdetails; keine Rohprompts, Partie-/Chattexte oder Modellprosa.',
  privacy:'No automatic upload. This compact report omits raw chess positions, moves, prompts, chat text, and model prose.',
  ...(source.extra?.learnerAssessment?{learnerAssessment:source.extra.learnerAssessment}:{}),
  requests:requests.map((record:any)=>({
   id:record.id,
   analysisPhase:record.analysisPhase,
   provider:record.provider,
   model:record.model,
   status:record.status,
   httpStatus:record.httpStatus,
   errorCode:record.errorCode,
   validationDetail:record.validationDetail,
   startedAt:record.startedAt,
   finishedAt:record.finishedAt,
   elapsedMs:record.elapsedMs,
   request:shortRequest(record.request),
   response:shortResponse(record.response)
  }))
 };
}
