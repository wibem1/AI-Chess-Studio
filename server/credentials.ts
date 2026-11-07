import {providerOptions,validModel} from '../src/model-provider.js';
import { chmodSync, closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import type { ModelConfig } from './model.js';

export interface CredentialsStore { load(): ModelConfig | null; save(config: ModelConfig): void; clear(): void }
export function credentialsPath(env: NodeJS.ProcessEnv): string {
  return env.CHESS_CREDENTIALS_PATH ?? join(homedir(),'.ai-chess-studio','credentials.json');
}
function windowsProtect(value: string, decrypt: boolean): string {
  const script = decrypt
    ? "$s=ConvertTo-SecureString ([Console]::In.ReadToEnd()); [Console]::Out.Write(([System.Net.NetworkCredential]::new('', $s)).Password)"
    : "$s=ConvertTo-SecureString ([Console]::In.ReadToEnd()) -AsPlainText -Force; [Console]::Out.Write((ConvertFrom-SecureString $s))";
  const result = spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],
    {input:value,encoding:'utf8',windowsHide:true,timeout:5000,maxBuffer:65536});
  if (result.error || result.status !== 0 || !result.stdout) throw new Error('Lokaler Windows-Schlüsselspeicher nicht verfügbar.');
  return result.stdout;
}
/** Outside the repository. Windows: user-bound DPAPI; POSIX: private directory/file. */
export class FileCredentialsStore implements CredentialsStore {
  constructor(private path: string) {}
  private checkFile(): void {
    const stat=lstatSync(this.path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 65536 ||
        (process.platform !== 'win32' && ((stat.mode & 0o077) !== 0 || stat.uid !== process.getuid!()))) {
      throw new Error('Unsichere lokale Schlüsseldatei.');
    }
  }
  load(): ModelConfig | null {
    if (!existsSync(this.path)) return null;
    try {
      this.checkFile();
      const envelope=JSON.parse(readFileSync(this.path,'utf8'));
      if(envelope.version!==1 || typeof envelope.payload!=='string') throw new Error();
      let json:string;
      if(envelope.format==='dpapi' && process.platform==='win32') json=windowsProtect(envelope.payload,true);
      else if(envelope.format==='plain' && process.platform!=='win32') json=envelope.payload;
      else throw new Error();
      const value=JSON.parse(json);
      if(value.enabled!==true || typeof value.apiKey!=='string' || value.apiKey.length<8 || value.apiKey.length>1024 || /\s/.test(value.apiKey) ||
        typeof value.model!=='string' || !validModel(value.model,providerOptions(value))) throw new Error();
      return {enabled:true,apiKey:value.apiKey,model:value.model,...providerOptions(value)};
    } catch { throw new Error('Lokale Schlüsseldatei konnte nicht sicher geladen werden.'); }
  }
  save(config: ModelConfig): void {
    const folder=dirname(this.path);
    let temporary:string|undefined;
    try {
      mkdirSync(folder,{recursive:true,mode:0o700});
      const dir=lstatSync(folder);
      if(!dir.isDirectory() || dir.isSymbolicLink() || (process.platform!=='win32' && dir.uid!==process.getuid!())) throw new Error();
      if(process.platform!=='win32') chmodSync(folder,0o700);
      if(existsSync(this.path)) this.checkFile();
      const json=JSON.stringify({enabled:config.enabled,apiKey:config.apiKey,model:config.model});
      const envelope={version:1,format:process.platform==='win32'?'dpapi':'plain',payload:process.platform==='win32'?windowsProtect(json,false):json};
      temporary=join(folder,`.credentials-${randomUUID()}.tmp`);
      const fd=openSync(temporary,'wx',0o600);
      try {writeFileSync(fd,JSON.stringify(envelope));fsyncSync(fd);} finally {closeSync(fd);}
      renameSync(temporary,this.path);temporary=undefined;
    } catch { throw new Error('API-Schlüssel konnte nicht lokal gespeichert werden.'); }
    finally {if(temporary && existsSync(temporary)) unlinkSync(temporary);}
  }
  clear(): void {
    if(!existsSync(this.path)) return;
    try {this.checkFile();unlinkSync(this.path);} catch {throw new Error('Lokaler API-Schlüssel konnte nicht gelöscht werden.');}
  }
}
