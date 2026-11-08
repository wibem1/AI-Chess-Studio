export type Provider='openai'|'openrouter';
export interface ProviderOptions {provider?:Provider;reasoning?:'low'|'medium'|'high'}
export const providerOf=(c:ProviderOptions):Provider=>c.provider??'openai';
export const providerBase=(c:ProviderOptions)=>providerOf(c)==='openrouter'?'https://openrouter.ai/api/v1':'https://api.openai.com/v1';
export function providerOptions(r:Record<string,any>):ProviderOptions{
 if(r.provider!==undefined&&!['openai','openrouter'].includes(r.provider)||r.reasoning!==undefined&&!['low','medium','high'].includes(r.reasoning))throw new Error('Provider und Denkstufe prüfen.');
 return {...(r.provider?{provider:r.provider}:{}),...(r.reasoning?{reasoning:r.reasoning}:{})};
}
export const isBatchModel=(model:unknown):boolean=>typeof model==='string'&&/:batch$/i.test(model);
export function validModel(model:unknown,options:ProviderOptions):model is string{return typeof model==='string'&&!isBatchModel(model)&&(providerOf(options)==='openrouter'?/^[a-zA-Z0-9._:-]+\/[a-zA-Z0-9._:/-]+$/:/^[a-zA-Z0-9._:-]+$/).test(model)&&model.length<=160;}
export function generationOptions(c:ProviderOptions,defaultTokens:number){
 const routing=providerOf(c)==='openrouter'?{provider:{require_parameters:true}}:{};
 if(!c.reasoning)return providerOf(c)==='openrouter'?{...routing,max_tokens:defaultTokens}:{max_completion_tokens:defaultTokens};
 const tokens={low:8192,medium:16384,high:32768}[c.reasoning];
 return providerOf(c)==='openrouter'?{...routing,max_tokens:tokens,reasoning:{effort:c.reasoning}}:{max_completion_tokens:tokens,reasoning_effort:c.reasoning};
}
export interface CatalogModel {id:string;name:string;inputUsdPerMillion:number;outputUsdPerMillion:number;tools:boolean;reasoning:boolean}
export async function modelCatalog(transport:typeof fetch):Promise<CatalogModel[]>{
 const response=await transport('https://openrouter.ai/api/v1/models',{method:'GET',redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok){await response.body?.cancel();throw new Error('Modellkatalog nicht erreichbar.');}
 const reader=response.body?.getReader();if(!reader)throw new Error('Modellkatalog fehlt.');let bytes=0,parts:Uint8Array[]=[];
 try{for(;;){const p=await reader.read();if(p.done)break;bytes+=p.value.length;if(bytes>4_000_000)throw new Error('Modellkatalog zu groß.');parts.push(p.value);}}finally{await reader.cancel().catch(()=>{});}
 const joined=new Uint8Array(bytes);let offset=0;for(const p of parts){joined.set(p,offset);offset+=p.length;}
 const data=JSON.parse(new TextDecoder().decode(joined));if(!Array.isArray(data.data))throw new Error('Modellkatalog ungültig.');
 return data.data.filter((m:any)=>validModel(m.id,{provider:'openrouter'})&&Array.isArray(m.architecture?.output_modalities)&&m.architecture.output_modalities.includes('text')&&!isBatchModel(m.id)&&Number.isFinite(Number(m.pricing?.prompt))&&Number(m.pricing.prompt)>=0&&Number.isFinite(Number(m.pricing?.completion))&&Number(m.pricing.completion)>=0).slice(0,1000).map((m:any)=>({id:m.id,name:String(m.name??m.id).slice(0,180),inputUsdPerMillion:Number(m.pricing.prompt)*1e6,outputUsdPerMillion:Number(m.pricing.completion)*1e6,tools:m.supported_parameters?.includes('tools')===true,reasoning:m.supported_parameters?.includes('reasoning')===true||m.supported_parameters?.includes('reasoning_effort')===true}));
}
