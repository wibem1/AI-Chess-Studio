import type {BoardMark} from '../src/coach-tools.js';
/** Coordinates stay tied to chess squares when the same board is flipped or resized. */
export function drawBoardMarks(board:HTMLElement,marks:BoardMark[],flipped:boolean){
 if(!marks.length)return;
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 800 800');svg.setAttribute('class','board-marks');svg.setAttribute('role','img');svg.setAttribute('aria-label',marks.map(m=>`${m.kind==='arrow'?'Pfeil':'Linie'} ${m.from} nach ${m.to}`).join(', '));
 const xy=(square:string)=>{const file=square.charCodeAt(0)-97,rank=Number(square[1])-1;return [(flipped?7-file:file)*100+50,(flipped?rank:7-rank)*100+50];};
 const colors={green:'#168443',red:'#ce352e',blue:'#245dd1'};
 for(const mark of marks){
  const [x1,y1]=xy(mark.from),[x2,y2]=xy(mark.to),angle=Math.atan2(y2!-y1!,x2!-x1!),arrow=mark.kind==='arrow',endX=x2!-(arrow?20:0)*Math.cos(angle),endY=y2!-(arrow?20:0)*Math.sin(angle);
  const line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1,y1,x2:endX,y2:endY,stroke:colors[mark.color],'stroke-width':10,'stroke-linecap':'round'}))line.setAttribute(k,String(v));svg.append(line);
  if(arrow){const head=document.createElementNS(ns,'polygon');const baseX=x2!-34*Math.cos(angle),baseY=y2!-34*Math.sin(angle);head.setAttribute('points',`${x2},${y2} ${baseX+17*Math.sin(angle)},${baseY-17*Math.cos(angle)} ${baseX-17*Math.sin(angle)},${baseY+17*Math.cos(angle)}`);head.setAttribute('fill',colors[mark.color]);svg.append(head);}
 }
 board.append(svg);
}
