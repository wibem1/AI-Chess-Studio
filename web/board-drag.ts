import { Chess, type Square } from 'chess.js';

/** Pointer events support mouse, pen and touch without native HTML drag images. */
export function installBoardDrag(board: HTMLElement, fen: () => string,
  play: (from: Square, to: Square) => void) {
  let drag: { id: number; from: Square; x: number; y: number; source: HTMLElement;
    ghost: HTMLElement | null; targets: Square[] } | null = null;
  let suppressClick = false;
  const cellAt = (x: number, y: number) => {
    const cell = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-square]');
    return cell && board.contains(cell) ? cell : null;
  };
  const cancel = () => {
    if (!drag) return;
    const current = drag; drag = null;
    current.ghost?.remove();
    board.querySelectorAll('.drag-source,.drag-target,.drop-hover').forEach(cell =>
      cell.classList.remove('drag-source', 'drag-target', 'drop-hover'));
    if (current.source.hasPointerCapture(current.id)) current.source.releasePointerCapture(current.id);
  };
  board.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    const source = (event.target as Element).closest<HTMLElement>('[data-square]');
    if (!source || !board.contains(source)) return;
    const from = source.dataset.square as Square;
    const chess = new Chess(fen());
    if (chess.isGameOver() || chess.get(from)?.color !== chess.turn()) return;
    drag = { id: event.pointerId, from, x: event.clientX, y: event.clientY, source,
      ghost: null, targets: chess.moves({ square: from, verbose: true }).map(move => move.to) };
    source.setPointerCapture(event.pointerId);
  });
  board.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.ghost && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
    if (!drag.ghost) {
      const ghost = document.createElement('div'); ghost.className = 'drag-piece';
      ghost.setAttribute('aria-hidden', 'true'); ghost.textContent = drag.source.firstChild?.textContent ?? '';
      const rect = drag.source.getBoundingClientRect();
      ghost.style.width = `${rect.width}px`; ghost.style.height = `${rect.height}px`;
      ghost.style.fontSize = getComputedStyle(drag.source).fontSize;
      document.body.append(ghost); drag.ghost = ghost;
      drag.source.classList.add('drag-source');
      board.querySelectorAll<HTMLElement>('[data-square]').forEach(cell => {
        if (drag!.targets.includes(cell.dataset.square as Square)) cell.classList.add('drag-target');
      });
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
    board.querySelector('.drop-hover')?.classList.remove('drop-hover');
    cellAt(event.clientX, event.clientY)?.classList.add('drop-hover');
  });
  board.addEventListener('pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const { from, ghost } = drag;
    const to = cellAt(event.clientX, event.clientY)?.dataset.square as Square | undefined;
    cancel();
    if (!ghost) return; // Preserve two-click and keyboard input.
    event.preventDefault(); suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    if (to && to !== from) play(from, to);
  });
  board.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  board.addEventListener('pointercancel', cancel);
  board.addEventListener('lostpointercapture', cancel);
  window.addEventListener('blur', cancel);
  window.addEventListener('keydown', event => { if (event.key === 'Escape') cancel(); });
  return cancel;
}
