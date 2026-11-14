import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(projectRoot, "src", "legacy", "original-worker.mjs");
const outputDir = path.join(projectRoot, "dist");
const endpoint =
  "https://script.google.com/macros/s/AKfycbx3yTSlYYPBPUlka1j0NEuWhrUrLnLjL8WBGhbxl5Zy_IMiLjwle6aasLJjSjh7uPNB/exec";

const source = await readFile(sourcePath, "utf8");
const htmlMatch = source.match(/const HTML=String\.raw`([\s\S]*)`;\s*$/);

if (!htmlMatch) {
  throw new Error("Não foi possível extrair o HTML da TUNE.");
}

const fallbackVideosMatch = source.match(/const VIDEOS = (\[[^;]+\]);/);
const fallbackEpochMatch = source.match(/const EPOCH = Date\.parse\('([^']+)'\);/);

if (!fallbackVideosMatch || !fallbackEpochMatch) {
  throw new Error("A programação de contingência não foi encontrada.");
}

let html = htmlMatch[1].replaceAll("/tune-symbol-red.png", "./tune-symbol-red.png");

const browserConfig = `<script>
const TUNE_ENDPOINT=${JSON.stringify(endpoint)};
const FALLBACK_VIDEOS=${fallbackVideosMatch[1]};
const FALLBACK_EPOCH=Date.parse(${JSON.stringify(fallbackEpochMatch[1])});`;

html = html.replace("<script>", browserConfig);

html = html.replace(
  "function reportAudience(event){fetch('/api/audience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({viewerId:audienceId(),event}),keepalive:true}).catch(()=>{})}",
  "function reportAudience(event){fetch(TUNE_ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({viewerId:audienceId(),event}),mode:'no-cors',keepalive:true}).catch(()=>{})}",
);

html = html.replace(
  "async function clock(){const a=performance.now(),r=await fetch('/api/channel',{cache:'no-store'});if(!r.ok)throw Error('clock');const d=await r.json(),b=performance.now();videos=d.videos;epoch=d.epoch;clockBase=d.now+(b-a)/2;perfBase=b;render()}",
  "function loadSchedule(){return new Promise((resolve,reject)=>{const callback='__tuneSchedule'+Date.now()+Math.random().toString(36).slice(2),script=document.createElement('script'),timeout=setTimeout(()=>finish(Error('timeout')),10000);function cleanup(){clearTimeout(timeout);script.remove();try{delete window[callback]}catch{window[callback]=undefined}}function finish(error,data){cleanup();if(error)reject(error);else resolve(data)}window[callback]=data=>finish(null,data);script.src=TUNE_ENDPOINT+'?callback='+encodeURIComponent(callback)+'&_='+Date.now();script.onerror=()=>finish(Error('schedule'));document.head.append(script)})}function parseSchedule(data){if(!data||data.status!=='ok'||!Array.isArray(data.items))return [];return data.items.flatMap(item=>{const id=typeof item.id==='string'?item.id.trim():'',title=typeof item.title==='string'?item.title.trim():'',duration=Math.round(Number(item.duration));return /^[A-Za-z0-9_-]{11}$/.test(id)&&Number.isFinite(duration)&&duration>0?[{id,title:title||'Conteúdo TUNE',duration}]:[]})}async function clock(){const a=performance.now(),d=await loadSchedule(),b=performance.now(),items=parseSchedule(d);if(!items.length)throw Error('clock');videos=items;epoch=Number(d.epoch)>0?Number(d.epoch):FALLBACK_EPOCH;clockBase=Date.now()+(b-a)/2;perfBase=b;render()}",
);

html = html.replace(
  "clock().then(enableWatch).catch(()=>{$('title').textContent='Não foi possível carregar o canal';$('watchLabel').textContent='Recarregar';$('watch').disabled=false;$('watch').onclick=()=>location.reload()});",
  "clock().then(enableWatch).catch(()=>{videos=FALLBACK_VIDEOS;epoch=FALLBACK_EPOCH;clockBase=Date.now();perfBase=performance.now();render();enableWatch()});",
);

if (html.includes("/api/channel") || html.includes("/api/audience")) {
  throw new Error("A versão estática ainda contém rotas de servidor.");
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "index.html"), html, "utf8");
await writeFile(path.join(outputDir, ".nojekyll"), "", "utf8");
await cp(
  path.join(projectRoot, "public", "tune-symbol-red.png"),
  path.join(outputDir, "tune-symbol-red.png"),
);

console.log(`TUNE GitHub Pages gerada em ${outputDir}`);
