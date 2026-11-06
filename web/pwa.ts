import {APP_BASE,appPath} from '../src/app-path.js';
import {APP_VERSION} from '../src/version.js';
declare const __PWA_ENABLED__:boolean;
interface InstallPrompt extends Event {prompt():Promise<void>;userChoice:Promise<{outcome:string}>}
export function installPwa(save:()=>Promise<void>){
 const status=document.getElementById('pwa-status')!,check=document.getElementById('pwa-check') as HTMLButtonElement,apply=document.getElementById('pwa-apply') as HTMLButtonElement,install=document.getElementById('pwa-install') as HTMLButtonElement,consent=document.getElementById('pwa-update-consent') as HTMLInputElement;
 if(!__PWA_ENABLED__||!('serviceWorker' in navigator)||!isSecureContext){status.textContent='Offline-Installation braucht den gebauten App-Stand und HTTPS oder localhost. Die aktuelle Sitzung kannst du als JSON sichern.';check.disabled=true;return;}
 let registration:ServiceWorkerRegistration|undefined,prompt:InstallPrompt|undefined,reload=false;
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
   await registration.update();
   if(registration.waiting)ready();
   else if(registration.installing)watch(registration.installing);
   else status.textContent=`Version ${APP_VERSION} ist aktuell. Bei dieser Prüfung wurde kein neues Web-Update gefunden.`;
  }catch{status.textContent='Updateprüfung fehlgeschlagen. Internetverbindung prüfen und erneut versuchen. Die geöffnete Version bleibt nutzbar.';}
  finally{check.disabled=!registration;}
 });
 apply.addEventListener('click',async()=>{
  if(!consent.checked){status.textContent='Bitte das Neuladen bestätigen. Die aktuelle Sitzung wird vorher gesichert.';return;}
  if(!registration?.waiting)return;
  // A failed write must never turn an update into loss of the current session.
  try{await save();reload=true;registration.waiting.postMessage('ACTIVATE_UPDATE');}catch{status.textContent='Sitzung nicht gesichert. Bitte zuerst JSON exportieren; Update wurde nicht übernommen.';}
 });
}
