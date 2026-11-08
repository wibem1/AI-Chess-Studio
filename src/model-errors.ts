/** Fixed, non-sensitive messages. Never display provider bodies or exception text. */
export const COACH_ERRORS={
 network:'Die Verbindung zum KI-Anbieter wurde unterbrochen oder konnte nicht aufgebaut werden.',
 timeout:'Die KI-Anfrage hat das Zeitlimit überschritten. Es wurde nicht automatisch erneut angefragt.',
 provider_auth:'Der KI-Anbieter hat den gespeicherten Zugang abgelehnt (HTTP 401/403).',
 provider_limit:'Der KI-Anbieter meldet ein Kontingent- oder Anfragelimit (HTTP 429).',
 provider_http:'Der KI-Anbieter hat die Anfrage abgelehnt. Modell und Anbieterzugang prüfen.',
 provider_format:'Der KI-Anbieter hat keine lesbare vollständige Antwort geliefert.',
 output_limit:'Die KI-Antwort wurde am Ausgabe-Limit abgeschnitten und deshalb nicht übernommen.',
 reply_format:'Die KI-Antwort entspricht nicht dem benötigten Antwortformat und wurde nicht übernommen.',
 tool_format:'Die KI hat einen unzulässigen Brettbefehl geliefert. Keine Brettaktion ausgeführt.',
 review_format:'Die KI lieferte keinen gültigen Partierückblick: Lernmomente, Zugbezüge oder Alternativen passen nicht zur Partie.'
} as const;
export type CoachFailureCode=keyof typeof COACH_ERRORS;
export function providerFailure(status:number):CoachFailureCode{return status===401||status===403?'provider_auth':status===429?'provider_limit':'provider_http';}
export class CoachFailure extends Error{constructor(readonly code:CoachFailureCode){super(COACH_ERRORS[code]);}}
