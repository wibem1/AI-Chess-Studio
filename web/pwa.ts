import {APP_BASE,appPath} from '../src/app-path.js';
declare const __PWA_ENABLED__:boolean;
interface InstallPrompt extends Event {prompt():Promise<void>;userChoice:Promise<{outcome:string}>}
export function installPwa(save:()=>Promise<void>){
 const status=document.getElementById('pwa-status')!,check=document.getElementById('pwa-check') as HTMLButtonElement,apply=document.getElementById('pwa-apply') as HTMLButtonElement,install=document.getElementById('pwa-install') as HTMLButtonElement,consent=document.getElementById('pwa-update-consent') as HTMLInputElement;
 if(!__PWA_ENABLED__||!('serviceWorker' in navigator)||!isSecureContext){status.textContent='Offline-Installation braucht den gebauten App-Stand und HTTPS oder localhost. Die aktuelle Sitzung kannst du als JSON sichern.';check.disabled=true;return;}
 let registration:ServiceWorkerRegistration|undefined,prompt:InstallPrompt|undefined,reload=false;
 const ready=()=>{if(registration?.waiting&&navigator.serviceWorker.controller){apply.disabled=false;status.textContent='Ein Web-Update ist bereit. Es wird erst nach deiner Bestätigung übernommen.';}};
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event as InstallPrompt;install.hidden=false;});
 install.addEventListener('click',async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;prompt=undefined;install.hidden=true;}});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reload)location.reload();});
 void navigator.serviceWorker.register(appPath('service-worker.js'),{scope:APP_BASE,updateViaCache:'none'}).then(async reg=>{
  registration=reg;ready();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')ready();});});
  await navigator.serviceWorker.ready;
  if(!reg.waiting)status.textContent='App-Oberfläche und Stockfish sind für den Offline-Start vorbereitet. KI-Chat und Zugangsprüfung brauchen Internet.';
 }).catch(()=>{status.textContent='Offline-Vorbereitung fehlgeschlagen. Verbindung und freien Gerätespeicher prüfen; die geöffnete App bleibt nutzbar.';});
 check.addEventListener('click',async()=>{try{if(!registration)throw new Error();await registration.update();ready();if(!registration.waiting)status.textContent='Updateprüfung ausgeführt. Eine neue Fassung wird nach dem vollständigen Herunterladen angeboten.';}catch{status.textContent='Updateprüfung derzeit nicht möglich. Internetverbindung prüfen.';}});
 apply.addEventListener('click',async()=>{
  if(!consent.checked){status.textContent='Bitte das Neuladen bestätigen. Die aktuelle Sitzung wird vorher gesichert.';return;}
  if(!registration?.waiting)return;
  // A failed write must never turn an update into loss of the current session.
  try{await save();reload=true;registration.waiting.postMessage('ACTIVATE_UPDATE');}catch{status.textContent='Sitzung nicht gesichert. Bitte zuerst JSON exportieren; Update wurde nicht übernommen.';}
 });
}
