import {Chess} from 'chess.js';
import {strategicFeatures,type StrategicSide} from './strategic-features.js';

/** Structured, engine-free multi-stage plan hypotheses. Never claimed forced or best. */
export interface HumanStrategicPlan {
 side:StrategicSide;
 goal:'pressure_isolated_pawn'|'support_passed_pawn';
 target:string;
 evidence:string[];
 stages:[string,string,string];
 prerequisites:string[];
 possibleDefense:string[];
 practicalDifficulty:string;
 status:'candidate_not_verified';
}
export interface StrategicPlanReport {
 fen:string;
 method:'human_plan_hypotheses_v1';
 engineUsed:false;
 warning:string;
 plans:HumanStrategicPlan[];
}
export function strategicPlans(fen:string):StrategicPlanReport {
 const board=new Chess(fen),pieces=board.board().flat().filter((p):p is NonNullable<typeof p>=>p!==null);
 const features=strategicFeatures(fen),out:HumanStrategicPlan[]=[];
 const pawnAt=(square:string)=>pieces.find(p=>p.square===square&&p.type==='p');
 for(const side of ['w','b'] as const){
  const enemy=side==='w'?'b':'w';
  const seenTargets=new Set<string>();
  const enemyIsolated=features.observations.filter(o=>o.side===enemy&&o.kind==='isolated_pawn');
  for(const isolated of enemyIsolated){
   const target=isolated.squares[0]!;
   const rook=pieces.find(p=>p.color===side&&p.type==='r'&&p.square[0]===target[0]);
   if(!rook||seenTargets.has(target))continue;
   seenTargets.add(target);
   out.push({side,goal:'pressure_isolated_pawn',target,evidence:[rook.square,target],
    stages:[`Die Drucklinie des Turms auf ${rook.square} gegen den isolierten Bauern ${target} untersuchen.`,
      `Eindringen oder weitere Figuren zur Linie ${target[0]} führen, sofern die Wege tatsächlich offen und sicher sind.`,
      `Erst nach Prüfung gegnerischer Deckung und möglicher Abtausche den Bauern ${target} angreifen oder gewinnen.`],
    prerequisites:['Blockierende Figuren, die gegnerischen Verteidiger und die eigenen Zugtempi ermitteln.','Vor jedem Vorstoß konkrete Schlag- und Gegenangriffe kontrollieren.'],
    possibleDefense:['Der Gegner kann den Bauern mit Figuren decken oder eine aktive Gegeninitiative beginnen.','Ein Abtausch auf der Linie kann den geplanten Druck neutralisieren.'],
    practicalDifficulty:'Mehrere Vorbereitungszüge; Erfolg hängt von der Zugfolge und gegnerischen Aktivität ab.',
    status:'candidate_not_verified'});
  }
  const passed=features.observations.filter(o=>o.side===side&&o.kind==='passed_pawn');
  for(const candidate of passed.slice(0,2)){
   const target=candidate.squares[0]!;
   if(!pawnAt(target))continue;
   out.push({side,goal:'support_passed_pawn',target,evidence:[target],
    stages:[`Mögliche Blockadefelder vor dem Freibauern ${target} und die gegnerischen Kontrollfelder bestimmen.`,
      'Unterstützende Figuren so verbessern, dass der Bauer vorankommen könnte, ohne dass andere Schwächen entstehen.',
      `Den Bauern ${target} erst vorziehen, wenn die konkrete gegnerische Antwort geprüft ist.`],
    prerequisites:['Blockade durch Figuren und Könige prüfen.','Zugrecht, Tempo und mögliche Gegenangriffe berücksichtigen.'],
    possibleDefense:['Der Gegner kann den Freibauern blockieren, angreifen oder durch einen eigenen Freibauern ablenken.'],
    practicalDifficulty:'Langfristiger Plan; die bloße Existenz eines Freibauern beweist keinen Vorteil.',
    status:'candidate_not_verified'});
  }
 }
 // Symmetric reservation for both colors and compact transport size.
 const plans=(['w','b'] as const).flatMap(side=>out.filter(p=>p.side===side).slice(0,2));
 return {fen:board.fen(),method:'human_plan_hypotheses_v1',engineUsed:false,
 warning:'Ausschließlich statische, nicht verifizierte Planentwürfe. Stufen sind strategische Absichten, keine geprüften oder erzwungenen Schachzüge; keine Stockfish-Wertung, keine behauptete Spielbarkeit.',plans};
}
