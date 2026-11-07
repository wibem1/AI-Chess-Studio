const SCALES=[80,90,100,110,125,150,175,200],KEY='chess-studio-font-scale';
/** Font preference contains no game or credential data; changing it starts no engine. */
export function installFontScale(){
 const select=document.getElementById('font-scale') as HTMLSelectElement,root=document.documentElement;
 const apply=(raw:unknown)=>{const value=SCALES.includes(Number(raw))?Number(raw):100;select.value=String(value);root.style.fontSize=16*value/100+'px';measure();};
 const measure=()=>{const header=document.querySelector<HTMLElement>('.app-header')!,nav=document.querySelector<HTMLElement>('.app-navigation')!;root.style.setProperty('--studio-nav-height',nav.offsetHeight+'px');root.style.setProperty('--studio-chrome-height',header.offsetHeight+nav.offsetHeight+'px');};
 let saved:string|null=null;try{saved=localStorage.getItem(KEY);}catch{}apply(saved);
 select.addEventListener('change',()=>{apply(select.value);try{localStorage.setItem(KEY,select.value);}catch{select.title='Schriftgröße für dieses Fenster geändert; lokales Speichern nicht verfügbar.';}});
 window.addEventListener('storage',e=>{if(e.key===KEY)apply(e.newValue);});
 const resize=new ResizeObserver(measure);resize.observe(document.querySelector('.app-header')!);resize.observe(document.querySelector('.app-navigation')!);
}
