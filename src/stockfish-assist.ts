import type {DialogueRequest} from './dialogue.js';
import {validateTacticalReport,type TacticalAdapter} from './tactics.js';
import {Chess} from 'chess.js';

/** Add one verified, position-specific search result to an explicitly requested learning answer. */
export async function withStockfishAssessment(request:DialogueRequest,adapter:TacticalAdapter):Promise<DialogueRequest>{
 if(request.topic!=='chat'||request.matchTest||(request.toolExchanges?.length??0)>0)return request;
 const board=new Chess(request.fen);
 if(board.isGameOver())throw new Error('Stockfish-Stellungsprüfung: Die aktuelle Stellung ist bereits beendet. Schalte den Faktencheck aus oder wähle eine spielbare Stellung. Keine KI-Anfrage gesendet.');
 const report=validateTacticalReport(await adapter.check(request.fen,null),request.fen);
 if(report.candidate!==null)throw new Error('Stockfish-Faktencheck lieferte eine Kandidatenprüfung statt einer Stellungsbewertung. Keine KI-Anfrage gesendet.');
 const score=report.score.unit==='cp'?((report.score.value>=0?'+':'')+(report.score.value/100).toFixed(2)+' Bauerneinheiten aus Sicht Weiß'):(report.score.value>0?'Matt für Weiß in '+report.score.value:report.score.value<0?'Matt für Schwarz in '+(-report.score.value):'Mattbewertung 0');
 const facts=`Stockfish-Faktencheck ausschließlich für FEN ${report.fen}: ${score}; Suchstand Tiefe ${report.depth}, ${report.nodes} Knoten, ${report.elapsedMs} ms; Hauptvariante ${report.line.slice(0,8).join(' ')}. Begrenzte Suche: max. Tiefe 12, 20.000 Knoten, 1 s, keine garantierte Bestvariante; keine Aussage über andere Partiestellungen. Erkläre, welche konkreten taktischen Merkmale diesen Befund plausibel machen, statt die Zahl zu wiederholen.`;
 return {...request,context:[facts.slice(0,800),...(request.context??[])].slice(0,6)};
}
