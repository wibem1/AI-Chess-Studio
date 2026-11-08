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
   if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>!/(api.?key|authorization|password|reasoning_content|reasoning_details|reasoning_text|thought_signature|extra_content)/i.test(k)).map(([k,x])=>[k,visit(x)]));
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
