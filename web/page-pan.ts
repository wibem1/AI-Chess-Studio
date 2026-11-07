/** Scroll the page when a pointer delivered as a mouse drags ordinary page text.
 * Native touch scrolling remains with the browser. Controls and the chessboard
 * keep their own gestures; this also covers touch drivers emitting mouse events.
 */
export function installPagePan() {
  let pan: {id:number; x:number; y:number; top:number; moved:boolean} | null = null;
  let suppressClick = false;
  const excluded = 'input,textarea,select,button,a,summary,label,[contenteditable],#board,#current-answer-body,[role=separator],.scroll-help,.scroll-report';
  const cancel = () => {
    const current=pan;pan=null;document.body.classList.remove('page-panning');
    if(current && document.body.hasPointerCapture(current.id))document.body.releasePointerCapture(current.id);
  };
  document.addEventListener('pointerdown',event=>{
    if(pan || event.pointerType!=='mouse' || !event.isPrimary || event.button!==0 ||
      !(event.target instanceof Element) || event.target.closest(excluded))return;
    pan={id:event.pointerId,x:event.clientX,y:event.clientY,top:document.scrollingElement?.scrollTop??0,moved:false};
  });
  document.addEventListener('pointermove',event=>{
    if(!pan || event.pointerId!==pan.id)return;
    if(!pan.moved && Math.abs(event.clientY-pan.y)<8)return;
    if(!pan.moved){
      pan.moved=true;document.body.setPointerCapture(event.pointerId);
      document.body.classList.add('page-panning');
      if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
      getSelection()?.removeAllRanges();
    }
    event.preventDefault();
    document.scrollingElement?.scrollTo({top:pan.top+pan.y-event.clientY,behavior:'instant'});
  },{passive:false});
  document.addEventListener('pointerup',event=>{
    if(!pan || event.pointerId!==pan.id)return;
    const moved=pan.moved;cancel();
    if(moved){event.preventDefault();suppressClick=true;setTimeout(()=>{suppressClick=false;},0);}
  });
  for(const type of ['pointercancel','lostpointercapture'])document.addEventListener(type,event=>{
    if(pan && (event as PointerEvent).pointerId===pan.id)cancel();
  });
  document.addEventListener('click',event=>{
    if(suppressClick){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  window.addEventListener('blur',cancel);
  window.addEventListener('keydown',event=>{if(event.key==='Escape')cancel();});
}
