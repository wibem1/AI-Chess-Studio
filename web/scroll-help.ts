import { APP_VERSION } from '../src/version.js';

/** Explicit scroll fallback plus local, text-free observations for native browser issues. */
export function installScrollHelp(cancelDrag: () => void) {
  const bar = document.createElement('nav');
  bar.className = 'scroll-help'; bar.setAttribute('aria-label', 'Scrollhilfe');
  const up = document.createElement('button'), down = document.createElement('button');
  const diagnose = document.createElement('button');
  up.textContent = '↑ Hoch'; down.textContent = '↓ Runter'; diagnose.textContent = 'Bedienung prüfen';
  for (const button of [up, down, diagnose]) button.type = 'button';
  bar.append(up, down, diagnose);
  const panel = document.createElement('section'); panel.className = 'scroll-report'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Bedienungsdiagnose');
  const title = document.createElement('h2'); title.textContent = 'Bedienungsdiagnose';
  const hint = document.createElement('p');
  hint.textContent = 'Nur technische Angaben zu dieser Seite. Keine Schlüssel, Eingaben oder Schachpartien. Diese Anzeige bleibt lokal.';
  const report = document.createElement('pre'); report.tabIndex = 0;
  const copy = document.createElement('button'), close = document.createElement('button');
  copy.type = close.type = 'button'; copy.textContent = 'Diagnose als Text speichern'; close.textContent = 'Schließen';
  const feedback = document.createElement('p'); feedback.setAttribute('role', 'status');
  panel.append(title, hint, copy, close, feedback, report);
  document.body.append(bar, panel);
  const events: { type: string; input?: string; prevented: boolean }[] = [];
  for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'wheel', 'keydown']) {
    document.addEventListener(type, event => {
      if (event instanceof KeyboardEvent && !['PageDown','PageUp','ArrowDown','ArrowUp','Home','End','Escape'].includes(event.key)) return;
      // Wait until dispatch completes to observe cancellation by any page listener.
      setTimeout(() => {
        const input = event instanceof PointerEvent ? event.pointerType
          : event instanceof KeyboardEvent ? event.key : undefined;
        events.push({type, ...(input ? {input} : {}), prevented:event.defaultPrevented});
        if (events.length > 12) events.shift();
      }, 0);
    }, {capture:true, passive:true});
  }
  const snapshot = () => {
    const root = document.scrollingElement;
    const css = (element: Element) => {
      const style = getComputedStyle(element);
      return {overflowY:style.overflowY,touchAction:style.touchAction,position:style.position};
    };
    return {
      appVersion:APP_VERSION, browser:navigator.userAgent,
      viewport:{width:innerWidth,height:innerHeight,scale:visualViewport?.scale ?? 1,pixelRatio:devicePixelRatio},
      focus:document.activeElement?.tagName ?? null,
      page:{top:root?.scrollTop ?? 0,height:root?.scrollHeight ?? 0,visible:root?.clientHeight ?? 0,
        scrollElement:root?.tagName ?? null,html:css(document.documentElement),body:css(document.body)},
      recentEvents:[...events],
    };
  };
  let lastMove: { before: number; after: number; maximum: number } | null = null;
  let serverVersion = 'noch nicht geprüft';
  const update = () => { report.textContent = JSON.stringify({...snapshot(),serverVersion,lastScrollHelp:lastMove},null,2); };
  let generation = 0;
  const scroll = (direction: number) => {
    cancelDrag();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const root = document.scrollingElement;
    const before = root?.scrollTop ?? 0;
    const request = ++generation;
    root?.scrollBy({top:direction*Math.max(160,innerHeight*0.65),behavior:'instant'});
    requestAnimationFrame(() => {
      if (request !== generation) return;
      lastMove = {before,after:root?.scrollTop ?? 0,maximum:Math.max(0,(root?.scrollHeight ?? 0)-(root?.clientHeight ?? 0))};
      if (!panel.hidden) update();
    });
  };
  up.addEventListener('click', () => scroll(-1)); down.addEventListener('click', () => scroll(1));
  diagnose.addEventListener('click', () => {
    panel.hidden = false; feedback.textContent = ''; update();
    void fetch('/api/diagnostics',{signal:AbortSignal.timeout(5000)}).then(response => {
      if (!response.ok) throw new Error(); return response.json();
    }).then(data => {
      serverVersion = typeof data.version === 'string' ? data.version : 'älterer Server ohne Versionsangabe'; update();
    }).catch(() => { serverVersion = 'Server nicht erreichbar'; update(); });
  });
  close.addEventListener('click', () => {panel.hidden = true; diagnose.focus({preventScroll:true});});
  copy.addEventListener('click', () => {
    update();
    const url = URL.createObjectURL(new Blob([report.textContent ?? ''],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = `AI-Chess-Studio-${APP_VERSION}-Bedienungsdiagnose.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    feedback.textContent = 'Diagnosedatei bereitgestellt. Sie enthält keine Eingabewerte.';
  });
}
