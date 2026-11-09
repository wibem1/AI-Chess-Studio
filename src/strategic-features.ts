import {Chess} from 'chess.js';

/**
 * Engine-free, position-bound strategic observations.
 * Inspired by Kibitz's evidence-first architecture; original TypeScript implementation.
 * No centipawn score, forced claim, best-move promise or tactical safety certificate.
 */
export type StrategicSide='w'|'b';
export type StrategicKind='isolated_pawn'|'doubled_pawns'|'passed_pawn'|'open_file'|'half_open_file'|'bishop_pair'|'supported_knight';
export interface StrategicObservation {
 kind:StrategicKind;
 side:StrategicSide;
 squares:string[];
 observation:string;
 planHypothesis:string;
 confidence:'board_fact'|'interpretation';
}
export interface StrategicFeatures {
 fen:string;
 method:'static_human_features_v1';
 engineUsed:false;
 limitations:string;
 observations:StrategicObservation[];
}
type BoardPiece={square:string;type:string;color:StrategicSide};
const file=(sq:string)=>sq.charCodeAt(0)-97;
const rank=(sq:string)=>Number(sq[1]);
const sideName=(side:StrategicSide)=>side==='w'?'Weiß':'Schwarz';
const push=(items:StrategicObservation[],fact:StrategicObservation)=>{if(items.length<12)items.push(fact);};

/** Recompute from FEN. Never trust externally supplied observations. */
export function strategicFeatures(fen:string):StrategicFeatures {
 const board=new Chess(fen);
 const pieces=board.board().flat().filter((p):p is NonNullable<typeof p>=>p!==null) as BoardPiece[];
 const pawns=pieces.filter(p=>p.type==='p');
 const observations:StrategicObservation[]=[];
 // Produce deterministic, compact findings. Separate descriptive facts from cautious plan hypotheses.
 for(const side of ['w','b'] as const){
  const own=pawns.filter(p=>p.color===side);
  const enemy=pawns.filter(p=>p.color!==side);
  const ownLabel=sideName(side);
  for(let f=0;f<8;f++){
   const onFile=own.filter(p=>file(p.square)===f);
   if(onFile.length>1)push(observations,{kind:'doubled_pawns',side,squares:onFile.map(p=>p.square).sort(),observation:`${ownLabel}: ${onFile.length} Bauern auf der ${String.fromCharCode(97+f)}-Linie.`,planHypothesis:'Beweglichkeit und gegenseitige Deckung dieser Bauern untersuchen; nicht automatisch als Nachteil werten.',confidence:'board_fact'});
  }
  for(const pawn of own){
   const f=file(pawn.square),r=rank(pawn.square),direction=side==='w'?1:-1;
   const adjacent=own.some(p=>Math.abs(file(p.square)-f)===1);
   if(!adjacent)push(observations,{kind:'isolated_pawn',side,squares:[pawn.square],observation:`${ownLabel}: Bauer ${pawn.square} ohne eigenen Bauern auf benachbarter Linie.`,planHypothesis:'Prüfen, ob der Bauer durch Figuren gedeckt werden muss oder ein aktives Gegenspiel ermöglicht.',confidence:'board_fact'});
   const blocker=enemy.some(p=>Math.abs(file(p.square)-f)<=1&&(rank(p.square)-r)*direction>0);
   // A passed pawn is a pawn without ENEMY pawns ahead on its own or adjacent files.
   if(!blocker&&r>=2&&r<=7)push(observations,{kind:'passed_pawn',side,squares:[pawn.square],observation:`${ownLabel}: Bauer ${pawn.square} hat keinen gegnerischen Bauern vor sich auf seiner oder einer Nachbarlinie (Freibauer).`,planHypothesis:'Vorrücken und Blockademöglichkeiten prüfen; Figuren und Könige können den Bauern weiterhin aufhalten.',confidence:'board_fact'});
  }
  // Lines have educational value when a rook or queen already occupies them.
  const majors=pieces.filter(p=>p.color===side&&(p.type==='r'||p.type==='q'));
  for(const major of majors){
   const f=file(major.square), onOwn=pawns.some(p=>p.color===side&&file(p.square)===f),onEnemy=pawns.some(p=>p.color!==side&&file(p.square)===f);
   if(!onOwn&&!onEnemy)push(observations,{kind:'open_file',side,squares:[major.square],observation:`${ownLabel}: ${major.type==='r'?'Turm':'Dame'} auf der bauernfreien ${String.fromCharCode(97+f)}-Linie.`,planHypothesis:'Prüfen, ob die Figur die Linie tatsächlich nutzen oder auf ihr eindringen kann.',confidence:'board_fact'});
   else if(!onOwn&&onEnemy)push(observations,{kind:'half_open_file',side,squares:[major.square],observation:`${ownLabel}: ${major.type==='r'?'Turm':'Dame'} auf einer halboffenen ${String.fromCharCode(97+f)}-Linie (kein eigener Bauer).`,planHypothesis:'Ein mögliches Ziel auf dieser Linie identifizieren; gegnerische Kontrolle berücksichtigen.',confidence:'board_fact'});
  }
  const bishops=pieces.filter(p=>p.color===side&&p.type==='b');
  if(bishops.length>=2)push(observations,{kind:'bishop_pair',side,squares:bishops.map(p=>p.square).sort(),observation:`${ownLabel} besitzt beide Läufer.`,planHypothesis:'Prüfen, ob offene Diagonalen und die Bauernstruktur das Läuferpaar begünstigen.',confidence:'board_fact'});
  for(const knight of pieces.filter(p=>p.color===side&&p.type==='n')){
   const f=file(knight.square),r=rank(knight.square),direction=side==='w'?1:-1;
   if((side==='w'?r>=5:r<=4)&&own.some(p=>Math.abs(file(p.square)-f)===1&&rank(p.square)===r-direction))
    push(observations,{kind:'supported_knight',side,squares:[knight.square],observation:`${ownLabel}: Springer ${knight.square} in der gegnerischen Hälfte durch einen eigenen Bauern gedeckt.`,planHypothesis:'Prüfen, ob dieser Springer dauerhaft stehen kann oder durch gegnerische Bauern vertrieben wird.',confidence:'board_fact'});
  }
 }
 return {fen:board.fen(),method:'static_human_features_v1',engineUsed:false,limitations:'Brettmerkmale ohne Zugtiefensuche. Pläne sind prüfbedürftige Hypothesen, keine Stellungsbewertung, keine taktische Freigabe und keine nachgewiesenen besten Züge.',observations};
}
