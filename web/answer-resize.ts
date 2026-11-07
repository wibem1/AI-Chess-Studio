/** Native resize plus an accessible pointer/touch handle. Height survives rerenders. */
let preferred:number|undefined,observer:ResizeObserver|undefined;
try{const n=Number(localStorage.getItem('chess-studio-answer-height'));if(n>=80&&n<=2000)preferred=n;}catch{}
export function attachAnswerResize(body:HTMLElement):HTMLElement{
 observer?.disconnect();body.tabIndex=0;
 if(preferred)body.style.height=`${preferred}px`;
 const handle=document.createElement('div');handle.className='answer-resize-handle';handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-label','Größe der KI-Antwort ändern');handle.setAttribute('aria-orientation','horizontal');handle.setAttribute('aria-valuemin','80');
 const save=()=>{const n=Number.parseFloat(body.style.height);if(Number.isFinite(n)&&n>=80&&n<=2000){preferred=n;try{localStorage.setItem('chess-studio-answer-height',String(n));}catch{}}handle.setAttribute('aria-valuenow',String(Math.round(body.getBoundingClientRect().height)));handle.setAttribute('aria-valuemax',String(Math.floor(innerHeight*.8)));};
 const resize=(height:number)=>{body.style.height=`${Math.max(80,Math.min(innerHeight*.8,height))}px`;save();};
 let drag:{id:number;y:number;height:number}|undefined;
 handle.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();drag={id:e.pointerId,y:e.clientY,height:body.getBoundingClientRect().height};handle.setPointerCapture(e.pointerId);};
 handle.onpointermove=e=>{if(drag?.id===e.pointerId){e.preventDefault();resize(drag.height+e.clientY-drag.y);}};
 const stop=(e:PointerEvent)=>{if(drag?.id===e.pointerId){drag=undefined;if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);}};
 handle.onpointerup=stop;handle.onpointercancel=stop;handle.onlostpointercapture=()=>{drag=undefined;};
 handle.onkeydown=e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();resize(e.key==='Home'?80:e.key==='End'?innerHeight*.8:body.getBoundingClientRect().height+(e.key==='ArrowDown'?24:-24));};
 observer=new ResizeObserver(save);observer.observe(body);return handle;
}
