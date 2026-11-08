import {APP_VERSION} from '../src/version.js';
import type {CatalogModel} from '../src/model-provider.js';
export function installModelControls(post:(path:string,body:unknown)=>Promise<any>,refresh:()=>Promise<void>,context:()=>unknown){
 const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 const provider=$<HTMLSelectElement>('api-provider'),catalog=$<HTMLSelectElement>('model-catalog'),chatModel=$<HTMLSelectElement>('chat-model'),reasoning=$<HTMLSelectElement>('chat-reasoning');
 let models:CatalogModel[]=[],activeProvider='openai',activeModel='',activeReasoning='',configDirty=false,selectionDirty=false;
 $('api-form').addEventListener('input',()=>{configDirty=true;});$('api-form').addEventListener('change',()=>{configDirty=true;});
 $('chat-model-controls').addEventListener('input',()=>{selectionDirty=true;});$('chat-model-controls').addEventListener('change',()=>{selectionDirty=true;});
 chatModel.onchange=()=>{$<HTMLInputElement>('chat-model-id').value=chatModel.value;};
 const feedback=(s:string)=>$('model-choice-status').textContent=s;
 const options=()=>{
  for(const select of [catalog,chatModel]){select.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='Modell auswählen';select.append(blank);for(const model of [...models].sort((a,b)=>Number(['openai/gpt-6.1-sol','google/gemini-4-argon'].includes(b.id))-Number(['openai/gpt-6.1-sol','google/gemini-4-argon'].includes(a.id))||a.name.localeCompare(b.name))){const o=document.createElement('option');o.value=model.id;o.textContent=`${model.name} · ${model.inputUsdPerMillion.toFixed(2)}/${model.outputUsdPerMillion.toFixed(2)} USD/M · ${model.tools?'Brettwerkzeuge':'nur Text'}`;select.append(o);}if(activeModel)select.value=activeModel;}
 };
 async function load(){try{models=(await post('/api/models',{})).filter((m:CatalogModel)=>m.tools);options();feedback(`${models.length} Textmodelle geladen. Preise: Eingabe/Ausgabe je Million Tokens.`);}catch{feedback('Modellkatalog nicht verfügbar. Später erneut laden; keine KI-Anfrage gestartet.');}}
 const configurePrices=async(id:string)=>{const m=models.find(x=>x.id===id);if(m)await post('/api/costs',{action:'configure',inputUsdPerMillion:m.inputUsdPerMillion,outputUsdPerMillion:m.outputUsdPerMillion});};
 $('models-refresh').onclick=()=>void load();$('chat-models-refresh').onclick=()=>void load();
 provider.onchange=()=>{$('api-provider-warning').hidden=!!provider.value;document.querySelector('label[for=api-key]')!.textContent=provider.value==='openrouter'?'OpenRouter-API-Schlüssel':provider.value==='openai'?'OpenAI-API-Schlüssel':'API-Schlüssel des ausgewählten Anbieters';catalog.hidden=provider.value!=='openrouter';$('models-refresh').hidden=provider.value!=='openrouter';if(provider.value==='openrouter'){reasoning.value='medium';($<HTMLInputElement>('api-model')).value='openai/gpt-6.1-sol';void load();}else {reasoning.value='';($<HTMLInputElement>('api-model')).value='gpt-4.1-mini';}};
 catalog.onchange=()=>{if(catalog.value){$<HTMLInputElement>('api-model').value=catalog.value;if(!models.find(m=>m.id===catalog.value)?.reasoning)reasoning.value='';}};
 $('model-apply').onclick=async()=>{
  const model=$<HTMLInputElement>('chat-model-id').value.trim()||chatModel.value||activeModel;if(!model)return;if(models.some(m=>m.id===model&&!m.reasoning))reasoning.value='';
  try{const r=await post('/api/model-config',{action:'select-model',provider:activeProvider,model,...(reasoning.value?{reasoning:reasoning.value}:{})});await configurePrices(model);activeModel=model;activeReasoning=reasoning.value;selectionDirty=false;await refresh();feedback(r.selectionPersistent===false?'Modell für dieses Fenster gewählt. Optionaler Passwortschutz bleibt erhalten; dauerhafte Speicherung über das Zugangsformular.':'Modell und Denkstufe gespeichert. Keine KI-Anfrage gestartet.');}catch(error){feedback(error instanceof Error?error.message:'Modellwahl nicht gespeichert. Aktiven Zugang prüfen.');}
 };
 $('ai-diagnose-export').onclick=async()=>{
  try{const report=await post('/api/ai-diagnostics',{current:context(),learnerAssessment:$<HTMLSelectElement>('ai-quality').value,learnerComment:$<HTMLTextAreaElement>('ai-quality-note').value});const file={...report,appVersion:APP_VERSION,privacy:'Contains chess positions, chat context and model replies. No automatic upload. Review before sharing.'};const blob=new Blob([JSON.stringify(file,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`AI-Chess-Studio-KI-Diagnose-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('ai-diagnose-status').textContent=`Diagnose heruntergeladen: ${report.requests.length} Anfrageberichte. Enthält Partie-/Chatinhalte; vor Weitergabe prüfen.`;}catch{$('ai-diagnose-status').textContent='KI-Diagnose konnte nicht exportiert werden.';}
 };
 $('ai-diagnose-clear').onclick=async()=>{try{await post('/api/ai-diagnostics',{action:'clear'});$('ai-diagnose-status').textContent='Anfrageberichte aus dem Arbeitsspeicher gelöscht.';}catch{$('ai-diagnose-status').textContent='Anfrageberichte konnten nicht gelöscht werden.';}};
 return {
  connected(){configDirty=false;selectionDirty=false;},
  async beforeConnect(){if(provider.value==='openrouter')await configurePrices($<HTMLInputElement>('api-model').value);return {provider:provider.value,...(reasoning.value?{reasoning:reasoning.value}:{})};},
  async update(d:any){const nextProvider=d.model.provider??'',nextModel=d.model.model??'',changed=activeProvider!==nextProvider||activeModel!==nextModel;
   activeProvider=nextProvider;activeModel=nextModel;activeReasoning=d.model.reasoning??'';
   if(!configDirty){provider.value=activeProvider;$<HTMLInputElement>('api-model').value=activeModel||(activeProvider==='openrouter'?'openai/gpt-6.1-sol':activeProvider==='openai'?'gpt-4.1-mini':'');document.querySelector('label[for=api-key]')!.textContent=activeProvider==='openrouter'?'OpenRouter-API-Schlüssel':activeProvider==='openai'?'OpenAI-API-Schlüssel':'API-Schlüssel des ausgewählten Anbieters';catalog.hidden=activeProvider!=='openrouter';$('models-refresh').hidden=activeProvider!=='openrouter';
    $('api-provider-warning').hidden=!!activeProvider;
    if(!activeProvider)$('api-provider-warning').textContent=d.model.localKeySaved?'Der gespeicherte Zugang ist zurzeit nicht lesbar. Der bisherige Anbieter ist unbekannt; bitte nichts überschreiben, bevor du ihn überprüft hast.':'Bitte zuerst OpenAI direkt oder OpenRouter wählen.';
   }
   $('chat-model-controls').hidden=!d.model.configured;$('chat-models-refresh').hidden=activeProvider!=='openrouter';chatModel.hidden=activeProvider!=='openrouter';
   if(!selectionDirty||changed){reasoning.value=activeReasoning;$<HTMLInputElement>('chat-model-id').value=activeModel;if(!models.some(m=>m.id===activeModel)){chatModel.replaceChildren();const o=document.createElement('option');o.value=activeModel;o.textContent=activeModel;chatModel.append(o);}else chatModel.value=activeModel;selectionDirty=false;}
   $('diagnose-access').textContent=activeProvider==='openrouter'?'OpenRouter-Zugang prüfen (ohne Textgenerierung)':'OpenAI-Zugang prüfen (ohne Textgenerierung)';
   $('selected-model').textContent=`${activeProvider} · ${activeModel||'kein Modell'}${activeReasoning?' · Denken '+activeReasoning:''}`;
  }
 };
}
