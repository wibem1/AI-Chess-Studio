import {ModelDiagnostics} from '../src/model-diagnostics.js';
import {providerBase,providerOf,providerOptions,validModel,generationOptions,modelCatalog,type ProviderOptions} from '../src/model-provider.js';
import {taggedReply,providerToolFields,ProviderContinuity,coachProviderFields,coachProviderMessages,coachToolReply} from '../src/coach-provider.js';
import {decodeModelContent,normalizeModelReply} from '../src/model-reply.js';
import {COACH_ERRORS,CoachFailure,providerFailure,type CoachFailureCode} from '../src/model-errors.js';
import {validateGameReview,ReviewValidationError} from '../src/game-review.js';
import { CostControl } from './costs.js';
import type { CredentialsStore } from './credentials.js';
import {ApiError,SYSTEM_PROMPT,FREE_CHAT_PROMPT,parseRequest} from '../src/model-contract.js';
export {ApiError,SYSTEM_PROMPT,parseRequest} from '../src/model-contract.js';
import { validateReply, type DialogueRequest, type StrategicReply } from '../src/dialogue.js';

export interface ModelConfig extends ProviderOptions { enabled: boolean; apiKey: string; model: string }
export function readConfig(env: NodeJS.ProcessEnv): ModelConfig {
  return { enabled: env.CHESS_ENABLE_PAID_API === '1', apiKey: env.CHESS_API_KEY ?? '', model: env.CHESS_MODEL ?? '' };
}
async function readLimited(response: Response,maxBytes=65_536): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty response');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Response too large');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks).toString('utf8');
}

/** Explicit paid access; usage estimates, one active request, no automatic retries. */
export class ModelService {
  private busy = false;
  readonly traces=new ModelDiagnostics();
 private continuity=new ProviderContinuity();
  exportDiagnostics(extra:unknown){return this.traces.export(extra,this.config.apiKey);}
  models(){return modelCatalog(this.transport);}
  private localKeySaved = false;
  constructor(private config: ModelConfig, private transport: typeof fetch = fetch, private store?: CredentialsStore, private costs = new CostControl()) {
    const saved = store?.load(); if (saved) { this.config = saved; this.localKeySaved = true; }
  }
  status(): { available: boolean; remaining: null } {
    return { available: this.config.enabled && !!this.config.apiKey && !!this.config.model, remaining: null };
  }
  diagnostics() { return {localKeySaved:this.localKeySaved,configured:this.status().available,provider:providerOf(this.config),reasoning:this.config.reasoning??null,model:this.config.model || null,remaining:this.status().remaining,costs:this.costs.snapshot(),pricingIsEstimate:true}; }
  async probeAccess() {
    if(!this.config.apiKey || !this.config.model)return {ok:false,httpStatus:null,message:'Kein API-Schlüssel und Modell konfiguriert.'};
    try{
      const response=await this.transport(providerOf(this.config)==='openrouter'?providerBase(this.config)+'/key':`${providerBase(this.config)}/models/${encodeURIComponent(this.config.model)}`,{
        method:'GET',redirect:'error',headers:{Authorization:`Bearer ${this.config.apiKey}`},signal:AbortSignal.timeout(5000)});
      await response.body?.cancel();
      return {ok:response.ok,httpStatus:response.status,message:response.ok?(providerOf(this.config)==='openrouter'?'OpenRouter-Schlüssel akzeptiert; Modellzugriff und Brettwerkzeuge noch nicht geprüft.':'Schlüssel und Modellzugriff bestätigt. Keine Textgenerierung ausgeführt.'):
        response.status===401?'Der gewählte Anbieter lehnt den Schlüssel ab.':response.status===404?'Modell nicht gefunden oder nicht freigegeben.':response.status===429?'Der gewählte Anbieter meldet ein Kontingent- oder Anfragelimit.':'Zugang vom Anbieter abgelehnt.'};
    }catch{return {ok:false,httpStatus:null,message:'Der gewählte Anbieter ist nicht erreichbar. Netzwerkverbindung prüfen. Keine Textgenerierung ausgeführt.'};}
  }
  configureCosts(raw:unknown) {if(this.busy)throw new ApiError(429,'Eine Modellanfrage läuft bereits.');try{return this.costs.configure(raw);}catch{throw new ApiError(400,'Preisannahmen prüfen.');}}
  configure(raw: unknown): { available: boolean; remaining: null } {
    if (this.busy) throw new ApiError(429, 'Eine Modellanfrage läuft bereits.');
    const r = raw as Record<string, unknown> | null;
    if (!r || typeof r !== 'object') throw new ApiError(400, 'Ungültige Konfiguration.');
    if (r.action === 'disconnect') {
      this.store?.clear();
      this.localKeySaved = false;
      this.config = { enabled: false, apiKey: '', model: '' };
      return this.status();
    }
    if(r.action==='select-model'){
      if(!this.status().available||r.provider!==providerOf(this.config)||!validModel(r.model,this.config))throw new ApiError(400,'Aktiven Provider und Modell prüfen.');
      const next={...this.config,model:r.model,...providerOptions(r)};if(r.reasoning===undefined)delete next.reasoning;this.store?.save(next);this.continuity.clear();this.config=next;return this.status();
    }
    if (r.action !== 'connect' || r.allowPaid !== true || typeof r.apiKey !== 'string' ||
        r.apiKey.trim().length < 8 || r.apiKey.length > 1024 || /\s/.test(r.apiKey.trim()) ||
        typeof r.model !== 'string' || !validModel(r.model,providerOptions(r))) {
      throw new ApiError(400, 'Schlüssel, Modell und Kostenfreigabe prüfen.');
    }
    const next = { enabled: true, apiKey: r.apiKey.trim(), model: r.model,...providerOptions(r) };
    this.store?.save(next);
    this.localKeySaved = this.store !== undefined;
    this.continuity.clear();this.config = next;
    return this.status();
  }
  async reply(raw: unknown,signal?:AbortSignal): Promise<StrategicReply> {
    if (!this.status().available) throw new ApiError(403, 'Modellanbindung gesperrt oder nicht konfiguriert.');
    const request = parseRequest(raw);if(request.expectedModel&&request.expectedModel!==this.config.model)throw new ApiError(409,'Modell während des Testlaufs gewechselt.');
    if (this.busy) throw new ApiError(429, 'Eine Modellanfrage läuft bereits.');
    const {turns=[],toolExchanges,...currentRequest}=request;
    const retrospective=request.topic==='review'&&(request.hintMode??'explain')==='explain',outputTokens=retrospective||request.topic==='chat'?1800:800;
    const body=JSON.stringify({model:this.config.model,...generationOptions(this.config,outputTokens),...providerToolFields(this.config,request),...(request.topic==='chat'?{}:{response_format:{type:'json_object'}}),
      messages:[{role:'system',content:request.topic==='chat'?FREE_CHAT_PROMPT:SYSTEM_PROMPT},...turns.map(t=>({role:t.role,content:`[Stellung ${t.nodeId}${t.fen?`, FEN ${t.fen}`:''}] ${t.text}`})),{role:'user',content:JSON.stringify(currentRequest)},...(providerOf(this.config)==='openrouter'?this.continuity.restore(coachProviderMessages(request)):coachProviderMessages(request))]});
    let reservation:number;
    try {reservation=this.costs.reserve(Buffer.byteLength(body),JSON.parse(body).max_tokens??JSON.parse(body).max_completion_tokens);}catch{throw new ApiError(402,'Verbrauch konnte nicht gespeichert werden.');}
    const trace=this.traces.start(JSON.parse(body),{nodeId:request.nodeId,fen:request.fen,provider:providerOf(this.config),model:this.config.model,reasoning:this.config.reasoning??null,toolRound:request.toolExchanges?.length??0,priceAssumptions:this.costs.snapshot()},this.config.apiKey);
    this.busy = true;let httpStatus:number|undefined;let failureCode:CoachFailureCode='network';
    try {
      trace.sent();const response = await this.transport(providerBase(this.config)+'/chat/completions', {
        method: 'POST', redirect: 'error',
        headers: { Authorization: `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.any([AbortSignal.timeout(this.config.reasoning?90_000:15_000),...(signal?[signal]:[])]),
        body
      });
      httpStatus=response.status;
      if (!response.ok) { await response.body?.cancel(); throw new CoachFailure(providerFailure(response.status)); }
      failureCode='provider_format';
      const envelope = JSON.parse(await readLimited(response,providerOf(this.config)==='openrouter'?524288:65536));
      if(providerOf(this.config)==='openrouter')this.continuity.remember(envelope.choices?.[0]?.message);trace.received(envelope,response.status);this.costs.settle(reservation,envelope.usage);
      if(envelope.choices?.[0]?.finish_reason==='length')throw new CoachFailure('output_limit');
      const toolReply=coachToolReply(envelope.choices?.[0],request);if(toolReply){trace.finish('accepted');return taggedReply(toolReply,this.config,envelope,trace.id);}
      if (envelope.choices?.[0]?.finish_reason !== 'stop') throw new Error('Incomplete response');
      failureCode='reply_format';
      const reply=normalizeModelReply(decodeModelContent(envelope.choices[0].message.content,request.topic!=='chat'), request.legalMoves);
      if(request.topic && !reply.message?.trim())throw new Error('Missing dialogue');
      if(request.hintMode==='question' && (!reply.openQuestions.length || reply.candidates.length))throw new Error('Unwanted solution');
      failureCode='review_format';if(retrospective)reply.gameReview=validateGameReview(reply.gameReview,request.history,true);
      trace.finish('accepted');return taggedReply(reply,this.config,envelope,trace.id);
    } catch(error) { const code=error instanceof CoachFailure?error.code:failureCode;trace.finish('failed',code,httpStatus,error instanceof ReviewValidationError?error.message:undefined);throw new ApiError(502,(error instanceof ReviewValidationError?error.message:COACH_ERRORS[code])+' Keine neue Antwort gespeichert.',code); }
    finally { this.busy = false; }
  }
}
