export interface CostState {
 budgetUsd:number;inputUsdPerMillion:number;outputUsdPerMillion:number;
 requests:number;estimatedUsd:number;promptTokens:number;completionTokens:number;uncertainRequests:number;
}
const defaults:CostState={budgetUsd:0.05,inputUsdPerMillion:0.4,outputUsdPerMillion:1.6,requests:0,estimatedUsd:0,promptTokens:0,completionTokens:0,uncertainRequests:0};
/** Usage estimate only. budgetUsd is retained solely for old saved records; never enforced. */
export class CostLedger {
 private state:CostState;
 constructor(saved:unknown=null,private onSave?:(next:CostState)=>void){this.state=saved===null?{...defaults}:this.validate(saved);}
 private validate(raw:unknown):CostState {
  if(!raw || typeof raw!=='object') throw new Error('Ungültige Kostenkontrolle.');
  const r=raw as CostState;
  if(Object.keys(defaults).some(k=>typeof r[k as keyof CostState]!=='number' || !Number.isFinite(r[k as keyof CostState]) || r[k as keyof CostState]<0) ||
   r.budgetUsd>1000 || r.inputUsdPerMillion>1000000 || r.outputUsdPerMillion>1000000 ||
   ['requests','promptTokens','completionTokens','uncertainRequests'].some(k=>!Number.isSafeInteger(r[k as keyof CostState]))) throw new Error('Ungültige Kostenkontrolle.');
  return {...r};
 }
 private set(next:CostState):void {this.validate(next);this.onSave?.(next);this.state=next;}
 snapshot():CostState{return {...this.state};}
 configure(raw:unknown):CostState {
  const r=raw as Record<string,unknown>|null;
  if(!r || typeof r!=='object')throw new Error('Preisannahmen prüfen.');
  if(r.action==='configure'){
   if(typeof r.inputUsdPerMillion!=='number' || typeof r.outputUsdPerMillion!=='number' || r.inputUsdPerMillion<=0 || r.outputUsdPerMillion<=0)throw new Error('Preisannahmen prüfen.');
   this.set({...this.state,inputUsdPerMillion:r.inputUsdPerMillion,outputUsdPerMillion:r.outputUsdPerMillion});
  } else throw new Error('Ungültige Kostenaktion.');
  return this.snapshot();
 }
 reserve(inputBytes:number,outputTokens:number):number {
  const s=this.state;
  // UTF-8 bytes plus framing margin conservatively bound input tokens for normal text.
  const reserved=((inputBytes+1024)*s.inputUsdPerMillion+outputTokens*s.outputUsdPerMillion)/1000000;
  this.set({...s,requests:s.requests+1,estimatedUsd:s.estimatedUsd+reserved,uncertainRequests:s.uncertainRequests+1});
  return reserved;
 }
 settle(reserved:number,usage:unknown):void {
  const r=usage as {prompt_tokens?:unknown;completion_tokens?:unknown}|null;
  if(!r || !Number.isSafeInteger(r.prompt_tokens) || !Number.isSafeInteger(r.completion_tokens) || Number(r.prompt_tokens)<0 || Number(r.completion_tokens)<0)return;
  const input=Number(r.prompt_tokens),output=Number(r.completion_tokens),s=this.state;
  const cost=(input*s.inputUsdPerMillion+output*s.outputUsdPerMillion)/1000000;
  this.set({...s,estimatedUsd:Math.max(0,s.estimatedUsd-reserved+cost),promptTokens:s.promptTokens+input,completionTokens:s.completionTokens+output,uncertainRequests:Math.max(0,s.uncertainRequests-1)});
 }
}
