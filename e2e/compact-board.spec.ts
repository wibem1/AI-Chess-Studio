import {test,expect} from '@playwright/test';
async function connect(page:import('@playwright/test').Page){
 await page.goto('/?platform=web');await expect(page.locator('#workspace')).not.toHaveAttribute('inert','');
 await page.locator('#open-settings').click();await page.locator('#api-settings > summary').click();await page.locator('#api-key').fill('fixture-compact-only');await page.locator('#api-cost-consent').check();await page.locator('#api-connect').click();await expect(page.locator('#api-feedback')).toContainText('gespeichert');await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();
}
test('compact workspace shows model only, hides connection and legacy prompts, suppresses play targets and jumps to start',async({page})=>{
 await connect(page);await expect(page.locator('#active-model-summary')).toContainText('gpt-4.1-mini');await expect(page.locator('#ai-access-card')).toBeHidden();await expect(page.locator('#analyse-game')).toBeHidden();await expect(page.locator('#analyse-position')).toBeHidden();await expect(page.getByText('Kommentar zu dieser Stellung',{exact:true})).toBeHidden();
 await page.getByRole('tab',{name:'Spielmodus',exact:true}).click();await page.locator('#board [data-square=e2]').click();await expect(page.locator('#board .target')).toHaveCount(0);await page.locator('#board [data-square=e4]').click();await expect(page.locator('#position-status')).toContainText('n1');
 await page.getByRole('button',{name:'Zum Anfang springen',exact:true}).click();await expect(page.getByRole('tab',{name:'Lernmodus',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('#position-status')).toContainText('n0');await page.locator('#learn-next').click();await expect(page.locator('#position-status')).toContainText('n1');
 for(const size of [{width:1600,height:900},{width:1032,height:552},{width:390,height:844}]){
  await page.setViewportSize(size);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('#active-model-summary')).toBeVisible();await expect(page.locator('#board button')).toHaveCount(64);
  await page.screenshot({path:`/tmp/chess-compact-${size.width}.png`,fullPage:true});
 }
});
test('model builds a teaching position, draws and flips arrows and lines, and returns to the unchanged game',async({page})=>{
 let calls=0;const fen='4k3/8/8/8/8/8/4K3/8 w - - 0 1';
 await page.route('https://api.openai.com/**',async route=>{
  const body=route.request().postDataJSON();calls++;
  if(calls===1||calls===3){expect(body.tools.map((x:any)=>x.function.name)).toContain('show_position');const name=calls===1?'show_position':'draw_board';const marks=[{from:'e2',to:'e3',kind:calls===1?'arrow':'line',color:calls===1?'green':'blue'}];return route.fulfill({json:{choices:[{finish_reason:'tool_calls',message:{content:null,tool_calls:[{id:`diagram_${calls}`,type:'function',function:{name,arguments:JSON.stringify({...calls===1?{fen}:{},marks})}}]}}],usage:{prompt_tokens:30,completion_tokens:30}}});}
  const result=JSON.parse(body.messages.at(-1).content);expect(result.fen).not.toBe(fen);expect(result.moves).toEqual([]);if(calls===2)expect(result.diagram.fen).toBe(fen);
  return route.fulfill({json:{choices:[{finish_reason:'stop',message:{content:'Die Lehrstellung ist als Diagramm dargestellt.'}}],usage:{prompt_tokens:30,completion_tokens:30}}});
 });
 await connect(page);await page.locator('#question').fill('Baue eine Lehrstellung mit zwei Königen und einem Pfeil auf.');await page.locator('#ask').click();await expect(page.locator('#dialogue-feedback')).toContainText('Modellantwort');
 await expect(page.locator('#board [data-square=e2]')).toHaveAttribute('aria-label','e2: Weiß König');await expect(page.locator('#board .board-marks polygon')).toHaveCount(1);await expect(page.locator('#board .board-marks line')).toHaveAttribute('x1','450');
 await page.locator('#board [data-square=e2]').click();await page.locator('#board [data-square=e3]').click();await expect(page.locator('#board [data-square=e2]')).toHaveAttribute('aria-label','e2: Weiß König');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'/tmp/chess-teaching-diagram.png',fullPage:true});
 await page.locator('#board-flip').click();await expect(page.locator('#board .board-marks line')).toHaveAttribute('x1','350');
 await page.locator('#question').fill('Zeichne stattdessen eine blaue Linie.');await page.locator('#ask').click();await expect(page.locator('#board .board-marks line')).toHaveAttribute('stroke','#245dd1');await expect(page.locator('#board .board-marks polygon')).toHaveCount(0);await expect(page.locator('#board [data-square=e2]')).toHaveAttribute('aria-label','e2: Weiß König');
 await page.locator('#diagram-close').click();await expect(page.locator('#position-status')).toContainText('n0');await expect(page.locator('#board [data-square=e2]')).toHaveAttribute('aria-label','e2: Weiß Bauer');await expect(page.locator('#board .board-marks')).toHaveCount(0);expect(calls).toBe(4);
 await page.screenshot({path:'/tmp/chess-teaching-return.png',fullPage:true});
});
