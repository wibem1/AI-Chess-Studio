declare const __APP_BASE__:string;
/** Vite supplies the resolved deployment directory; Node adapters keep root URLs. */
export const APP_BASE=typeof __APP_BASE__==='string'?__APP_BASE__:'/';
export function appPath(path:string){return APP_BASE+path.replace(/^\/+/, '');}
