import {BrowserStore} from '../src/browser-store.js';
import {importGameFile} from '../src/game-file.js';
import {Session} from '../src/session.js';
interface SavedGame {id:string;title:string;date:string;json:string}
export function installGameLibrary(store:BrowserStore,read:()=>string,restore:(json:string)=>void,beforeLoad:()=>void|(()=>void)=()=>{}){
 const $=(id:string)=>document.getElementById(id)!;
 const title=$('game-title') as HTMLInputElement,list=$('saved-games') as HTMLSelectElement,file=$('game-file') as HTMLInputElement;
 const status=(text:string)=>{$('games-status').textContent=text;};
 const refresh=async()=>{const games=await store.savedGames(),previous=list.value;list.replaceChildren();for(const game of games){const o=document.createElement('option');o.value=game.id;o.textContent=game.title+' · '+new Date(game.date).toLocaleString();list.append(o);}if(games.some(g=>g.id===previous))list.value=previous;($('load-game') as HTMLButtonElement).disabled=!games.length;};
 const snapshot=(name:string):SavedGame=>({id:crypto.randomUUID(),title:name.slice(0,80),date:new Date().toISOString(),json:read()});
 let loading=false;
 const load=async(json:string)=>{if(loading)throw new Error('Ein Ladevorgang läuft bereits.');loading=true;let afterLoad:(()=>void)|void;try{const checked=Session.import(json).export();afterLoad=beforeLoad();const source=read();await store.savedGames({...snapshot('Sicherung vor dem Laden'),json:source});if(read()!==source)throw new Error('Sitzung inzwischen geändert.');restore(checked);await refresh();status('Partie geladen. Analyse, Schlüsselstellen, Kommentare, Varianten und Lernchat sind wieder vorhanden. Die vorherige Sitzung bleibt als Sicherung erhalten.');}finally{try{afterLoad?.();}finally{loading=false;}}};
 $('save-game').addEventListener('click',async()=>{try{const entry=snapshot(title.value.trim()||'Meine Partie');await store.savedGames(entry);await refresh();list.value=entry.id;status('Partie mit Analyse, Schlüsselstellen, Kommentaren, Varianten und Lernchat auf diesem Gerät gespeichert.');}catch{status('Speichern fehlgeschlagen. Bitte die Partie als Datei sichern.');}});
 $('load-game').addEventListener('click',async()=>{try{const entry=(await store.savedGames()).find(g=>g.id===list.value);if(!entry)throw new Error();await load(entry.json);title.value=entry.title;}catch{status('Partie konnte nicht geladen werden. Die aktuelle Sitzung bleibt erhalten.');}});
 $('download-game').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([read()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=(title.value.trim()||'Meine Partie').replace(/[^\p{L}\p{N} _-]/gu,'_').slice(0,80)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Partiedatei mit Kommentaren, Varianten und Lernchat exportiert. Sie enthält keinen API-Schlüssel.');});
 const failure=(error:unknown)=>{const reason=error instanceof Error&&error.message?error.message:'Datei oder Sicherung nicht lesbar.';status('Datei konnte nicht geladen werden: '+reason.slice(0,350)+' Die aktuelle Sitzung bleibt erhalten.');};
 const importText=async(text:string,name:string)=>{
  const imported=importGameFile(text,name,Session.import(read()).snapshot().orientation??'w');
  await load(imported.session.export());
  if(imported.format==='pgn'){title.value=(imported.title??'Importierte Partie').slice(0,80);status('PGN-Partie geladen. Frei nachspielen oder im Chat analysieren. Die vorherige Sitzung ist gesichert.');}
 };
 file.addEventListener('change',async()=>{try{const chosen=file.files?.[0];if(!chosen)return;if(chosen.size>8388608)throw new Error('Datei größer als 8 MiB.');await importText(await chosen.text(),chosen.name);}catch(error){failure(error);}finally{file.value='';}});
 $('load-pgn-text').addEventListener('click',async()=>{
  const input=$('game-pgn-text') as HTMLTextAreaElement,source=input.value;
  try{await importText(source,'Eingefügte Partie.pgn');if(input.value===source)input.value='';}catch(error){failure(error);}
 });
 void refresh().catch(()=>status('Lokale Partien nicht lesbar. Datei speichern und laden bleibt verfügbar.'));
 window.addEventListener('chess-games-change',()=>{void refresh().catch(()=>status('Partienliste konnte nicht aktualisiert werden.'));});
}
