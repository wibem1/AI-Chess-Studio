import {COACH_ERRORS,type CoachFailureCode} from './model-errors.js';
import type { DialogueAdapter, DialogueRequest } from './dialogue.js';

/** Same-origin transport only. Credentials are never accepted by this adapter. */
export class ServerModelAdapter implements DialogueAdapter {
  readonly source = 'model' as const;
  private controller:AbortController|undefined;
  cancel(){this.controller?.abort();}
  constructor(private transport:typeof fetch=(input,init)=>fetch(input,init)){}
  async respond(request: DialogueRequest): Promise<unknown> {
    let response: Response;this.controller=new AbortController();
    try {
      response = await this.transport('/api/dialogue', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request), signal: AbortSignal.any([this.controller.signal,AbortSignal.timeout(20_000)])
      });
    } catch { throw new Error('Modellserver nicht erreichbar oder Zeitlimit überschritten.'); }
    if(!response.ok){
      let code:unknown;try{code=(await response.json()).code;}catch{}
      if(typeof code==='string'&&Object.hasOwn(COACH_ERRORS,code))throw new Error(COACH_ERRORS[code as CoachFailureCode]+' Keine neue Antwort gespeichert.');
      throw new Error(response.status === 402 ? 'Lokales Kosten- oder Anfragebudget erreicht. Kostenkontrolle öffnen.' : response.status === 403
      ? 'Reale KI ist serverseitig gesperrt. Die Simulation bleibt verfügbar.'
      : response.status === 429 ? 'Anfragelimit erreicht oder Anfrage läuft bereits.'
      : response.status===400?'Die Analyseanfrage wurde vor der KI-Verarbeitung abgelehnt (HTTP 400). Keine neue Antwort gespeichert.'
      : response.status===413?'Die Analyseanfrage ist zu groß (HTTP 413). Keine neue Antwort gespeichert.'
      : 'Modellanfrage fehlgeschlagen. Die Fehlerursache wurde nicht übermittelt. Keine neue Antwort gespeichert.');
    }
    return response.json();
  }
}
