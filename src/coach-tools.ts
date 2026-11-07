import {Chess} from 'chess.js';
export interface CoachCall{id:string;type:'function';function:{name:'show_line'|'play_engine';arguments:string}}
export interface CoachResult{ok:boolean;fromFen:string;fen:string;moves:string[];nodeId:string;engine?:string;error?:string}
export interface CoachExchange{call:CoachCall;content:string;result:CoachResult}
export const TOOL_RECORD='Brettwerkzeug (App): ';
export const COACH_TOOLS=['show_line','play_engine'].map(name=>({type:'function',function:{name,description:name==='show_line'?'Auf ausdrücklichen Wunsch eine legale SAN-Variante am Brett im Lernzweig vorführen.':'Auf ausdrücklichen Wunsch eigene SAN-Züge im Lernzweig ausführen und die gewählte Spielengine einmal antworten lassen. Ergebnis abwarten, bevor du weiter erklärst.',parameters:{type:'object',properties:{moves:{type:'array',items:{type:'string'},minItems:name==='show_line'?1:0,maxItems:name==='show_line'?12:4}},required:['moves'],additionalProperties:false}}}));
export function parseCoachCall(raw:unknown):CoachCall{
 const c=raw as CoachCall;
 if(!c||typeof c.id!=='string'||!c.id||c.id.length>100||c.type!=='function'||!c.function||!['show_line','play_engine'].includes(c.function.name)||typeof c.function.arguments!=='string'||c.function.arguments.length>800)throw new Error('Ungültiger Brettwerkzeug-Aufruf.');
 const a=JSON.parse(c.function.arguments);if(!a||Object.keys(a).some(k=>k!=='moves')||!Array.isArray(a.moves)||a.moves.length>(c.function.name==='show_line'?12:4)||a.moves.length<(c.function.name==='show_line'?1:0)||!a.moves.every((m:unknown)=>typeof m==='string'&&m.length<=16))throw new Error('Ungültige Zugfolge für Brettwerkzeug.');
 return {id:c.id,type:'function',function:{name:c.function.name,arguments:JSON.stringify({moves:a.moves})}};
}
export function validateExchanges(raw:unknown,originFen:string):CoachExchange[]{
 if(raw===undefined)return [];
 if(!Array.isArray(raw)||raw.length>2||JSON.stringify(raw).length>6500)throw new Error('Werkzeugverlauf zu groß.');
 let previous=originFen;const ids=new Set<string>();
 return raw.map(item=>{
  const call=parseCoachCall(item?.call),r=item?.result as CoachResult;
  if(ids.has(call.id)||typeof item.content!=='string'||item.content.length>1000||!r||typeof r.ok!=='boolean'||r.fromFen!==previous||typeof r.fen!=='string'||r.fen.length>150||typeof r.nodeId!=='string'||r.nodeId.length>80||!Array.isArray(r.moves)||r.moves.length>13||r.engine!==undefined&&(typeof r.engine!=='string'||!/^Stockfish|^Maia-2/.test(r.engine)||r.engine.length>120)||r.error!==undefined&&(typeof r.error!=='string'||r.error.length>200))throw new Error('Ungültiges Werkzeugergebnis.');
  const board=new Chess(previous);for(const san of r.moves){if(typeof san!=='string'||!board.moves().includes(san))throw new Error('Illegales Werkzeugergebnis.');board.move(san);}if(board.fen()!==r.fen)throw new Error('Werkzeugergebnis passt nicht zur Stellung.');
  const requested=JSON.parse(call.function.arguments).moves as string[];
  if(r.moves.length>requested.length+(call.function.name==='play_engine'?1:0)||r.moves.some((m,i)=>i<requested.length&&m!==requested[i]))throw new Error('Werkzeugfolge passt nicht zum Auftrag.');
  if(r.ok&&call.function.name==='show_line'&&r.moves.length!==requested.length)throw new Error('Unvollständige Vorführung.');
  if(r.ok&&call.function.name==='play_engine'&&r.moves.length!==requested.length+(board.isGameOver()?0:1)&&!board.isGameOver())throw new Error('Engineantwort fehlt.');
  ids.add(call.id);previous=r.fen;return {call,content:item.content,result:r};
 });
}
export function exchangeMessages(exchanges:CoachExchange[]){return exchanges.flatMap(e=>[{role:'assistant',content:e.content||null,tool_calls:[e.call]},{role:'tool',tool_call_id:e.call.id,content:JSON.stringify(e.result)}]);}
