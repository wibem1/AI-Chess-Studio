import {CostLedger,type CostState} from './costs.js';

export const BROWSER_DB='ai-chess-studio';
export interface SealedVault {version:1;iterations:number;salt:Uint8Array;iv:Uint8Array;ciphertext:ArrayBuffer}
export interface BrowserSession {json:string;question:string}
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
