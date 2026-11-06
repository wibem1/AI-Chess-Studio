export type View = 'play' | 'learn' | 'variants' | 'settings';
const hashes: Record<View,string> = {play:'partie',learn:'lernen',variants:'varianten',settings:'einstellungen'};

/** Navigation only changes visibility. The shared board/session is never recreated. */
export function installNavigation(cancelGesture: () => void) {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role=tab][data-view]')];
  const workspace = document.getElementById('workspace')!;
  const board = document.getElementById('board-area')!;
  const fromHash = (): View => (Object.entries(hashes).find(([,hash]) => location.hash === '#'+hash)?.[0] as View) ?? 'play';
  let current: View = fromHash();
  const select = (view: View, focus = false, writeHistory = true) => {
    cancelGesture(); current = view;
    for (const tab of tabs) {
      const active = tab.dataset.view === view;
      tab.setAttribute('aria-selected',String(active)); tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')!)!.hidden = !active;
      if (active && focus) tab.focus({preventScroll:true});
    }
    board.hidden = view === 'settings'; workspace.dataset.activeView = view;
    if (writeHistory && location.hash !== '#'+hashes[view]) history.pushState(null,'','#'+hashes[view]);
    window.scrollTo({top:0,behavior:'instant'});
  };
  for (const [index,tab] of tabs.entries()) {
    tab.addEventListener('click',() => select(tab.dataset.view as View));
    tab.addEventListener('keydown',event => {
      let next: number;
      if (event.key === 'ArrowRight') next = (index+1)%tabs.length;
      else if (event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length-1;
      else return;
      event.preventDefault(); select(tabs[next]!.dataset.view as View,true);
    });
  }
  document.querySelectorAll<HTMLElement>('[data-open-view]').forEach(button => {
    button.addEventListener('click',() => select(button.dataset.openView as View,true));
  });
  document.getElementById('open-game-setup')!.addEventListener('click',() => {
    select('play');
    document.querySelector<HTMLDetailsElement>('.game-panel details')!.open = true;
    document.querySelector('.game-panel')!.scrollIntoView({block:'start',behavior:'instant'});
    document.getElementById('game-color')!.focus({preventScroll:true});
  });
  window.addEventListener('popstate',() => select(fromHash(),false,false));
  window.addEventListener('hashchange',() => {if(fromHash()!==current)select(fromHash(),false,false);});
  select(current,false,false);
}
