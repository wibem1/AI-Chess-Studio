/** Exact versioned public assets; no node_modules directory is exposed. */
export const ENGINE_ASSET_BASE = '/engine/stockfish-19.0.1/';
export const ENGINE_FILES = {
  script:'stockfish-19-lite-single.js',
  wasm:'stockfish-19-lite-single.wasm',
  license:'COPYING.txt',
  source:'SOURCE.txt'
} as const;
export function engineAsset(path:string):string|null {
  if(!path.startsWith(ENGINE_ASSET_BASE))return null;
  const name=path.slice(ENGINE_ASSET_BASE.length);
  return Object.values(ENGINE_FILES).some(file=>file===name)?name:null;
}
export function engineContentType(name:string):string {
  return name.endsWith('.wasm')?'application/wasm':name.endsWith('.onnx')?'application/octet-stream':(name.endsWith('.js')||name.endsWith('.mjs'))?'text/javascript; charset=utf-8':'text/plain; charset=utf-8';
}
