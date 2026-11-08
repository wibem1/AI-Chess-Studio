export type View = 'play' | 'learn' | 'variants' | 'settings';
const hashes:Record<View,string>={play:'partie',learn:'lernen',variants:'varianten',settings:'einstellungen'};
/** One board, two modes. Variants are a disclosure within learning. */
export function installNavigation(cancelGesture:()=>void,change:(view:View)=>void=()=>{}){
 const tabs=[...document.querySelectorAll<HTMLButtonElement>('[role=tab][data-view]')],workspace=document.getElementById('workspace')!;
 const fromHash=():View=>(Object.entries(hashes).find(([,hash])=>location.hash==='#'+hash)?.[0] as View)??'play';
 let current:View=fromHash();
 const select=(requested:View,focus=false,writeHistory=true,notify=true)=>{
  const view=requested==='variants'?'learn':requested;cancelGesture();
  const previous=current;current=view;
  for(const tab of tabs){const active=tab.dataset.view===view;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus({preventScroll:true});}
  for(const name of ['play','learn','settings'])document.getElementById('panel-'+name)!.hidden=name!==view;
  document.getElementById('board-area')!.hidden=view==='settings';workspace.dataset.activeView=view;
  if(requested==='variants')document.querySelector<HTMLDetailsElement>('#panel-variants')!.open=true;
  if(writeHistory&&location.hash!=='#'+hashes[requested])history.pushState(null,'','#'+hashes[requested]);
  if(notify&&previous!==view)change(view);
  if(previous!==view)window.scrollTo({top:0,behavior:'instant'});
 };
 for(const [index,tab] of tabs.entries()){
  tab.addEventListener('click',()=>{const view=tab.dataset.view as View,same=current===view;select(view);if(same&&view==='play')change(view);});
  tab.addEventListener('keydown',event=>{let next:number;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(tabs[next]!.dataset.view as View,true);});
 }
 document.querySelectorAll<HTMLElement>('[data-open-view]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.openView as View,true)));

 window.addEventListener('popstate',()=>select(fromHash(),false,false));
 window.addEventListener('hashchange',()=>select(fromHash(),false,false));
 select(current,false,false,false);return {select};
}
