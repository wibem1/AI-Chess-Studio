import type { Server } from 'node:http';

function listen(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const failed = (error: Error) => { server.off('listening', ready); reject(error); };
    const ready = () => {
      server.off('error', failed);
      const address = server.address();
      if (!address || typeof address === 'string') { reject(new Error('Keine lokale Serveradresse verfügbar.')); return; }
      resolve(address.port);
    };
    server.once('error', failed);
    server.once('listening', ready);
    server.listen(port, '127.0.0.1');
  });
}

/** Only the default port may fall back. Explicit CHESS_PORT remains binding. */
export async function listenLocally(server: Server, port: number, allowFallback: boolean,
  notify: (message: string) => void = console.log): Promise<number> {
  try { return await listen(server, port); }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (!allowFallback || (code !== 'EADDRINUSE' && code !== 'EACCES')) throw error;
    notify(`Port ${port} ist ${code === 'EADDRINUSE' ? 'bereits belegt' : 'vom Betriebssystem nicht freigegeben'}. Ein freier lokaler Port wird gewählt.`);
    return listen(server, 0); // Let the OS select and bind atomically; no guessed range.
  }
}

export function startupError(error: unknown, port: number): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  if (code === 'EADDRINUSE') return `Lokaler Start fehlgeschlagen: Port ${port} ist bereits belegt (EADDRINUSE). Eine laufende App schließen oder CHESS_PORT ändern.`;
  if (code === 'EACCES' || code === 'EPERM') return `Lokaler Start fehlgeschlagen: Das Betriebssystem erlaubt den lokalen Port ${port} nicht (${code}). Portfreigabe bzw. Sicherheitssoftware prüfen oder CHESS_PORT ändern.`;
  return `Lokaler Start fehlgeschlagen${typeof code === 'string' && /^[A-Z0-9_]+$/.test(code) ? ` (${code})` : ''}. Lokalen Serverstart und Betriebssystem prüfen.`;
}
