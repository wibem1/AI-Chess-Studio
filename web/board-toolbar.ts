/** Keep board actions together below the board, on every viewport. */
export function installBoardToolbar(){
 const board=document.getElementById('board')!,toolbar=document.querySelector<HTMLElement>('.board-heading')!,actions=toolbar.querySelector('.board-actions')!;
 for(const id of ['coach-match','coach-plan-bar','learn-back','learn-next'])actions.append(document.getElementById(id)!);
 board.after(toolbar);
 toolbar.setAttribute('aria-label','Brettsteuerung');
}
