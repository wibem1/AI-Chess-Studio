import {validateGameReview} from '../src/game-review.js';
import { CostControl } from './costs.js';
import type { CredentialsStore } from './credentials.js';
import {ApiError,SYSTEM_PROMPT,parseRequest} from '../src/model-contract.js';
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

/** Explicit cost gate; no retries; three attempts per server process, including failures. */
export class ModelService {
  private attempts = 0;
  private busy = false;
  private localKeySaved = false;
  constructor(private config: ModelConfig, private transport: typeof fetch = fetch, private store?: CredentialsStore, private costs = new CostControl()) {
    const saved = store?.load(); if (saved) { this.config = saved; this.localKeySaved = true; }
  }
  status(): { available: boolean; remaining: number } {
    return { available: this.config.enabled && !!this.config.apiKey && !!this.config.model, remaining: Math.max(0, Math.min(3 - this.attempts, 3 - this.costs.snapshot().requests)) };
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
  configureCosts(raw:unknown) {if(this.busy)throw new ApiError(429,'Eine Modellanfrage läuft bereits.');try{return this.costs.configure(raw);}catch{throw new ApiError(400,'Budget und Preisannahmen prüfen.');}}
  configure(raw: unknown): { available: boolean; remaining: number } {
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
    // Reconfiguring never resets the process-wide request budget.
    return this.status();
  }
  async reply(raw: unknown): Promise<StrategicReply> {
    if (!this.status().available) throw new ApiError(403, 'Modellanbindung gesperrt oder nicht konfiguriert.');
    const request = parseRequest(raw);
    if (this.busy || this.attempts >= 3) throw new ApiError(429, 'Anfragelimit erreicht.');
    const {turns=[],...currentRequest}=request;
    const retrospective=request.topic==='review'&&(request.hintMode??'explain')==='explain',outputTokens=retrospective?1800:800;
    const body=JSON.stringify({model:this.config.model,max_completion_tokens:outputTokens,response_format:{type:'json_object'},
      messages:[{role:'system',content:SYSTEM_PROMPT},...turns.map(t=>({role:t.role,content:`[Stellung ${t.nodeId}${t.fen?`, FEN ${t.fen}`:''}] ${t.text}`})),{role:'user',content:JSON.stringify(currentRequest)}]});
    let reservation:number;
    try {reservation=this.costs.reserve(Buffer.byteLength(body),outputTokens);}catch{throw new ApiError(402,'Lokales Anfrage- oder Kostenbudget erreicht.');}
    this.attempts++; this.busy = true;
    try {
      const response = await this.transport('https://api.openai.com/v1/chat/completions', {
        method: 'POST', redirect: 'error',
        headers: { Authorization: `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000),
        body
      });
      if (!response.ok) { await response.body?.cancel(); throw new Error('Provider rejected request'); }
      const envelope = JSON.parse(await readLimited(response));
      this.costs.settle(reservation,envelope.usage);
      if (envelope.choices?.[0]?.finish_reason !== 'stop') throw new Error('Incomplete response');
      const reply=validateReply(JSON.parse(envelope.choices[0].message.content), request.legalMoves);
      if((request.hintMode??'explain')==='explain' && !retrospective && !reply.assessment)throw new Error('Missing assessment');
      if(request.topic && !reply.message?.trim())throw new Error('Missing dialogue');
      if(request.hintMode && !reply.humanFactors)throw new Error('Missing human analysis');
      if(request.hintMode==='question' && (!reply.openQuestions.length || reply.candidates.length))throw new Error('Unwanted solution');
      if(retrospective)validateGameReview(reply.gameReview,request.history);
      return reply;
    } catch { throw new ApiError(502, 'Modellanfrage fehlgeschlagen oder Antwort ungültig.'); }
    finally { this.busy = false; }
  }
}
