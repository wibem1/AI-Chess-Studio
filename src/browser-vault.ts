import type {SealedVault,DeviceVault} from './browser-store.js';
export interface LocalModelConfig {enabled:true;apiKey:string;model:string}
const ITERATIONS=250000;
const encoder=new TextEncoder();
export function validateLocalConfig(raw:unknown):LocalModelConfig {
 const r=raw as LocalModelConfig|null;
 if(!r||r.enabled!==true||typeof r.apiKey!=='string'||r.apiKey.trim().length<8||r.apiKey.length>1024||/\s/.test(r.apiKey.trim())||typeof r.model!=='string'||!/^[a-zA-Z0-9._:-]{1,100}$/.test(r.model))throw new Error('Schlüssel und Modell prüfen.');
 return {enabled:true,apiKey:r.apiKey.trim(),model:r.model};
}
async function derive(password:string,salt:Uint8Array<ArrayBuffer>,iterations:number):Promise<CryptoKey>{
 const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function sealConfig(raw:unknown,password:string):Promise<SealedVault>{
 if(typeof password!=='string'||password.length<10||password.length>1024)throw new Error('Gerätepasswort: mindestens 10, höchstens 1024 Zeichen.');
 const config=validateLocalConfig(raw),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await derive(password,salt,ITERATIONS);
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode('AI-Chess-Studio/vault/1')},key,encoder.encode(JSON.stringify(config)));
 return {version:1,iterations:ITERATIONS,salt,iv,ciphertext};
}
export async function openConfig(raw:SealedVault,password:string):Promise<LocalModelConfig>{
 try{
  if(raw.version!==1||raw.iterations!==ITERATIONS||!(raw.salt instanceof Uint8Array)||raw.salt.length!==16||!(raw.iv instanceof Uint8Array)||raw.iv.length!==12||!(raw.ciphertext instanceof ArrayBuffer)||raw.ciphertext.byteLength>8192||typeof password!=='string'||password.length>1024)throw new Error();
  const salt=new Uint8Array(raw.salt),iv=new Uint8Array(raw.iv),key=await derive(password,salt,raw.iterations);
  const decoded=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode('AI-Chess-Studio/vault/1')},key,raw.ciphertext);
  return validateLocalConfig(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decoded)));
 }catch{throw new Error('Schlüsselfach konnte nicht entsperrt werden. Gerätepasswort prüfen.');}
}

/** Browser-profile storage, no separate app password. Same-origin code can use this key. */
export async function sealDeviceConfig(raw:unknown):Promise<DeviceVault>{
 const config=validateLocalConfig(raw),key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode('AI-Chess-Studio/device-vault/2')},key,encoder.encode(JSON.stringify(config)));
 return {version:2,key,iv,ciphertext};
}
export async function openDeviceConfig(raw:DeviceVault):Promise<LocalModelConfig>{
 try{
  if(raw.version!==2||!(raw.key instanceof CryptoKey)||raw.key.extractable||raw.key.type!=='secret'||raw.key.algorithm.name!=='AES-GCM'||!(raw.iv instanceof Uint8Array)||raw.iv.length!==12||!(raw.ciphertext instanceof ArrayBuffer)||raw.ciphertext.byteLength>8192)throw new Error();
  const decoded=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(raw.iv),additionalData:encoder.encode('AI-Chess-Studio/device-vault/2')},raw.key,raw.ciphertext);
  return validateLocalConfig(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decoded)));
 }catch{throw new Error('Lokaler Schlüssel konnte nicht gelesen werden. Bitte erneut speichern.');}
}
