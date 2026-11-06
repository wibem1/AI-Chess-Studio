import {type Page,expect} from '@playwright/test';
export async function openView(page:Page,name:string){
 if(name==='settings'||name==='Einstellungen'){await page.locator('#open-settings').click();return;}
 if(name==='variants'||name==='Varianten'){await page.getByRole('tab',{name:'Lernmodus',exact:true}).click();const panel=page.locator('#panel-variants');if(await panel.getAttribute('open')===null)await panel.locator(':scope > summary').click();await expect(panel).toBeVisible();return;}
 await page.getByRole('tab',{name:name==='play'||name==='Spielmodus'?'Spielmodus':'Lernmodus',exact:true}).click();
}
