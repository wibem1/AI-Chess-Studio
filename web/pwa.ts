import {APP_BASE,appPath} from '../src/app-path.js';
import {APP_VERSION} from '../src/version.js';
import {maiaOfflineAvailable,prepareMaiaOffline} from './offline-maia.js';
declare const __PWA_ENABLED__:boolean;
interface InstallPrompt extends Event {prompt():Promise<void>;userChoice:Promise<{outcome:string}>}
export function installPwa(save:()=>Promise<void>){
 const status=document.getElementById('pwa-status')!,check=document.getElementById('pwa-check') as HTMLButtonElement,apply=document.getElementById('pwa-apply') as HTMLButtonElement,install=document.getElementById('pwa-install') as HTMLButtonElement,consent=document.getElementById('pwa-update-consent') as HTMLInputElement;
 if(!__PWA_ENABLED__||!('serviceWorker' in navigator)||!isSecureContext){status.textContent='Offline-Installation braucht den gebauten App-Stand und HTTPS oder localhost. Die aktuelle Sitzung kannst du als JSON sichern.';check.disabled=true;return;}
 let registration:ServiceWorkerRegistration|undefined,prompt:InstallPrompt|undefined,reload=false,remoteVersion:string|undefined;
 const offlineButton=document.getElementById('pwa-offline-prepare') as HTMLButtonElement;
 const offlineStatus=document.getElementById('pwa-offline-status')!;
 const refreshOffline=async()=>{try{offlineStatus.textContent=await maiaOfflineAvailable()?'Maia ist lokal gespeichert. Offline-Spiel nach einem Neustart möglich.':'Maia ist noch nicht vollständig lokal gespeichert (ca. 43 MB Download).';}catch{offlineStatus.textContent='Offline-Speicherstatus nicht abrufbar.';}};
 offlineButton.addEventListener('click',async()=>{
  offlineButton.disabled=true;
  try{await prepareMaiaOffline(message=>{offlineStatus.textContent=message;});await refreshOffline();}
  catch(error){offlineStatus.textContent='Offline-Vorbereitung fehlgeschlagen: '+(error instanceof Error?error.message:'Unbekannter Fehler')+'. Internetverbindung und freien Gerätespeicher prüfen.';}
  finally{offlineButton.disabled=false;}
 });
 void refreshOffline();
 const shellPrefix='chess-studio-shell-'+Array.from(new TextEncoder().encode(APP_BASE),byte=>byte.toString(16).padStart(2,'0')).join('')+'-';
 const publishedVersion=async()=>{
  const response=await fetch(appPath('BUILD.json')+'?update-check='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw new Error('Build-Metadaten nicht abrufbar.');
  const data:unknown=await response.json();
  if(!data||typeof data!=='object'||!('project' in data)||data.project!=='AI-Chess-Studio'||!('version' in data)||typeof data.version!=='string'||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(data.version))throw new Error('Ungültige Build-Metadaten.');
  return data.version;
 };
 const newer=(version:string)=>{
  const current=APP_VERSION.split('.').map(Number),available=version.split('.').map(Number);
  for(let i=0;i<3;i++){if(available[i]!==current[i])return (available[i]??0)>(current[i]??0);}return false;
 };
 check.disabled=true;
 const offlineReady=()=>{status.textContent=`Version ${APP_VERSION}: App-Oberfläche und Stockfish sind für den Offline-Start vorbereitet. KI-Chat und Zugangsprüfung brauchen Internet.`;};
 const ready=()=>{if(registration?.waiting&&navigator.serviceWorker.controller){apply.disabled=false;status.textContent='Ein Web-Update ist bereit. Es wird erst nach deiner Bestätigung übernommen.';}};
 const observed=new WeakSet<ServiceWorker>();
 const watch=(worker:ServiceWorker)=>{
  status.textContent=registration?.active?'Web-Update wird heruntergeladen. Die geöffnete Version bleibt nutzbar.':'App wird für den Offline-Start heruntergeladen …';
  if(observed.has(worker))return;
  observed.add(worker);
  const changed=()=>{
   if(worker.state==='installed'){worker.removeEventListener('statechange',changed);ready();}
   if(worker.state==='activated'&&!reload)offlineReady();
   if(worker.state==='redundant'){worker.removeEventListener('statechange',changed);apply.disabled=true;status.textContent='Herunterladen fehlgeschlagen. Die geöffnete Version bleibt nutzbar. Internetverbindung und freien Gerätespeicher prüfen, dann erneut auf Updates prüfen.';}
  };
  worker.addEventListener('statechange',changed);changed();
 };
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event as InstallPrompt;install.hidden=false;});
 install.addEventListener('click',async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;prompt=undefined;install.hidden=true;}});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reload)location.reload();});
 void navigator.serviceWorker.register(appPath('service-worker.js'),{scope:APP_BASE,updateViaCache:'none'}).then(async reg=>{
  registration=reg;check.disabled=false;ready();reg.addEventListener('updatefound',()=>{if(reg.installing)watch(reg.installing);});if(reg.installing)watch(reg.installing);
  await navigator.serviceWorker.ready;
  if(!reg.waiting&&!reg.installing)offlineReady();
 }).catch(()=>{status.textContent='Offline-Vorbereitung fehlgeschlagen. Verbindung und freien Gerätespeicher prüfen; die geöffnete App bleibt nutzbar.';});
 check.addEventListener('click',async()=>{
  check.disabled=true;status.textContent=`Suche nach Web-Updates für Version ${APP_VERSION} …`;
  try{
   if(!registration)throw new Error();
   remoteVersion=await publishedVersion();
   await registration.update();
   if(registration.waiting)ready();
   else if(registration.installing)watch(registration.installing);
   else if(newer(remoteVersion)){
    apply.disabled=false;
    status.textContent=`Version ${remoteVersion} ist veröffentlicht, aber der Offline-Cache meldet kein Update. Du kannst nach Sicherung deiner Sitzung die Web-App neu laden.`;
   }else status.textContent=`Version ${APP_VERSION} ist aktuell. Keine neuere Webversion veröffentlicht.`;
  }catch{status.textContent='Updateprüfung fehlgeschlagen. Build-Manifest oder Service Worker nicht erreichbar. Die geöffnete Version bleibt nutzbar.';}
  finally{check.disabled=!registration;}
 });
 apply.addEventListener('click',async()=>{
  if(!consent.checked){status.textContent='Bitte das Neuladen bestätigen. Die aktuelle Sitzung wird vorher gesichert.';return;}
  if(!registration?.waiting&&!(remoteVersion&&newer(remoteVersion)))return;
  // A failed write must never turn an update into loss of the current session.
  try{
   await save();
   if(registration?.waiting){reload=true;registration.waiting.postMessage('ACTIVATE_UPDATE');return;}
   // The published manifest proves a newer release, but the registered worker is stuck.
   // Unregister only this app's worker and delete only its own shell caches.
   const confirmed=await publishedVersion();
   if(!newer(confirmed))throw new Error('Das veröffentlichte Update ist nicht mehr nachweisbar.');
   status.textContent='Sitzung gesichert. Veralteten Offline-Cache dieser App entfernen und neu laden …';
   await registration!.unregister();
   for(const name of await caches.keys())if(name.startsWith(shellPrefix))await caches.delete(name);
   location.replace(APP_BASE+'?web-update='+encodeURIComponent(confirmed));
  }catch(error){status.textContent='Web-Update nicht übernommen: '+(error instanceof Error?error.message:'Sitzung nicht gesichert oder Cache nicht verfügbar.')+' Die aktuelle Sitzung bleibt erhalten; gegebenenfalls JSON-Sicherung exportieren.';}
 });
}
