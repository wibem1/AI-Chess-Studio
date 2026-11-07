import {pathTo,type LearningGame} from '../src/game.js';
import type {SessionData} from '../src/session.js';
import {visibleReviewNodes,reviewLocked} from '../src/review.js';
/** The actual game line stays separate from freely explored study branches. */
export function learningLine(data:SessionData){
 const allowed=visibleReviewNodes(data);
 const end=data.game?.cursor??(data.review?data.review.original.at(-1):undefined)??data.activeNodeId;
 return pathTo(data,end!).filter(n=>allowed.has(n.id));
}
const observed=new WeakSet<HTMLElement>();
function keepSelectedVisible(container:HTMLElement){
 const selected=container.querySelector<HTMLElement>('[aria-current=true]');
 if(selected){const item=selected.getBoundingClientRect(),area=container.getBoundingClientRect(),top=item.top-area.top+container.scrollTop;if(top<container.scrollTop)container.scrollTop=top;else if(top+item.height>container.scrollTop+container.clientHeight)container.scrollTop=top+item.height-container.clientHeight;}

}
export function renderLearningReplay(data:SessionData,game:LearningGame,change:()=>void){
 const line=learningLine(data),locked=reviewLocked(data),current=data.nodes.find(n=>n.id===data.activeNodeId)!,index=line.findIndex(n=>n.id===current.id);
 const first=document.getElementById('learn-first') as HTMLButtonElement,next=document.getElementById('learn-next') as HTMLButtonElement,container=document.getElementById('learning-line')!;
 first.disabled=locked||current.id===line[0]?.id;next.disabled=locked||index<0||index>=line.length-1;
 first.onclick=()=>{game.analyse(line[0]!.id);change();};next.onclick=()=>{game.analyse(line[index+1]!.id);change();};
 container.replaceChildren();
 for(const [i,node] of line.entries()){
  const button=document.createElement('button');button.type='button';button.className='secondary';
  const parent=node.parentId?data.nodes.find(n=>n.id===node.parentId):undefined;
  const fields=parent?.fen.split(' '),number=fields?.[5]??'1',black=fields?.[1]==='b';
  button.textContent=i===0?'Ausgangsstellung':`${number}${black?'…':'.'} ${node.san}`;
  button.setAttribute('aria-label',i===0?'Ausgangsstellung ansehen':`${button.textContent} ansehen`);button.setAttribute('aria-current',String(node.id===current.id));button.disabled=locked;
  button.onclick=()=>{game.analyse(node.id);change();};container.append(button);
 }
 keepSelectedVisible(container);
 if(!observed.has(container)){observed.add(container);new ResizeObserver(()=>keepSelectedVisible(container)).observe(container);}
}
