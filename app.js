// v2.9.2: disable service worker to avoid caching glitches while iterating
(async ()=>{
  try{
    if('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('fibreos-clean-')).map(k=>caches.delete(k)));
    }
  }catch(e){}
})();

const $=(q,el=document)=>el.querySelector(q);
const $$=(q,el=document)=>Array.from(el.querySelectorAll(q));
const SCREENS=["home","music","lock","aod"];
let active="home";

function show(screen){
  active=screen;
  SCREENS.forEach(id=>{
    const el=document.getElementById(id);
    el.classList.toggle("is-active", id===screen);
  });
  const label=$("#capSearchLabel");
  if(label) label.textContent = (screen==="music") ? "Search Music" : "Search Everything";
  $("#menuSheet").classList.add("hidden");
}

function tickTime(){
  const d=new Date();
  const hh=String(d.getUTCHours()).padStart(2,"0");
  const mm=String(d.getUTCMinutes()).padStart(2,"0");
  $("#capTime").textContent = `${hh}:${mm}`;
  $$("[data-hh]").forEach(n=>n.textContent=hh);
  $$("[data-mm]").forEach(n=>n.textContent=mm);
}

function updateDate(){
  const d=new Date();
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayName=days[d.getUTCDay()];
  const monthName=months[d.getUTCMonth()];
  const dateNum=String(d.getUTCDate());
  $$("[data-day]").forEach(n=>n.textContent=dayName);
  $$("[data-month]").forEach(n=>n.textContent=monthName);
  $$("[data-date]").forEach(n=>n.textContent=dateNum);
  const n=d.getUTCDate();
  const suffix = (n%100>=11&&n%100<=13)?"th":(n%10===1?"st":(n%10===2?"nd":(n%10===3?"rd":"th")));
  document.querySelector("[data-agenda]").textContent = `${dayName} ${dateNum}${suffix} ${monthName}`;
}

function fillAgenda(){
  $("#agendaList").innerHTML = `
    <div class="row">No events today</div>
    <div class="row">Tomorrow, 09:00 - 10:00: DPD Delivery Expected</div>
    <div class="row">Friday, 09:00 - 17:30: Lia @ Work</div>
  `;
}

function codeToText(code){
  if(code===0) return "Clear";
  if([1,2].includes(code)) return "Partly cloudy";
  if(code===3) return "Overcast";
  if([45,48].includes(code)) return "Fog";
  if([51,53,55].includes(code)) return "Drizzle";
  if([61,63,65].includes(code)) return "Rain";
  if([71,73,75].includes(code)) return "Snow";
  if([80,81,82].includes(code)) return "Showers";
  if([95,96,99].includes(code)) return "Storm";
  return "Cloudy";
}

async function updateWeather(){
  try{
    const lat=53.6458, lon=-1.7850;
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=GMT`;
    const r=await fetch(url);
    const j=await r.json();
    const now=Math.round(j.current.temperature_2m);
    const hi=Math.round(j.daily.temperature_2m_max[0]);
    const lo=Math.round(j.daily.temperature_2m_min[0]);
    const desc=codeToText(j.current.weather_code);
    $$("[data-now]").forEach(n=>n.textContent=String(now));
    $$("[data-hi]").forEach(n=>n.textContent=String(hi));
    $$("[data-lo]").forEach(n=>n.textContent=String(lo));
    $$("[data-desc]").forEach(n=>n.textContent=desc);
  }catch(e){}
}

async function initBattery(){
  const set=(pct)=>{
    const p=Math.max(0,Math.min(100,Math.round(pct)));
    $("#batPct").textContent = `${p}%`;
    const fill=$("#batFill");
    const px=Math.max(6,(p/100)*24);
    fill.style.width = `${px}px`;
    if(p<=10) fill.style.background="rgba(255,80,80,.92)";
    else if(p<=20) fill.style.background="rgba(255,210,0,.90)";
    else fill.style.background="rgba(255,255,255,.86)";
  };
  try{
    if(!navigator.getBattery) throw new Error("no api");
    const b=await navigator.getBattery();
    const apply=()=>set(b.level*100);
    apply();
    b.addEventListener("levelchange", apply);
  }catch(e){
    set(72);
  }
}

function renderMusicGrid(){
  const grid=$("#musicGrid");
  grid.innerHTML="";
  const covers=window.__COVERS__||[];
  const seed=new Date().getUTCDate();
  const rand=(i)=>Math.abs(Math.sin((i+1)*(seed+3)*9999))%1;
  for(let i=0;i<12;i++){
    const t=document.createElement("div");
    t.className="albumTile";
    if(covers.length){
      const idx=Math.floor(rand(i)*covers.length);
      t.style.backgroundImage = `url('${covers[idx]}')`;
    }
    grid.appendChild(t);
  }
  if(covers.length){
    $("#npArt").style.backgroundImage = `url('${covers[0]}')`;
  }
}

const DEFAULT_PIN="1234";
let pinEntry="";
function updatePinDots(){
  const dots=$$("#pinDots .dot");
  dots.forEach((d,i)=>d.classList.toggle("filled", i<pinEntry.length));
}
function setPinMsg(msg){ $("#pinMsg").textContent = msg||""; }
function resetPin(){ pinEntry=""; updatePinDots(); setPinMsg(""); }

function checkPin(){
  if(pinEntry===DEFAULT_PIN){
    setPinMsg("Unlocked");
    setTimeout(()=>{ resetPin(); show("home"); }, 140);
  }else{
    setPinMsg("Wrong PIN");
    setTimeout(()=>{ resetPin(); }, 420);
  }
}
function renderPinPad(){
  const pad=$("#pinPad");
  pad.innerHTML="";
  const keys=["1","2","3","4","5","6","7","8","9","⌫","0","OK"];
  keys.forEach(k=>{
    const b=document.createElement("button");
    b.className="pinKey"; b.type="button"; b.textContent=k;
    b.onclick=()=>{
      if(k==="⌫"){ pinEntry=pinEntry.slice(0,-1); updatePinDots(); return; }
      if(k==="OK"){ checkPin(); return; }
      if(pinEntry.length>=4) return;
      pinEntry+=k; updatePinDots();
      if(pinEntry.length===4) checkPin();
    };
    pad.appendChild(b);
  });
}

$("#menuBtn").addEventListener("click", ()=>$("#menuSheet").classList.toggle("hidden"));
$$(".appIcon").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const go=btn.getAttribute("data-go");
    $("#menuSheet").classList.add("hidden");
    if(go==="lock"){ resetPin(); show("aod"); return; }
    show(go);
  });
});
$("#capSearch").addEventListener("click", ()=>{
  if(active==="music") $("#musicInput").focus();
  else $("#capSearchLabel").animate([{opacity:1},{opacity:.55},{opacity:1}],{duration:520});
});
$("#aod").addEventListener("click", ()=>{ resetPin(); show("lock"); });

renderPinPad();
fillAgenda();
updateDate();
renderMusicGrid();
tickTime();
setInterval(tickTime, 15000);
updateWeather();
setInterval(updateWeather, 600000);
initBattery();

// --- Gesture nav testing (Home panels) ---
const panels = {
  left: document.getElementById('panelLeft'),
  right: document.getElementById('panelRight'),
  top: document.getElementById('panelTop'),
  bottom: document.getElementById('panelBottom'),
};
function closePanels(){
  Object.values(panels).forEach(p=>p && p.classList.remove('is-open'));
}
function anyPanelOpen(){
  return Object.values(panels).some(p=>p && p.classList.contains('is-open'));
}
function openPanel(which){
  closePanels();
  const p = panels[which];
  if(p) p.classList.add('is-open');
}
Object.values(panels).forEach(p=>{
  if(!p) return;
  p.addEventListener('click', (e)=>{
    // tap outside card closes
    if(e.target === p) closePanels();
  });
});

// Drawer buttons navigate
document.querySelectorAll('.drawerApp').forEach(b=>{
  b.addEventListener('click', ()=>{
    const go=b.getAttribute('data-go');
    closePanels();
    if(go==='lock'){ resetPin(); show('aod'); return; }
    show(go);
  });
});

let touchStart=null;
function onStart(e){
  if(active==='lock' || active==='aod') return; // keep PIN/AOD simple
  const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
  touchStart = {x:t.clientX, y:t.clientY, time:Date.now()};
}
function onEnd(e){
  if(!touchStart) return;
  if(active==='lock' || active==='aod') { touchStart=null; return; }
  const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : e;
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const adx = Math.abs(dx), ady=Math.abs(dy);
  const dt = Date.now()-touchStart.time;
  touchStart=null;

  // If a panel is open, interpret opposite close directions:
  // Widgets: open L->R, close R->L
  // Connect: open R->L, close L->R
  // Multitasking: open T->B, close B->T
  // App drawer: open B->T, close T->B
  const threshold = 56;
  const fast = dt < 500;

  const closeBy = (which)=>{
    if(panels[which] && panels[which].classList.contains('is-open')) closePanels();
  };

  if(anyPanelOpen()){
    if(adx>ady && adx>threshold){
      if(dx<0) closeBy('left');    // R->L closes left
      if(dx>0) closeBy('right');   // L->R closes right
    }else if(ady>adx && ady>threshold){
      if(dy<0) closeBy('top');     // B->T closes top
      if(dy>0) closeBy('bottom');  // T->B closes bottom
    }
    return;
  }

  // Home-only opens panels (global gestures can be expanded later)
  if(active==='home'){
    if(adx>ady && adx>threshold){
      if(dx>0) openPanel('left');      // L->R opens Widgets
      else openPanel('right');         // R->L opens Connect
      return;
    }
    if(ady>adx && ady>threshold){
      if(dy>0) openPanel('top');       // T->B opens Multitasking
      else openPanel('bottom');        // B->T opens App drawer
      return;
    }
  }
}
// attach to content area so it doesn't fight browser chrome too much
document.getElementById('content').addEventListener('touchstart', onStart, {passive:true});
document.getElementById('content').addEventListener('touchend', onEnd, {passive:true});

// Home bar: tap OR swipe up from capsule returns Home (from any app)
const homeBar = document.querySelector('.homeBar');
if(homeBar){
  homeBar.addEventListener('click', ()=>{ closePanels(); show('home'); });
}
let capStart=null;
document.getElementById('capsule').addEventListener('touchstart', (e)=>{
  const t=e.touches[0];
  capStart={x:t.clientX,y:t.clientY,time:Date.now()};
},{passive:true});
document.getElementById('capsule').addEventListener('touchend', (e)=>{
  if(!capStart) return;
  const t=e.changedTouches[0];
  const dy=t.clientY-capStart.y;
  const ady=Math.abs(dy);
  capStart=null;
  if(ady>48 && dy<0){ closePanels(); show('home'); }
},{passive:true});

show("home");
