import {Chess} from 'chess.js';
export interface CoachCall{id:string;type:'function';function:{name:'show_line'|'play_engine'|'show_position'|'draw_board';arguments:string}}
export interface BoardMark{from:string;to:string;kind:'arrow'|'line';color:'green'|'red'|'blue'}
export interface BoardDiagram{fen?:string;marks:BoardMark[]}
export interface CoachResult{diagram?:BoardDiagram;ok:boolean;fromFen:string;fen:string;moves:string[];nodeId:string;engine?:string;error?:string}
export interface CoachExchange{call:CoachCall;content:string;result:CoachResult}
export const TOOL_RECORD='Brettwerkzeug (App): ';
export const COACH_TOOLS:Array<{type:string;function:{name:string;description:string;parameters:Record<string,unknown>}}>=['show_line','play_engine'].map(name=>({type:'function',function:{name,description:name==='show_line'?'Auf ausdrücklichen Wunsch eine legale SAN-Variante am Brett im Lernzweig vorführen.':'Auf ausdrücklichen Wunsch eigene SAN-Züge im Lernzweig ausführen und die gewählte Spielengine einmal antworten lassen. Ergebnis abwarten, bevor du weiter erklärst.',parameters:{type:'object',properties:{moves:{type:'array',items:{type:'string'},minItems:name==='show_line'?1:0,maxItems:name==='show_line'?12:4}},required:['moves'],additionalProperties:false}}}));
const markSchema={type:'array',maxItems:12,items:{type:'object',properties:{from:{type:'string',pattern:'^[a-h][1-8]$'},to:{type:'string',pattern:'^[a-h][1-8]$'},kind:{type:'string',enum:['arrow','line']},color:{type:'string',enum:['green','red','blue']}},required:['from','to','kind','color'],additionalProperties:false}};
COACH_TOOLS.push(...(['show_position','draw_board'] as const).map(name=>({type:'function',function:{name,description:name==='show_position'?'Eine gewünschte Lehrstellung als separates FEN-Diagramm zeigen. Die tatsächliche Partie bleibt erhalten.':'Auf dem sichtbaren Brett bis zu zwölf Pfeile oder Linien zeichnen; leere marks löschen die Zeichnung. Linien sind Erklärungen, keine ausgeführten oder legal geprüften Züge.',parameters:{type:'object',properties:name==='show_position'?{fen:{type:'string'},marks:markSchema}:{marks:markSchema},required:name==='show_position'?['fen','marks']:['marks'],additionalProperties:false}}})));
export function parseMarks(raw:unknown):BoardMark[]{
 if(!Array.isArray(raw)||raw.length>12)throw new Error('Höchstens zwölf Brettmarkierungen.');
 return raw.map(m=>{if(!m||Object.keys(m).some(k=>!['from','to','kind','color'].includes(k))||typeof m.from!=='string'||typeof m.to!=='string'||!/^([a-h][1-8])$/.test(m.from)||!/^([a-h][1-8])$/.test(m.to)||m.from===m.to||!['arrow','line'].includes(m.kind)||!['green','red','blue'].includes(m.color))throw new Error('Ungültige Brettmarkierung.');return {from:m.from,to:m.to,kind:m.kind,color:m.color};});
}
export function parseCoachCall(raw:unknown):CoachCall{
 const c=raw as CoachCall;
 if(!c||typeof c.id!=='string'||!c.id||c.id.length>100||c.type!=='function'||!c.function||!['show_line','play_engine','show_position','draw_board'].includes(c.function.name)||typeof c.function.arguments!=='string'||c.function.arguments.length>2400)throw new Error('Ungültiger Brettwerkzeug-Aufruf.');
 const a=JSON.parse(c.function.arguments);let args:unknown;
 if(c.function.name==='show_position'||c.function.name==='draw_board'){
  if(!a||Object.keys(a).some(k=>!['fen','marks'].includes(k))||c.function.name==='draw_board'&&a.fen!==undefined)throw new Error('Ungültiges Brettdiagramm.');
  const marks=parseMarks(a.marks);
  if(c.function.name==='show_position'){if(typeof a.fen!=='string'||a.fen.length>150)throw new Error('Ungültige Lehrstellung.');args={fen:new Chess(a.fen).fen(),marks};}else args={marks};
 }else{
  if(!a||Object.keys(a).some(k=>k!=='moves')||!Array.isArray(a.moves)||a.moves.length>(c.function.name==='show_line'?12:4)||a.moves.length<(c.function.name==='show_line'?1:0)||!a.moves.every((m:unknown)=>typeof m==='string'&&m.length<=16))throw new Error('Ungültige Zugfolge für Brettwerkzeug.');args={moves:a.moves};
 }
 return {id:c.id,type:'function',function:{name:c.function.name,arguments:JSON.stringify(args)}};
}
export function validateExchanges(raw:unknown,originFen:string):CoachExchange[]{
 if(raw===undefined)return [];
 if(!Array.isArray(raw)||raw.length>2||JSON.stringify(raw).length>14000)throw new Error('Werkzeugverlauf zu groß.');
 let previous=originFen;const ids=new Set<string>();
 return raw.map(item=>{
  const call=parseCoachCall(item?.call),r=item?.result as CoachResult;
  if(ids.has(call.id)||typeof item.content!=='string'||item.content.length>1000||!r||typeof r.ok!=='boolean'||r.fromFen!==previous||typeof r.fen!=='string'||r.fen.length>150||typeof r.nodeId!=='string'||r.nodeId.length>80||!Array.isArray(r.moves)||r.moves.length>13||r.engine!==undefined&&(typeof r.engine!=='string'||!/^Stockfish|^Maia-2/.test(r.engine)||r.engine.length>120)||r.error!==undefined&&(typeof r.error!=='string'||r.error.length>200))throw new Error('Ungültiges Werkzeugergebnis.');
  const board=new Chess(previous);for(const san of r.moves){if(typeof san!=='string'||!board.moves().includes(san))throw new Error('Illegales Werkzeugergebnis.');board.move(san);}if(board.fen()!==r.fen)throw new Error('Werkzeugergebnis passt nicht zur Stellung.');
  if(call.function.name==='show_position'||call.function.name==='draw_board'){
   const args=JSON.parse(call.function.arguments);
   if(!r.ok||r.moves.length||r.fen!==previous||!r.diagram||JSON.stringify(parseMarks(r.diagram.marks))!==JSON.stringify(args.marks)||r.diagram.fen!==(call.function.name==='show_position'?args.fen:undefined)||r.engine||r.error)throw new Error('Brettdiagramm passt nicht zum Auftrag.');
   ids.add(call.id);return {call,content:item.content,result:r};
  }
  if(r.diagram!==undefined)throw new Error('Unerwartetes Brettdiagramm.');
  const requested=JSON.parse(call.function.arguments).moves as string[];
  if(r.moves.length>requested.length+(call.function.name==='play_engine'?1:0)||r.moves.some((m,i)=>i<requested.length&&m!==requested[i]))throw new Error('Werkzeugfolge passt nicht zum Auftrag.');
  if(r.ok&&call.function.name==='show_line'&&r.moves.length!==requested.length)throw new Error('Unvollständige Vorführung.');
  if(r.ok&&call.function.name==='play_engine'&&r.moves.length!==requested.length+(board.isGameOver()?0:1)&&!board.isGameOver())throw new Error('Engineantwort fehlt.');
  ids.add(call.id);previous=r.fen;return {call,content:item.content,result:r};
 });
}
export function exchangeMessages(exchanges:CoachExchange[]){return exchanges.flatMap(e=>[{role:'assistant',content:e.content||null,tool_calls:[e.call]},{role:'tool',tool_call_id:e.call.id,content:JSON.stringify(e.result)}]);}
