import {reviewAnchors,type ReviewAnchor} from '../src/game-review.js';
import type {Session} from '../src/session.js';
import {reviewLocked,visibleReviewNodes} from '../src/review.js';
export function installKeyMoments(current:()=>Session,jump:(node:string)=>void){
 const nav=document.getElementById('key-moment-nav')!,previous=document.getElementById('key-moment-prev') as HTMLButtonElement,next=document.getElementById('key-moment-next') as HTMLButtonElement,status=document.getElementById('key-moment-status')!;
 nav.tabIndex=0;
 let latest:{session:Session;index:number}|undefined;
 let selected:{session:Session;index:number;text:string}|undefined,anchors:ReviewAnchor[]=[],index=-1;
 const choose=(analysis:number,moment:number)=>{const session=current(),data=session.snapshot(),a=data.annotations[analysis];if(!a||reviewLocked(data))return;const items=reviewAnchors(data,a),item=items[moment];if(!item||!visibleReviewNodes(data).has(item.nodeId))return;selected={session,index:analysis,text:a.text};jump(item.nodeId);nav.focus({preventScroll:true});};
 const step=(offset:number)=>{if(!selected)return;choose(selected.index,index<0?(offset>0?0:anchors.length-1):index+offset);};
 previous.onclick=()=>step(-1);next.onclick=()=>step(1);
 nav.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();e.stopPropagation();step(e.key==='ArrowLeft'?-1:1);});
 document.addEventListener('keydown',e=>{
  if(nav.hidden||e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||!['ArrowLeft','ArrowRight'].includes(e.key)||!(e.target instanceof Element)||!e.target.closest('#board,#current-answer')||e.target.closest('input,textarea,select,[contenteditable],[role=separator]')||getSelection()?.toString())return;
  e.preventDefault();step(e.key==='ArrowLeft'?-1:1);
 });
 return {choose,render(){
  const focused=nav.contains(document.activeElement);
  document.getElementById('find-key-moments')!.hidden=document.getElementById('workspace')?.dataset.activeView!=='learn';
  const session=current(),data=session.snapshot(),allowed=visibleReviewNodes(data);const candidates=data.annotations.map((a,i)=>({i,anchors:reviewAnchors(data,a)})).filter(x=>x.anchors.length&&x.anchors.every(m=>allowed.has(m.nodeId)));
  const newest=candidates.at(-1)?.i??-1;
  if(latest?.session!==session||latest.index!==newest){latest={session,index:newest};selected=newest<0?undefined:{session,index:newest,text:data.annotations[newest]!.text};}
  if(selected?.session!==session||data.annotations[selected.index]?.text!==selected.text||!candidates.some(x=>x.i===selected!.index))selected=undefined;
  if(!selected&&candidates.length){const last=candidates.at(-1)!;selected={session,index:last.i,text:data.annotations[last.i]!.text};}
  anchors=selected?candidates.find(x=>x.i===selected!.index)?.anchors??[]:[];index=anchors.findIndex(a=>a.nodeId===data.activeNodeId);
  nav.hidden=!anchors.length||reviewLocked(data)||document.getElementById('workspace')?.dataset.activeView!=='learn';previous.disabled=index===0;next.disabled=index===anchors.length-1;status.textContent=index<0?`${anchors.length} Schlüsselstellen`:`${index+1}/${anchors.length} · vor ${anchors[index]!.label}`;
  const links=document.getElementById('key-moment-links')!;links.replaceChildren();
  for(const [i,anchor] of anchors.entries()){const button=document.createElement('button');button.type='button';button.textContent=anchor.label;button.setAttribute('aria-label',`Schlüsselstellung vor ${anchor.label}`);button.setAttribute('aria-current',String(i===index));button.onclick=()=>{if(selected)choose(selected.index,i);};links.append(button);}
  if(focused&&!nav.hidden&&!nav.contains(document.activeElement))nav.focus({preventScroll:true});
 }};
}
