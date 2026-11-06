import type { DialogueAdapter, DialogueRequest } from './dialogue.js';

/** Same-origin transport only. Credentials are never accepted by this adapter. */
export class ServerModelAdapter implements DialogueAdapter {
  readonly source = 'model' as const;
  constructor(private transport:typeof fetch=(input,init)=>fetch(input,init)){}
  async respond(request: DialogueRequest): Promise<unknown> {
    let response: Response;
    try {
      response = await this.transport('/api/dialogue', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request), signal: AbortSignal.timeout(20_000)
      });
    } catch { throw new Error('Modellserver nicht erreichbar oder Zeitlimit überschritten.'); }
    if (!response.ok) throw new Error(response.status === 402 ? 'Lokales Kosten- oder Anfragebudget erreicht. Kostenkontrolle öffnen.' : response.status === 403
      ? 'Reale KI ist serverseitig gesperrt. Die Simulation bleibt verfügbar.'
      : response.status === 429 ? 'Anfragelimit erreicht oder Anfrage läuft bereits.'
      : 'Modellanfrage fehlgeschlagen. Keine Antwort gespeichert.');
    return response.json();
  }
}
