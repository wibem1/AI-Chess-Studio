import {CostLedger,type CostState} from './costs.js';

export const BROWSER_DB='ai-chess-studio';
export interface SealedVault {version:1;iterations:number;salt:Uint8Array;iv:Uint8Array;ciphertext:ArrayBuffer}
export interface DeviceVault {version:2;key:CryptoKey;iv:Uint8Array;ciphertext:ArrayBuffer}
export type StoredVault=SealedVault|DeviceVault;
export interface BrowserSession {json:string;question:string}
export interface SavedGame {id:string;title:string;date:string;json:string}
export class BrowserStore {
 private opening:Promise<IDBDatabase>|undefined;
 private database():Promise<IDBDatabase>{
  return this.opening??=new Promise((resolve,reject)=>{
   const request=indexedDB.open(BROWSER_DB,1);
   request.onupgradeneeded=()=>{for(const name of ['vault','budget','session'])request.result.createObjectStore(name);};
   request.onerror=()=>{this.opening=undefined;reject(new Error('Lokaler Gerätespeicher nicht verfügbar.'));};
   request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();this.opening=undefined;};resolve(db);};
  });
 }
 async get<T>(store:'vault'|'budget'|'session'):Promise<T|null>{
  const db=await this.database();return new Promise((resolve,reject)=>{
   const tx=db.transaction(store,'readonly'),request=tx.objectStore(store).get('current');
   request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(new Error('Lokale Daten konnten nicht gelesen werden.'));
  });
 }
 async put(store:'vault'|'session',value:unknown):Promise<void>{
  const db=await this.database();return new Promise((resolve,reject)=>{
   const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,'current');
   tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(new Error('Lokale Daten konnten nicht gespeichert werden.'));
  });
 }
 async clear(store:'vault'|'session'):Promise<void>{
  const db=await this.database();return new Promise((resolve,reject)=>{
   const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete('current');
   tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(new Error('Lokale Daten konnten nicht gelöscht werden.'));
  });
 }
 /** User-wide coaching preferences, independent of party exports and API credentials. */
 async getGeneralInstructions():Promise<string>{
  const db=await this.database();return new Promise((resolve,reject)=>{
   const tx=db.transaction('session','readonly'),request=tx.objectStore('session').get('general-instructions');
   request.onsuccess=()=>resolve(typeof request.result==='string'?request.result:'');
   request.onerror=()=>reject(new Error('Allgemeine KI-Anweisungen konnten nicht gelesen werden.'));
  });
 }
 async setGeneralInstructions(value:string):Promise<void>{
  if(typeof value!=='string'||value.length>2000)throw new Error('Höchstens 2.000 Zeichen für allgemeine KI-Anweisungen.');
  const db=await this.database();return new Promise((resolve,reject)=>{
   const tx=db.transaction('session','readwrite'),store=tx.objectStore('session');
   if(value.trim())store.put(value.trim(),'general-instructions');else store.delete('general-instructions');
   tx.oncomplete=()=>resolve();
   tx.onerror=tx.onabort=()=>reject(new Error('Allgemeine KI-Anweisungen konnten nicht gespeichert werden.'));
  });
 }
 /** Separate key in the existing store: no database upgrade or session replacement. */
 async savedGames(add?:SavedGame):Promise<SavedGame[]>{
  const db=await this.database();return new Promise((resolve,reject)=>{
   const tx=db.transaction('session',add?'readwrite':'readonly'),store=tx.objectStore('session'),request=store.get('saved-games');
   let result:SavedGame[]=[],failure:unknown;
   request.onsuccess=()=>{try{
    const value=request.result??[];
    if(!Array.isArray(value)||value.some(g=>!g||typeof g.id!=='string'||typeof g.title!=='string'||typeof g.json!=='string'||typeof g.date!=='string'))throw new Error('Partienspeicher ungültig.');
    result=value;
    if(add){if(result.length>=100)throw new Error('100 Partien gespeichert. Weitere Partien als Datei sichern.');result=[add,...result];store.put(result,'saved-games');}
   }catch(error){failure=error;tx.abort();}};
   tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(failure??new Error('Partien konnten nicht gespeichert werden.'));
  });
 }
 /** One read/write transaction serializes reservations across windows and tabs. */
 async budget<T>(mutate:(ledger:CostLedger)=>T):Promise<{value:T;state:CostState}>{
  const db=await this.database();return new Promise((resolve,reject)=>{
   const tx=db.transaction('budget','readwrite'),store=tx.objectStore('budget'),request=store.get('current');
   let result:{value:T;state:CostState}|undefined,failure:unknown;
   request.onsuccess=()=>{try{const ledger=new CostLedger(request.result??null);const value=mutate(ledger);result={value,state:ledger.snapshot()};store.put(result.state,'current');}catch(error){failure=error;tx.abort();}};
   tx.oncomplete=()=>result?resolve(result):reject(new Error('Kostenstatus fehlt.'));
   tx.onerror=tx.onabort=()=>reject(failure??new Error('Kostenstatus konnte nicht gespeichert werden.'));
  });
 }
}
