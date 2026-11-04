import {mkdirSync,readFileSync,writeFileSync,renameSync,existsSync,unlinkSync,chmodSync,lstatSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {randomUUID} from 'node:crypto';
export function readLocalJson(path:string):unknown {
 if(!existsSync(path)) return null;
 const stat=lstatSync(path);
 if(!stat.isFile() || stat.isSymbolicLink() || stat.size>65536) throw new Error('Lokale Einstellungsdatei ungültig.');
 return JSON.parse(readFileSync(path,'utf8'));
}
export function writeLocalJson(path:string,value:unknown):void {
 const folder=dirname(path);mkdirSync(folder,{recursive:true,mode:0o700});
 const stat=lstatSync(folder);if(!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Lokaler Speicher nicht verfügbar.');
 if(process.platform!=='win32') chmodSync(folder,0o700);
 if(existsSync(path) && !lstatSync(path).isFile()) throw new Error('Lokale Einstellungsdatei ungültig.');
 const temporary=join(folder,`.settings-${randomUUID()}.tmp`);
 try{writeFileSync(temporary,JSON.stringify(value),{mode:0o600,flag:'wx'});renameSync(temporary,path);}
 finally{if(existsSync(temporary)) unlinkSync(temporary);}
}
