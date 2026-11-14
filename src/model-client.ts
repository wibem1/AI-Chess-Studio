import {COACH_ERRORS,type CoachFailureCode} from './model-errors.js';
import type { DialogueAdapter, DialogueRequest } from './dialogue.js';

/** Same-origin transport only. Credentials are never accepted by this adapter. */
export class ServerModelAdapter implements DialogueAdapter {
  readonly source = 'model' as const;
  private controller:AbortController|undefined;
  cancel(){this.controller?.abort();}
  constructor(private transport:typeof fetch=(input,init)=>fetch(input,init),private preferences:()=>string=()=>'',private enrich:(request:DialogueRequest)=>Promise<DialogueRequest>=async request=>request ){}
  async respond(request: DialogueRequest): Promise<unknown> {
    let response: Response;this.controller=new AbortController();
    try {
      request = await this.enrich(request);
      response = await this.transport('/api/dialogue', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...request,...(this.preferences().trim()?{generalInstructions:this.preferences().trim()}: {})}), signal: AbortSignal.any([this.controller.signal,AbortSignal.timeout(request.topic==='review'&&(request.hintMode??'explain')==='explain'?200_000:100_000)])
      });
    } catch(error) { throw new Error(error instanceof Error?error.message:'Modellserver nicht erreichbar oder Zeitlimit überschritten.'); }
    if(!response.ok){
      let code:unknown,detail:unknown;try{const body=await response.json();code=body.code;detail=body.error;}catch{}
      if(code==='review_format'&&typeof detail==='string'&&detail.startsWith('Analyse verworfen:'))throw new Error(detail.slice(0,1600));
      if(typeof code==='string'&&Object.hasOwn(COACH_ERRORS,code)){
        // Only forward a bounded numeric HTTP status, never an arbitrary provider response body.
        const status=code==='provider_http'&&typeof detail==='string'?detail.match(/\(HTTP (400|404|405|409|422|500|502|503|504)(?:\s|\))/)?.[1]:undefined;
        throw new Error(COACH_ERRORS[code as CoachFailureCode]+(status?` (HTTP ${status})`:'')+' Keine neue Antwort gespeichert.');
      }
      if(response.status===409)throw new Error('Modell oder Zugang wurde während des Testlaufs geändert.');
      throw new Error(response.status === 402 ? 'Verbrauch konnte nicht gespeichert werden. Diagnose öffnen.' : response.status === 403
      ? 'Reale KI ist serverseitig gesperrt. Die Simulation bleibt verfügbar.'
      : response.status === 429 ? 'Anfragelimit erreicht oder Anfrage läuft bereits.'
      : response.status===400?'Die Analyseanfrage wurde vor der KI-Verarbeitung abgelehnt (HTTP 400). Keine neue Antwort gespeichert.'
      : response.status===413?'Die Analyseanfrage ist zu groß (HTTP 413). Keine neue Antwort gespeichert.'
      : 'Modellanfrage fehlgeschlagen. Die Fehlerursache wurde nicht übermittelt. Keine neue Antwort gespeichert.');
    }
    return response.json();
  }
}
