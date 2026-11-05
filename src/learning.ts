export type HintMode='question'|'hint'|'explain';
export interface Reflection { idea:string; reasoning:string; uncertainty:string; goal:string; hintMode:HintMode }
export interface HumanFactors { idea:string; calculation:string; pitfalls:string; continuation:string }
export function validateReflection(raw:unknown):Reflection {
 if(!raw || typeof raw!=='object')throw new Error('Ungültiger Gedankengang.');
 const r=raw as Reflection,limits={idea:200,reasoning:240,uncertainty:160,goal:120};
 for(const [key,max] of Object.entries(limits))if(typeof r[key as keyof typeof limits]!=='string' || r[key as keyof typeof limits].length>max)throw new Error('Gedankengang zu lang oder ungültig.');
 if(!['question','hint','explain'].includes(r.hintMode))throw new Error('Ungültiger Hinweisumfang.');
 return {idea:r.idea.trim(),reasoning:r.reasoning.trim(),uncertainty:r.uncertainty.trim(),goal:r.goal.trim(),hintMode:r.hintMode};
}
export function validateHumanFactors(raw:unknown):HumanFactors {
 if(!raw || typeof raw!=='object')throw new Error('Ungültige menschliche Lernanalyse.');
 const r=raw as HumanFactors;
 for(const key of ['idea','calculation','pitfalls','continuation'] as const)if(typeof r[key]!=='string' || !r[key].trim() || r[key].length>2000)throw new Error('Ungültige menschliche Lernanalyse.');
 return {idea:r.idea,calculation:r.calculation,pitfalls:r.pitfalls,continuation:r.continuation};
}
