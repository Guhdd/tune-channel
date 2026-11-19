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

let html = htmlMatch[1]
  .replaceAll("/tune-symbol-red.png", "./tune-symbol-red.png")
  .replaceAll("/assets/canais/", "./assets/canais/");

html = html.replace(
  "<head>",
  '<head><link rel="preconnect" href="https://script.google.com"><link rel="preconnect" href="https://www.youtube.com"><link rel="preconnect" href="https://i.ytimg.com"><link rel="dns-prefetch" href="https://script.googleusercontent.com">',
);

const browserConfig = `<script>
const TUNE_ENDPOINT=${JSON.stringify(endpoint)};
const TUNE_CACHE_KEY='tune-schedule-v6';
const TUNE_CACHE_TTL=1800000;
const TUNE_OLD_CACHE_KEYS=['tune-schedule-v5','tune-schedule-v4','tune-schedule-v3','tune-schedule-v2','tune-schedule-v1'];
const FALLBACK_VIDEOS=${fallbackVideosMatch[1]}.map(video=>({...video,duration:Math.max(1,video.duration-6),sourceDuration:video.duration}));
const FALLBACK_EPOCH=Date.parse(${JSON.stringify(fallbackEpochMatch[1])});
const FALLBACK_CHANNELS=[{id:'play',label:'PLAY',name:'TUNE PLAY',logo:'tune-play.png',epoch:FALLBACK_EPOCH,items:FALLBACK_VIDEOS}];`;

html = html.replace("<script>", browserConfig);

html = html.replace(
  "function reportAudience(event){fetch('/api/audience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({viewerId:audienceId(),event}),keepalive:true}).catch(()=>{})}",
  "function reportAudience(event){fetch(TUNE_ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({viewerId:audienceId(),event}),mode:'no-cors',keepalive:true}).catch(()=>{})}",
);

html = html.replace(
  "async function clock(){const startedAt=performance.now(),response=await fetch('/api/channel',{cache:'no-store'});if(!response.ok)throw Error('clock');const data=await response.json(),finishedAt=performance.now();if(!applyPayload(data,Number(data.now)+(finishedAt-startedAt)/2))throw Error('clock')}",
  "function loadSchedule(){return new Promise((resolve,reject)=>{const callback='__tuneSchedule'+Date.now()+Math.random().toString(36).slice(2),script=document.createElement('script'),timeout=setTimeout(()=>finish(Error('timeout')),10000);function cleanup(){clearTimeout(timeout);script.remove();try{delete window[callback]}catch{window[callback]=undefined}}function finish(error,data){cleanup();if(error)reject(error);else resolve(data)}window[callback]=data=>finish(null,data);script.src=TUNE_ENDPOINT+'?callback='+encodeURIComponent(callback)+'&_='+Date.now();script.onerror=()=>finish(Error('schedule'));document.head.append(script)})}async function loadScheduleWithRetry(){let lastError;for(let attempt=0;attempt<3;attempt++){try{return await loadSchedule()}catch(error){lastError=error;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,600*(attempt+1)))}}throw lastError}function saveSchedule(data){try{localStorage.setItem(TUNE_CACHE_KEY,JSON.stringify({...data,storedAt:Date.now()}));TUNE_OLD_CACHE_KEYS.forEach(key=>localStorage.removeItem(key))}catch{}}function restoreCachedSchedule(){try{TUNE_OLD_CACHE_KEYS.forEach(key=>localStorage.removeItem(key));const data=JSON.parse(localStorage.getItem(TUNE_CACHE_KEY)||'null'),age=Date.now()-Number(data&&data.storedAt);if(!data||!Number.isFinite(age)||age<0||age>TUNE_CACHE_TTL){localStorage.removeItem(TUNE_CACHE_KEY);return false}return applyPayload(data,Date.now())}catch{return false}}async function clock(){const data=await loadScheduleWithRetry();if(!applyPayload(data,Date.now()))throw Error('clock');saveSchedule(data)}",
);

html = html.replace(
  "clock().then(enableWatch).catch(()=>{$('title').textContent='Não foi possível carregar o canal';$('watchLabel').textContent='Recarregar';$('watch').disabled=false;$('watch').onclick=()=>location.reload()});",
  "const hadCachedSchedule=restoreCachedSchedule();clock().then(enableWatch).catch(()=>{if(hadCachedSchedule){enableWatch();return}applyPayload({channels:FALLBACK_CHANNELS,epoch:FALLBACK_EPOCH,now:Date.now()},Date.now());enableWatch()});",
);

html = html.replace("reportAudience('visit');", "setTimeout(()=>reportAudience('visit'),1500);");

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
await cp(path.join(projectRoot, "public", "assets"), path.join(outputDir, "assets"), { recursive: true });

console.log(`TUNE GitHub Pages gerada em ${outputDir}`);
