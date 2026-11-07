import {coachProviderFields,coachProviderMessages,coachToolReply} from '../src/coach-provider.js';
import {decodeModelContent,normalizeModelReply} from '../src/model-reply.js';
import {COACH_ERRORS,CoachFailure,providerFailure,type CoachFailureCode} from '../src/model-errors.js';
import {validateGameReview} from '../src/game-review.js';
import { CostControl } from './costs.js';
import type { CredentialsStore } from './credentials.js';
import {ApiError,SYSTEM_PROMPT,FREE_CHAT_PROMPT,parseRequest} from '../src/model-contract.js';
export {ApiError,SYSTEM_PROMPT,parseRequest} from '../src/model-contract.js';
import { validateReply, type DialogueRequest, type StrategicReply } from '../src/dialogue.js';

export interface ModelConfig { enabled: boolean; apiKey: string; model: string }
export function readConfig(env: NodeJS.ProcessEnv): ModelConfig {
  return { enabled: env.CHESS_ENABLE_PAID_API === '1', apiKey: env.CHESS_API_KEY ?? '', model: env.CHESS_MODEL ?? '' };
}
async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty response');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 65_536) throw new Error('Response too large');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks).toString('utf8');
}

/** Explicit paid access; usage estimates, one active request, no automatic retries. */
export class ModelService {
  private busy = false;
  private localKeySaved = false;
  constructor(private config: ModelConfig, private transport: typeof fetch = fetch, private store?: CredentialsStore, private costs = new CostControl()) {
    const saved = store?.load(); if (saved) { this.config = saved; this.localKeySaved = true; }
  }
  status(): { available: boolean; remaining: null } {
    return { available: this.config.enabled && !!this.config.apiKey && !!this.config.model, remaining: null };
  }
  diagnostics() { return {localKeySaved:this.localKeySaved,configured:this.status().available,model:this.config.model || null,remaining:this.status().remaining,costs:this.costs.snapshot(),pricingIsEstimate:true}; }
  async probeAccess() {
    if(!this.config.apiKey || !this.config.model)return {ok:false,httpStatus:null,message:'Kein API-Schlüssel und Modell konfiguriert.'};
    try{
      const response=await this.transport(`https://api.openai.com/v1/models/${encodeURIComponent(this.config.model)}`,{
        method:'GET',redirect:'error',headers:{Authorization:`Bearer ${this.config.apiKey}`},signal:AbortSignal.timeout(5000)});
      await response.body?.cancel();
      return {ok:response.ok,httpStatus:response.status,message:response.ok?'Schlüssel und Modellzugriff bestätigt. Keine Textgenerierung ausgeführt.':
        response.status===401?'OpenAI lehnt den Schlüssel ab.':response.status===404?'Modell nicht gefunden oder nicht freigegeben.':response.status===429?'OpenAI meldet ein Kontingent- oder Anfragelimit.':'Zugang vom Anbieter abgelehnt.'};
    }catch{return {ok:false,httpStatus:null,message:'OpenAI nicht erreichbar: Netzwerk, Proxy und TLS-Vertrauen prüfen. Keine Textgenerierung ausgeführt.'};}
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
    if (r.action !== 'connect' || r.allowPaid !== true || typeof r.apiKey !== 'string' ||
        r.apiKey.trim().length < 8 || r.apiKey.length > 1024 || /\s/.test(r.apiKey.trim()) ||
        typeof r.model !== 'string' || !/^[a-zA-Z0-9._:-]{1,100}$/.test(r.model)) {
      throw new ApiError(400, 'Schlüssel, Modell und Kostenfreigabe prüfen.');
    }
    const next = { enabled: true, apiKey: r.apiKey.trim(), model: r.model };
    this.store?.save(next);
    this.localKeySaved = this.store !== undefined;
    this.config = next;
    return this.status();
  }
  async reply(raw: unknown): Promise<StrategicReply> {
    if (!this.status().available) throw new ApiError(403, 'Modellanbindung gesperrt oder nicht konfiguriert.');
    const request = parseRequest(raw);
    if (this.busy) throw new ApiError(429, 'Eine Modellanfrage läuft bereits.');
    const {turns=[],toolExchanges,...currentRequest}=request;
    const retrospective=request.topic==='review'&&(request.hintMode??'explain')==='explain',outputTokens=retrospective||request.topic==='chat'?1800:800;
    const body=JSON.stringify({model:this.config.model,max_completion_tokens:outputTokens,...coachProviderFields(request),...(request.topic==='chat'?{}:{response_format:{type:'json_object'}}),
      messages:[{role:'system',content:request.topic==='chat'?FREE_CHAT_PROMPT:SYSTEM_PROMPT},...turns.map(t=>({role:t.role,content:`[Stellung ${t.nodeId}${t.fen?`, FEN ${t.fen}`:''}] ${t.text}`})),{role:'user',content:JSON.stringify(currentRequest)},...coachProviderMessages(request)]});
    let reservation:number;
    try {reservation=this.costs.reserve(Buffer.byteLength(body),outputTokens);}catch{throw new ApiError(402,'Verbrauch konnte nicht gespeichert werden.');}
    this.busy = true;let failureCode:CoachFailureCode='network';
    try {
      const response = await this.transport('https://api.openai.com/v1/chat/completions', {
        method: 'POST', redirect: 'error',
        headers: { Authorization: `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000),
        body
      });
      if (!response.ok) { await response.body?.cancel(); throw new CoachFailure(providerFailure(response.status)); }
      failureCode='provider_format';
      const envelope = JSON.parse(await readLimited(response));
      this.costs.settle(reservation,envelope.usage);
      if(envelope.choices?.[0]?.finish_reason==='length')throw new CoachFailure('output_limit');
      const toolReply=coachToolReply(envelope.choices?.[0],request);if(toolReply)return toolReply;
      if (envelope.choices?.[0]?.finish_reason !== 'stop') throw new Error('Incomplete response');
      failureCode='reply_format';
      const reply=normalizeModelReply(decodeModelContent(envelope.choices[0].message.content,request.topic!=='chat'), request.legalMoves);
      if(request.topic && !reply.message?.trim())throw new Error('Missing dialogue');
      if(request.hintMode==='question' && (!reply.openQuestions.length || reply.candidates.length))throw new Error('Unwanted solution');
      failureCode='review_format';if(retrospective)validateGameReview(reply.gameReview,request.history);
      return reply;
    } catch(error) { const code=error instanceof CoachFailure?error.code:failureCode;throw new ApiError(502,COACH_ERRORS[code]+' Keine neue Antwort gespeichert.',code); }
    finally { this.busy = false; }
  }
}
