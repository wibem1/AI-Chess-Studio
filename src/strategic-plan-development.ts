import {Chess} from 'chess.js';
import {strategicPlans,type HumanStrategicPlan} from './strategic-plans.js';

export type PlanChange='still_candidate'|'goal_obsolete'|'reconsider';
export interface PlanDevelopment {
 side:'w'|'b';
 goal:HumanStrategicPlan['goal'];
 target:string;
 change:PlanChange;
 reason:string;
}
/**
 * Re-check a previously identified goal after ONE real, legal half-move.
 * Statuses never claim success, a tactical refutation or objective best play.
 * Every invocation re-evaluates the actual new position (no cached claims).
 */
export function strategicPlanDevelopment(beforeFen:string,san:string):{
 fromFen:string;toFen:string;played:string;engineUsed:false;changes:PlanDevelopment[]
}{
 const before=new Chess(beforeFen),fromFen=before.fen();
 if(!before.moves().includes(san))throw new Error('Ungültiger Zug zur Planfortschreibung.');
 const goals=strategicPlans(fromFen).plans;
 const mv=before.move(san),toFen=before.fen();
 const updated=strategicPlans(toFen).plans;
 const changes:PlanDevelopment[]=goals.map(plan=>{
  const now=before.get(plan.target as Parameters<Chess['get']>[0]);
  // Goal ownership distinguishes a conquered enemy pawn from one's own passed pawn.
  if(plan.goal==='pressure_isolated_pawn' && (now?.type!=='p'||now.color===plan.side)){
   return {side:plan.side,goal:plan.goal,target:plan.target,change:'goal_obsolete' as const,
    reason:'Der ursprünglich angegriffene gegnerische Bauer ist nicht mehr auf dem Zielfeld. Einen neuen Plan auswählen.'};
  }
  if(plan.goal==='support_passed_pawn' && (now?.type!=='p'||now.color!==plan.side)){
   return {side:plan.side,goal:plan.goal,target:plan.target,change:'goal_obsolete' as const,
    reason:'Der ursprüngliche eigene Freibauer steht nicht mehr auf dem Zielfeld; ein vorgerückter Freibauer muss auf seinem neuen Feld erneut untersucht werden.'};
  }
  const same=updated.some(p=>p.side===plan.side&&p.goal===plan.goal&&p.target===plan.target);
  if(same)return {side:plan.side,goal:plan.goal,target:plan.target,change:'still_candidate' as const,
   reason:'Das strategische Ziel ist nach dem gespielten Zug weiterhin als ungeprüfte Hypothese erkennbar; gegnerische Antworten und Taktik bleiben zu prüfen.'};
  // Give a concrete reason when the original rook's file becomes obstructed.
  // Do not confuse a blocked ray with tactical refutation or an engine verdict.
  if(plan.goal==='pressure_isolated_pawn'){
   const rookFrom=plan.evidence[0];
   if(rookFrom && rookFrom[0]===plan.target[0]){
    const r0=Number(rookFrom[1]),r1=Number(plan.target[1]);
    const blocker=before.board().flat().find(p=>p &&
      p.square[0]===rookFrom[0] && Number(p.square[1])>Math.min(r0,r1) &&
      Number(p.square[1])<Math.max(r0,r1));
    if(blocker)return {side:plan.side,goal:plan.goal,target:plan.target,change:'reconsider' as const,
      reason:`Die ursprünglich freie Turmlinie zum Ziel ${plan.target} ist nun durch eine Figur auf ${blocker.square} blockiert. Die ursprüngliche Angriffsabsicht muss neu geprüft werden.`};
   }
  }
  return {side:plan.side,goal:plan.goal,target:plan.target,change:'reconsider' as const,
    reason:'Der bisherige Plan ist nicht mehr der führende statische Kandidat dieser Seite. Das beweist keine Widerlegung; Voraussetzungen und Alternativen neu untersuchen.'};
 }).slice(0,2);
 return {fromFen,toFen,played:mv.san,engineUsed:false,changes};
}

/** Reconstruct the predecessor position only from a verified legal history. */
export function strategicPlanDevelopmentFromHistory(history:{rootFen:string;moves:string[]}){
 if(!history.moves.length)return undefined;
 const chess=new Chess(history.rootFen);
 for(const move of history.moves.slice(0,-1)){
  if(!chess.moves().includes(move))throw new Error('Ungültige Vorgeschichte für Strategie.');
  chess.move(move);
 }
 const last=history.moves.at(-1)!;
 return strategicPlanDevelopment(chess.fen(),last);
}
