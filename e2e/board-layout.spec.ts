import {test,expect,type Locator} from '@playwright/test';
import {Session} from '../src/session.js';

async function completeBoard(board:Locator,cells='button'){
 const defects=await board.evaluate((element,selector)=>{
  const outer=element.getBoundingClientRect(),scale=outer.width/(element as HTMLElement).offsetWidth;
  const left=outer.left+(element as HTMLElement).clientLeft*scale,top=outer.top+(element as HTMLElement).clientTop*scale;
  const width=(element as HTMLElement).clientWidth*scale,height=(element as HTMLElement).clientHeight*scale;
  const squares=[...element.querySelectorAll<HTMLElement>(selector)],problems:string[]=[];
  if(squares.length!==64)problems.push(`${squares.length} statt 64 Felder`);
  squares.forEach((square,index)=>{
   const r=square.getBoundingClientRect(),id=square.dataset.square??String(index);
   if(r.left<left-1.5||r.right>left+width+1.5||r.top<top-1.5||r.bottom>top+height+1.5)problems.push(`${id} abgeschnitten`);
   if(Math.abs(r.width-width/8)>1.5||Math.abs(r.height-height/8)>1.5||Math.abs(r.width-r.height)>1.5)problems.push(`${id} nicht quadratisch/gleich groß`);
   if(square.firstChild?.nodeType===Node.TEXT_NODE&&square.firstChild.textContent?.trim()){
    const range=document.createRange();range.selectNode(square.firstChild);const glyph=range.getBoundingClientRect();
    if(glyph.width>r.width+1.5||glyph.height>r.height+1.5)problems.push(`${id} Figur zu groß`);
   }
  });return problems;
 },cells);
 expect(defects).toEqual([]);
}

test('all eight files and ranks stay fully visible in small desktop boards, zoom and both orientations',async({page})=>{
 await page.goto('/');
 for(const size of [{width:1280,height:600},{width:1440,height:900},{width:1920,height:1080},{width:980,height:560},{width:901,height:500},{width:900,height:500},{width:390,height:844},{width:820,height:1180}]){
  await page.setViewportSize(size);
  for(const zoom of [1,1.5,2]){
   await page.evaluate(value=>{document.documentElement.style.zoom=String(value);},zoom);
   await completeBoard(page.locator('#board'));
   await page.locator('#board-flip').click();await completeBoard(page.locator('#board'));await page.locator('#board-flip').click();
  }
 }
 await page.setViewportSize({width:1280,height:600});await page.evaluate(()=>{document.documentElement.style.zoom='1';document.documentElement.style.fontSize='24px';});await completeBoard(page.locator('#board'));
 await page.evaluate(()=>document.documentElement.style.fontSize='16px');
 await page.getByRole('button',{name:'h2: Weiß Bauer',exact:true}).click();await page.getByRole('button',{name:'h4: leer',exact:true}).click();await expect(page.locator('#position-status')).toContainText('n1 · Schwarz');await completeBoard(page.locator('#board'));
});

test('both comparison boards retain 64 square cells and fitting pieces in narrow columns',async({page})=>{
 const session=new Session();session.play('e4');const a=session.snapshot().activeNodeId;session.select('n0');session.play('d4');session.compare(a,session.snapshot().activeNodeId);
 await page.goto('/');await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByText('Sitzung speichern oder laden',{exact:true}).click();await page.locator('#session-json').fill(session.export());await page.locator('#import').click();await page.getByRole('tab',{name:'Varianten',exact:true}).click();
 for(const size of [{width:980,height:560},{width:1280,height:600},{width:390,height:844},{width:820,height:1180}]){
  await page.setViewportSize(size);await expect(page.locator('.mini-board')).toHaveCount(2);
  for(const board of await page.locator('.mini-board').all())await completeBoard(board,'span');
 }
});
