import {mkdtempSync,readdirSync,readFileSync,writeFileSync,copyFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {join,resolve,dirname,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const repository='https://github.com/wibem1/AI-Chess-Studio.git';
const base='/AI-Chess-Studio/',build=resolve('pages-dist');
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const allowed=path=>/^engine\/maia2-blitz-ort1\.31\.1\/(?:maia2-blitz\.fp16\.onnx|ort-wasm-simd-threaded\.(?:mjs|wasm)|LICENSES\.txt|SOURCE\.txt)$/.test(path)||/^(?:index\.html|manifest\.webmanifest|service-worker\.js|licenses\.html|_headers|\.nojekyll|BUILD\.json|icons\/(?:icon-192|icon-512|apple-touch-icon)\.png|licenses\/chess\.js-LICENSE\.txt|assets\/[\w-]+\.(?:js|css)|engine\/stockfish-19\.0\.1\/(?:COPYING\.txt|SOURCE\.txt|stockfish-19-lite-single\.(?:js|wasm)))$/.test(path);
function files(folder){return readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{const path=join(folder,entry.name);if(entry.isSymbolicLink())throw new Error('Symbolische Links werden nicht veröffentlicht.');return entry.isDirectory()?files(path):[path];});}
const input=files(build);
for(const path of input)if(!allowed(relative(build,path).replaceAll('\\','/')))throw new Error('Unerwartete Datei im Web-Build.');
if(!readFileSync(join(build,'index.html'),'utf8').includes(base+'assets/')||!readFileSync(join(build,'service-worker.js'),'utf8').includes('BASE='+JSON.stringify(base)))throw new Error('Zuerst npm run build:pages ausführen.');
if(!existsSync(join(build,'.nojekyll')))throw new Error('Pages-Kennzeichnung fehlt.');
const git=(args,cwd=process.cwd())=>execFileSync('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0'}}).trim();
const sourceCommit=git(['rev-parse','HEAD']);
const manifest={kind:'github-pages-static-site',project:'AI-Chess-Studio',version,base,sourceCommit,files:Object.fromEntries(input.map(path=>[relative(build,path).replaceAll('\\','/'),createHash('sha256').update(readFileSync(path)).digest('hex')]))};
function populate(folder){for(const path of input){const target=join(folder,relative(build,path));mkdirSync(dirname(target),{recursive:true});copyFileSync(path,target);}writeFileSync(join(folder,'BUILD.json'),JSON.stringify(manifest,null,2)+'\n');}
if(process.argv.includes('--prepare-only')){
 mkdirSync('artifacts',{recursive:true});const folder=mkdtempSync(resolve('artifacts',`Pages-${version}-`));populate(folder);console.log(JSON.stringify({prepared:folder,files:input.length+1,version,sourceCommit,repository,published:false}));
}else{
 const temporary=mkdtempSync(join(tmpdir(),'chess-pages-publish-')),folder=join(temporary,'site');
 try{
  mkdirSync(folder);git(['init','--initial-branch=gh-pages'],folder);git(['remote','add','origin',repository],folder);
  if(git(['ls-remote','--heads','origin','refs/heads/gh-pages'],folder)){git(['fetch','--depth=1','origin','gh-pages'],folder);git(['checkout','-B','gh-pages','FETCH_HEAD'],folder);}
  const entries=readdirSync(folder).filter(name=>name!=='.git');
  if(entries.length){const marker=join(folder,'BUILD.json');if(!existsSync(marker))throw new Error('Ziel enthält keine bekannte Chess-Studio-Web-Veröffentlichung.');const previous=JSON.parse(readFileSync(marker,'utf8'));if(previous.kind!==manifest.kind||previous.project!==manifest.project)throw new Error('Andere Zielanwendung: Veröffentlichung abgebrochen.');for(const path of files(folder).filter(path=>!path.startsWith(join(folder,'.git')+'/')))if(!allowed(relative(folder,path).replaceAll('\\','/')))throw new Error('Fremde Datei im Ziel; keine Änderung ausgeführt.');}
  for(const entry of entries)rmSync(join(folder,entry),{recursive:true,force:true});
  populate(folder);git(['add','--all'],folder);
  if(git(['status','--porcelain'],folder)){git(['-c','user.name=Chess Studio Publisher','-c','user.email=chess-studio-publisher@users.noreply.github.com','commit','-m',`Publish Chess Studio ${version} (${sourceCommit.slice(0,7)})`],folder);git(['push','origin','HEAD:refs/heads/gh-pages'],folder);}
  console.log('Web-Dateien gesichert. GitHub Pages muss gh-pages / (root) verwenden. Onlinegang erst nach Prüfung der von GitHub gemeldeten Adresse bestätigen.');
 }finally{rmSync(temporary,{recursive:true,force:true});}
}
