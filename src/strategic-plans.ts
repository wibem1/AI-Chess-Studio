import {Chess,type Square} from 'chess.js';
import {strategicFeatures,type StrategicSide} from './strategic-features.js';
import {findKnightRoutes} from './strategic-knight-routes.js';

/**
 * Human-scale planning inspired by the evidence -> plan -> scheme separation in
 * Kibitz. Original TypeScript code; no imported Kibitz Rust implementation.
 * Goals are not engine-verified or forced variations.
 */
export interface HumanStrategicPlan {
 side:StrategicSide;
 goal:'pressure_isolated_pawn'|'support_passed_pawn'|'prepare_pawn_break'|'improve_knight_outpost';
 target:string;
 evidence:string[];
 stages:[string,string,string];
 prerequisites:string[];
 possibleDefense:string[];
 practicalDifficulty:string;
 status:'candidate_not_verified';
 /** The facts that led to this plan, not an engine-derived score. */
 supportingObservations?:string[];
 /** A legal candidate for the current side to move, not a validated best move. */
 candidateMove?:string;
}
export interface StrategicPlanReport {
 fen:string;
 method:'human_plan_hypotheses_v1';
 engineUsed:false;
 warning:string;
 plans:HumanStrategicPlan[];
}
type Piece={square:string;color:StrategicSide;type:string};
const other=(side:StrategicSide):StrategicSide=>side==='w'?'b':'w';
const number=(square:string)=>Number(square[1]);
const fileNumber=(square:string)=>square.charCodeAt(0)-97;

/** Same-file sight, without relying on the mere presence of a rook. */
function directLineClear(pieces:Piece[],from:string,to:string):boolean {
 if(from[0]!==to[0]||from===to)return false;
 const a=number(from),b=number(to);
 return !pieces.some(p=>p.square[0]===from[0]&&number(p.square)>Math.min(a,b)&&number(p.square)<Math.max(a,b));
}
/** Isolated means no FRIENDLY pawns on either neighboring file, not just a pawn without defense. */
function isolated(pieces:Piece[],pawn:Piece):boolean {
 return !pieces.some(p=>p.color===pawn.color&&p.type==='p'&&Math.abs(fileNumber(p.square)-fileNumber(pawn.square))===1);
}
function passed(pieces:Piece[],pawn:Piece):boolean {
 const forward=pawn.color==='w'?1:-1;
 return !pieces.some(p=>p.color!==pawn.color&&p.type==='p'&&
   Math.abs(fileNumber(p.square)-fileNumber(pawn.square))<=1&&
   (number(p.square)-number(pawn.square))*forward>0);
}

/** A legal non-capture pawn advance that would create contact with an enemy pawn. */
function pawnLevers(board:Chess,pieces:Piece[],side:StrategicSide):Array<{san:string;from:string;to:string;target:string}> {
 if(board.turn()!==side)return [];
 const results:Array<{san:string;from:string;to:string;target:string}>=[];
 const forward=side==='w'?1:-1;
 for(const mv of board.moves({verbose:true})){
  if(mv.piece!=='p'||mv.captured||mv.promotion)continue;
  const target=pieces.find(p=>p.type==='p'&&p.color!==side&&
     Math.abs(fileNumber(p.square)-fileNumber(mv.to))===1&&
     number(p.square)-number(mv.to)===forward);
  if(target)results.push({san:mv.san,from:mv.from,to:mv.to,target:target.square});
 }
 return results;
}
export function strategicPlans(fen:string):StrategicPlanReport {
 const board=new Chess(fen);
 const pieces=board.board().flat().filter((p):p is NonNullable<typeof p>=>p!==null) as Piece[];
 const out:HumanStrategicPlan[]=[];
 const features=strategicFeatures(board.fen());
 const pawnPieces=pieces.filter(p=>p.type==='p');
 // Immediate king safety and forced game endings outrank long-range strategy.
 if(board.inCheck()||board.isGameOver())return {fen:board.fen(),method:'human_plan_hypotheses_v1',engineUsed:false,warning:'Akute Schachlage oder Spielende: keine ungesicherten langfristigen Pläne; zuerst die konkrete Königssicherheit beziehungsweise das Partieergebnis klären.',plans:[]};
 for(const side of ['w','b'] as const){
  const enemy=other(side);
  // Use all actual pawns, not the transport-limited six observations per side.
  for(const pawn of pawnPieces.filter(p=>p.color===enemy&&isolated(pieces,p))){
   const target=pawn.square;
   // A rook's visible file is insufficient: the interval must be unblocked.
   const rook=pieces.find(p=>p.color===side&&p.type==='r'&&
     p.square[0]===target[0]&&directLineClear(pieces,p.square,target));
   if(!rook)continue;
   // Synthesize related independent findings, following Kibitz's plan-clustering
   // *idea*, but do not elevate this evidence to a tactical verdict.
   const supporters=[`Isolierter gegnerischer Bauer ${target}`,`Ungestörte Turmlinie ${rook.square}–${target}`];
   if(features.observations.some(o=>o.side===side&&o.kind==='half_open_file'&&o.squares.includes(rook.square)))
    supporters.push(`Halboffene ${target[0]}-Linie ohne eigenen Bauern`);
   const defended=board.isAttacked(target as Square,enemy);
   const defenderFact=defended
      ?`Der Bauer ${target} wird durch mindestens eine gegnerische Figur oder einen gegnerischen Bauern gedeckt; deren Abtausch oder Ablenkung prüfen.`
      :`Eine unmittelbare gegnerische Deckung des Bauern ${target} ist im statischen Angriffsbild nicht erkennbar; taktische Zwischenzüge trotzdem prüfen.`;
   supporters.push(defenderFact);
   const friendlyAdditional=pieces.filter(p=>p.color===side&&p.type==='r'&&p.square!==rook.square).length;
   if(friendlyAdditional) supporters.push('Ein weiterer Turm ist für mögliche Verdopplung vorhanden');
   out.push({side,goal:'pressure_isolated_pawn',target,evidence:[rook.square,target],
    supportingObservations:supporters,
    stages:[`Den isolierten gegnerischen Bauern ${target} als mögliches langfristiges Ziel identifizieren; der Turm auf ${rook.square} hat eine freie Linie dorthin.`,
       `Die Verteidiger von ${target} untersuchen und erst danach zusätzliche Figuren in günstige Stellungen führen.`,
       `Nur bei ausreichender Deckung und sicherer Zugfolge den Angriff auf ${target} verstärken oder einen günstigen Abtausch anstreben.`],
    prerequisites:[defenderFact,'Gegenschläge, legale Zugfolge und mögliche Taktik prüfen.','Beachten, ob der Angriff auf den Bauern den eigenen König oder eine andere Figur gefährdet.'],
    possibleDefense:[defended?`Der Bauer ${target} ist bereits gedeckt; der Gegner kann die Verteidigung verstärken oder abtauschen.`:`Der Gegner kann ${target} künftig decken oder den Bauern vorrücken.`,'Aktive Drohungen auf der anderen Brettseite können die Vorbereitung überholen.'],
    practicalDifficulty:'Langfristige Aufgabe mit möglichem Gegenspiel; ein offener Turmangriff ist kein garantierter Bauerngewinn.',
    status:'candidate_not_verified'});
  }
  for(const pawn of pawnPieces.filter(p=>p.color===side&&passed(pieces,p)).slice(0,2)){
   const target=pawn.square;
   const ahead=String.fromCharCode(target.charCodeAt(0))+String(number(target)+(side==='w'?1:-1));
   const front=pieces.find(p=>p.square===ahead);
   out.push({side,goal:'support_passed_pawn',target,evidence:[target,...(front?[ahead]:[])],
    supportingObservations:[`Freibauer ${target}`,...(front?[`Das Feld ${ahead} ist durch eine Figur besetzt.`]:[])],
    stages:[`Gegnerische Blockadefelder und die Deckung des Freibauern ${target} untersuchen.`,
      'Unterstützende Figuren verbessern und zugleich gegnerische Gegenspielmöglichkeiten begrenzen.',
      `Den Bauern ${target} nur vorziehen, wenn die unmittelbare Antwort untersucht wurde.`],
    prerequisites:[front?`Das Vorfeld ${ahead} ist belegt: Art und Wirkung der Blockade prüfen.`:'Potenzielle gegnerische Blockaden durch Figuren oder König prüfen.',
       'Prüfen, ob das Vorziehen andere wichtige Felder oder Figuren ungeschützt lässt.'],
    possibleDefense:['Blockade durch Figuren oder König, Angriff auf die Bauernbasis und Gegenspiel am anderen Flügel.'],
    practicalDifficulty:'Ein Freibauer ist ein strategischer Trumpf, beweist allein aber weder Gewinn noch einfaches Spiel.',
    status:'candidate_not_verified'});
  }
  // Kibitz-inspired grouping: route -> supported square -> intended benefit.
  // A sequence of knight hops is not a legal variation with opponent replies.
  for(const route of findKnightRoutes(board.fen()).filter(r=>r.side===side)){
   const via=route.path.join('–');
   out.push({side,goal:'improve_knight_outpost',target:route.to,evidence:[...route.path,route.supportingPawn],
     supportingObservations:[`Springerweg ${via}`,`Eigener Bauer auf ${route.supportingPawn} kontrolliert ${route.to}`,`Keine gegnerische Bauernattacke auf ${route.to} in der aktuellen Stellung`],
     ...(route.firstMove?{candidateMove:route.firstMove}:{}),
     stages:[`Den von ${route.supportingPawn} gestützten Vorposten ${route.to} als mögliches Ziel erkennen.`,
       `Springer über ${via} heranführen, aber vor jeder Etappe neue Drohungen und gegnerische Antworten prüfen.`,
       `Erst nach sicherer Besetzung von ${route.to} untersuchen, welche gegnerischen Felder und Figuren der Springer tatsächlich einschränkt.`],
     prerequisites:[`Der Weg ${via} ist nur eine statische Feldfolge, nicht als vollständige Zugvariante gegen Gegenspiel geprüft.`,
       'Zwischen den Springerzügen hat der Gegner eigene Züge; nach jedem Zug die Route erneut validieren.'],
     possibleDefense:['Der Gegner kann Zwischenfelder kontrollieren, den Stützbauern angreifen oder die Stellung durch Abtausch verändern.'],
     practicalDifficulty:'Mehrere Züge mit unabhängigen gegnerischen Antworten; Vorposten kann unterwegs taktisch unbrauchbar werden.',
     status:'candidate_not_verified'});
  }
  // Unlike a generic structural observation, this candidate is a legal current
  // move. A legal pawn contact is still not a tactically safe recommendation.
  for(const lever of pawnLevers(board,pieces,side).slice(0,1)){
   out.push({side,goal:'prepare_pawn_break',target:lever.target,
    evidence:[lever.from,lever.to,lever.target],
    candidateMove:lever.san,
    supportingObservations:[`Der legale Bauernzug ${lever.san} stellt Kontakt zum gegnerischen Bauern ${lever.target} her.`],
    stages:[`Mit ${lever.san} könnte ein Bauernhebel gegen ${lever.target} vorbereitet werden.`,
       'Prüfen, ob der gegnerische Bauer schlägt, zieht oder verteidigt wird, und welche Linien sich dann öffnen.',
       'Erst nach Beurteilung der entstehenden Bauernstruktur und Figurensicherheit den Hebel fortsetzen.'],
    prerequisites:[`${lever.san} ist legal, aber weder auf taktische Haltbarkeit noch auf strategischen Nutzen geprüft.`,
      'Eine Bauernberührung kann beide Seiten begünstigen; die gegnerischen Antworten einzeln prüfen.'],
    possibleDefense:[`Der Gegner kann den Bauern ${lever.target} abtauschen, decken oder die Initiative anderswo übernehmen.`],
    practicalDifficulty:'Konkreter legaler Ansatz, aber hoher Prüfbedarf: ein Bauernhebel verändert die Stellung dauerhaft.',
    status:'candidate_not_verified'});
  }
 }
 const plans=(['w','b'] as const).flatMap(side=>{
  const own=out.filter(p=>p.side===side);
  // Reserve one leading plan per side to preserve the free chat context budget,
  // favoring observable pressure and pawn levers
  // over speculative promotion plans in complicated positions.
  return own.sort((a,b)=>({pressure_isolated_pawn:0,improve_knight_outpost:1,prepare_pawn_break:2,support_passed_pawn:3}[a.goal]-
                            {pressure_isolated_pawn:0,improve_knight_outpost:1,prepare_pawn_break:2,support_passed_pawn:3}[b.goal])).slice(0,1);
 });
 return {fen:board.fen(),method:'human_plan_hypotheses_v1',engineUsed:false,
  warning:'Geordnete Ziele statt erzwungener Züge: statische Planung ohne Engine, ohne Prognose menschlicher Fehlerwahrscheinlichkeit. Lediglich candidateMove ist auf aktuelle Zuglegalität geprüft; nicht auf taktische Sicherheit oder Vorteil.',plans};
}
