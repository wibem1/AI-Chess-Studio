import {BrowserStore,type BrowserSession} from '../src/browser-store.js';
/** Serial writes keep an older render from overtaking the newest session. */
export class AutoSave {
 private queue=Promise.resolve();private previous='';
 constructor(private store:BrowserStore,private read:()=>BrowserSession,private report:(value:string)=>void){}
 save():Promise<void>{
  const value=this.read(),serialized=JSON.stringify(value);if(serialized===this.previous)return this.queue;
  this.previous=serialized;
  this.queue=this.queue.catch(()=>{}).then(async()=>{
   try{await this.store.put('session',value);this.report('Sitzung auf diesem Gerät gespeichert. JSON-Export bleibt deine unabhängige Sicherung.');}
   catch{this.previous='';this.report('Automatische Sicherung fehlgeschlagen. Bitte die Sitzung als JSON exportieren.');throw new Error('Sitzung nicht gesichert.');}
  });return this.queue;
 }
 async clear(){await this.queue.catch(()=>{});await this.store.clear('session');this.previous='';}
}
