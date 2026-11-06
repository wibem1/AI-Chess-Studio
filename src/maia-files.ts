export const MAIA_ASSET_BASE='/engine/maia2-blitz-ort1.31.1/';
export const MAIA_FILES=['maia2-blitz.fp16.onnx','ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm','LICENSES.txt','SOURCE.txt'] as const;
export const MAIA_SHA256='fdfa2a8d52d88b73373074cd9124f1c1e244e6d8ff4175f2400ca532ecca9e13';
export const MAIA_BYTES=42532592;
export const MAIA_PROFILES=[1100,1300,1500,1700,1900] as const;
export const MAIA_CACHE='chess-studio-maia2-blitz-ort1.31.1';
export function maiaAsset(path:string):string|null{return path.startsWith(MAIA_ASSET_BASE)&&MAIA_FILES.some(name=>MAIA_ASSET_BASE+name===path)?path.slice(MAIA_ASSET_BASE.length):null;}
