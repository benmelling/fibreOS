
function setBatteryUI(pct, charging){
  const fill=document.getElementById("batFill");
  const pctEl=document.getElementById("batPct");
  const batWrap=document.querySelector(".battery");
  if(fill) fill.style.width = `${Math.max(4, Math.min(100, pct))}%`;
  if(pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  if(batWrap){
    batWrap.classList.toggle("is-charging", !!charging);
    batWrap.classList.toggle("is-lowpower", !!lowPowerMode && !charging && pct>=10);
    batWrap.classList.toggle("is-critical", !charging && pct<10);
  }
}

async function initBattery(){
  // Battery Status API (works in Chromium/Android, but can be blocked; fall back to dummy)
  try{
    if(navigator.getBattery){
      const b = await navigator.getBattery();
      const update = ()=>{
        const pct = (b.level||0)*100;
        setBatteryUI(pct, b.charging);
      };
      b.addEventListener("levelchange", update);
      b.addEventListener("chargingchange", update);
      update();
      return;
    }
  }catch(e){}
  // Dummy battery cycle
  let pct = 64;
  let charging = false;
  setBatteryUI(pct, charging);
  setInterval(()=>{
    if(charging){ pct += 2; if(pct>=100){ pct=100; charging=false; } }
    else { pct -= 1; if(pct<=6){ pct=6; charging=true; } }
    setBatteryUI(pct, charging);
  }, 2500);
}


function setSignals(cellLevel, wifiLevel){
  const cell=document.querySelector(".sig-cell");
  const wifi=document.querySelector(".sig-wifi");
  if(cell) cell.setAttribute("data-level", String(cellLevel));
  if(wifi) wifi.setAttribute("data-level", String(wifiLevel));
}

function initSignals(){
  // Try Network Information API (very limited); map effectiveType to levels
  try{
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if(c){
      const map = { "slow-2g":1, "2g":1, "3g":2, "4g":3, "5g":4 };
      const lvl = map[(c.effectiveType||"").toLowerCase()] ?? 3;
      // If saveData enabled, treat as weaker wifi
      const wifi = c.saveData ? Math.max(1, lvl-1) : lvl;
      setSignals(lvl, wifi>=4?3: (wifi>=3?3:(wifi>=2?2:1)));
      c.addEventListener("change", ()=>initSignals());
      return;
    }
  }catch(e){}
  // Dummy signal wobble
  let cell=4, wifi=3;
  setSignals(cell,wifi);
  setInterval(()=>{
    cell = Math.max(1, Math.min(4, cell + (Math.random()<0.5?-1:1)));
    wifi = Math.max(1, Math.min(3, wifi + (Math.random()<0.5?-1:1)));
    setSignals(cell,wifi);
  }, 4000);
}

// v2.9.2: disable service worker to avoid caching glitches while iterating
(async ()=>{
  try{
    if('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }

function updateCapsuleSize(){
  const cap=document.getElementById('capsule');
  if(!cap) return;
  const mid=document.getElementById('capMiddle');
  const sheet=document.getElementById('menuSheet');
  const expanded = (mid && !mid.classList.contains('hidden')) || (sheet && !sheet.classList.contains('hidden'));
  cap.classList.toggle('is-expanded', expanded);
}

    if('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('fibreos-clean-')).map(k=>caches.delete(k)));
    }
  }catch(e){}
})();

const $=(q,el=document)=>el.querySelector(q);
const $$=(q,el=document)=>Array.from(el.querySelectorAll(q));
const SCREENS=["home","music","browser","lock","aod"];
let active="home";
let isUnlocked=false;
let lowPowerMode=false;

function show(screen){
  active=screen;
  closeSheet('notifSheet'); closeSheet('controlSheet');
  SCREENS.forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.classList.toggle("is-active", id===screen);
  });

  // Capsule search placeholder + now playing slot
  const input=document.getElementById("capSearchInput");
  const capMid=document.getElementById("capMiddle");
  if(input){
    input.placeholder = (screen==="music") ? "Search Music" : (screen==="browser" ? "Search / URL" : "Search Everything");
  }
  if(capMid){
    capMid.classList.toggle("hidden", screen!=="music");
  updateCapsuleSize();
  }

  // Menu sheet should be used as app page tabs (only meaningful in Music)
  const sheet=document.getElementById("menuSheet");
  if(sheet){
    sheet.classList.toggle("hidden", true);
  updateCapsuleSize();
  }
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

async }

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


function renderNowPlayingCapsule(){
  const mid=document.getElementById("capMiddle");
  if(!mid) return;
  const covers=window.__COVERS__||[];
  const art = covers.length ? covers[0] : "";
  mid.innerHTML = `
    <div class="npArt" style="background-image:url('${art}')"></div>
    <div class="npText">
      <div class="npTitle">Last Christmas</div>
      <div class="npArtist">Wham!</div>
    </div>
    <div class="npBtns">
      <button class="npBtn" type="button">⏮</button>
      <button class="npBtn npPlay" type="button">⏸</button>
      <button class="npBtn" type="button">⏭</button>
    </div>
  `;
}
const DEFAULT_PINS=["1234","0000"];
let pinEntry="";
function updatePinDots(){
  const dots=$$("#pinDots .dot");
  dots.forEach((d,i)=>d.classList.toggle("filled", i<pinEntry.length));
}
function setPinMsg(msg){ $("#pinMsg").textContent = msg||""; }
function resetPin(){ pinEntry=""; updatePinDots(); setPinMsg(""); }

function checkPin(){
  if(DEFAULT_PINS.includes(pinEntry)){
    setPinMsg("Unlocked");
    isUnlocked=true;
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

$("#menuBtn").addEventListener("click", ()=>{ if(active!=="music") return; $("#menuSheet").classList.toggle("hidden"); updateCapsuleSize(); });
$$(".appIcon").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const page=btn.getAttribute("data-page");
    $("#menuSheet").classList.add("hidden");
    // For now: just visually indicate selection
    $$(".appIcon").forEach(b=>b.classList.toggle("isSel", b===btn));
    const sub=document.querySelector(".musicSub");
    if(sub && active==="music") sub.textContent = page==="home" ? "Home • Music • Podcasts" : (page==="foryou" ? "For You • Music • Podcasts" : (page==="podcasts" ? "Podcasts • For You • Music" : "Music • For You • Podcasts"));
  });
});
document.querySelector(".capSearch").addEventListener("click", ()=>{ const i=document.getElementById("capSearchInput"); if(i) i.focus(); });
  else $("#capSearchLabel").animate([{opacity:1},{opacity:.55},{opacity:1}],{duration:520});
});
$("#aod").addEventListener("click", ()=>{ resetPin(); show("lock"); });

renderPinPad();
fillAgenda();
updateDate();
renderMusicGrid();
renderNowPlayingCapsule();

const chats = {
  lia: {title:"Lia", sub:"WhatsApp", msgs:[["them","Do you want anything from the shop?"],["me","Yeah — milk and burritos please 😄"],["them","Deal. Anything else?"]]},
  mum: {title:"Mum", sub:"RCS", msgs:[["them","Are you free Sunday?"],["me","Should be! What time?"],["them","Afternoon?"]]},
  vp: {title:"VP Trade Team", sub:"Slack", msgs:[["them","New build is on staging."],["me","Nice, I’ll run regression."],["them","Cheers!"]]},
};
function openChat(id){
  const c=chats[id]; if(!c) return;
  document.getElementById('chatTitle').textContent=c.title;
  document.getElementById('chatSub').textContent=c.sub;
  const thread=document.getElementById('chatThread');
  thread.innerHTML = c.msgs.map(([who,txt])=>`<div class="bubble ${who}">${txt}</div>`).join('');
  show('chat');
}
document.querySelectorAll('.chatRow').forEach(r=>{
  r.addEventListener('click', ()=>openChat(r.getAttribute('data-chat')));
});
document.getElementById('chatSend').addEventListener('click', ()=>{
  const i=document.getElementById('chatInput');
  if(!i.value.trim()) return;
  const thread=document.getElementById('chatThread');
  thread.insertAdjacentHTML('beforeend', `<div class="bubble me">${i.value}</div>`);
  i.value='';
  thread.scrollTop = thread.scrollHeight;
});

tickTime();
setInterval(tickTime, 15000);
updateWeather();
setInterval(updateWeather, 600000);

function openSheet(id){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.remove('hidden');
}
function closeSheet(id){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.add('hidden');
}
document.querySelectorAll('.sheetClose').forEach(b=>{
  b.addEventListener('click', ()=>closeSheet(b.getAttribute('data-close')));
});

function populateSheets(){
  const notif=document.getElementById('notifBody');
  const ctrl=document.getElementById('controlBody');
  if(notif){
    notif.innerHTML = isUnlocked ? `
      <div class="sheetCard"><b>DPD</b><div>Your parcel arrives tomorrow 09:00–10:00</div></div>
      <div class="sheetCard"><b>Lia</b><div>Do you want anything from the shop?</div></div>
      <div class="sheetCard"><b>VP Trade Team</b><div>New build is on staging.</div></div>
    ` : `
      <div class="sheetCard redacted"><b>Notifications</b><div>Content hidden</div></div>
      <div class="sheetCard redacted"><b>Messages</b><div>Content hidden</div></div>
    `;
  }
  if(ctrl){
    ctrl.innerHTML = isUnlocked ? `
      <div class="sheetCard"><b>Wi‑Fi</b><div>On</div></div>
      <div class="sheetCard"><b>Bluetooth</b><div>On</div></div>
      <div class="sheetCard"><b>Brightness</b><div>—</div></div>
      <div class="sheetCard"><b>Volume</b><div>—</div></div>
<div class="sheetCard"><b>Low Power Mode</b><div><button id="lpmBtn" style="margin-top:8px;height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.10);background:#0b0b10;font-weight:950">Toggle</button></div></div>
    ` : `
      <div class="sheetCard redacted"><b>Controls</b><div>Unlock to change</div></div>
    `;
  }
}
document.getElementById('capTimeBtn').addEventListener('click', ()=>{
  populateSheets(); openSheet('notifSheet');
});
document.getElementById('capStatusBtn').addEventListener('click', ()=>{
  populateSheets(); openSheet('controlSheet');
});

initBattery();
initSignals();

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
document.querySelectorAll('.dockApp').forEach(b=>{
  b.addEventListener('click', ()=>{
    const go=b.getAttribute('data-go');
    closePanels();
    if(go==='lock'){ isUnlocked=false; resetPin(); show('aod'); return; }
    show(go);
  });
});

document.querySelectorAll('.drawerApp').forEach(b=>{
  b.addEventListener('click', ()=>{
    const go=b.getAttribute('data-go');
    closePanels();
    if(go==='lock'){ isUnlocked=false; resetPin(); show('aod'); return; }
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


// --- Home pager (Widgets <-> Home <-> Connect) ---
let pagerIndex=1; // 0 widgets, 1 home, 2 connect
let dragging=false;
let dragStartX=0;
let dragBase= -100; // percent

function setPager(idx, animate=true){
  pagerIndex=Math.max(0,Math.min(2,idx));
  const pager=document.getElementById('homePager');
  if(!pager) return;
  pager.style.transition = animate ? 'transform .22s ease' : 'none';
  pager.style.transform = `translateX(${-(pagerIndex*100)}%)`;
  // capsule colour changes per page
  const cap=document.getElementById('capsule');
  if(cap){
    cap.classList.toggle('cap-widgets', pagerIndex===0);
    cap.classList.toggle('cap-home', pagerIndex===1);
    cap.classList.toggle('cap-connect', pagerIndex===2);
  }
}
setPager(1, true);

const contentEl=document.getElementById('content');
contentEl.addEventListener('touchstart',(e)=>{
  if(active!=='home') return;
  const t=e.touches[0];
  dragging=true;
  dragStartX=t.clientX;
  dragBase=-(pagerIndex*100);
},{passive:true});

contentEl.addEventListener('touchmove',(e)=>{
  if(active!=='home' || !dragging) return;
  const t=e.touches[0];
  const dx=t.clientX-dragStartX;
  const w=Math.max(320, window.innerWidth);
  const deltaPct=(dx/w)*100;
  let next=dragBase + deltaPct;
  // rubber band at edges
  if(pagerIndex===0 && next>-0){ next = -0 + (next+0)*0.25; }
  if(pagerIndex===2 && next<-200){ next = -200 + (next+200)*0.25; }
  const pager=document.getElementById('homePager');
  if(pager){
    pager.style.transition='none';
    pager.style.transform=`translateX(${next}%)`;
  }
},{passive:true});

contentEl.addEventListener('touchend',(e)=>{
  if(active!=='home' || !dragging) return;
  dragging=false;
  const t=e.changedTouches[0];
  const dx=t.clientX-dragStartX;
  const w=Math.max(320, window.innerWidth);
  const threshold=w*0.18;
  if(dx<-threshold) setPager(pagerIndex+1, true);
  else if(dx>threshold) setPager(pagerIndex-1, true);
  else setPager(pagerIndex, true);
},{passive:true});
  swipeStart=null;
  if(adx<56 || adx<ady) return;
  if(dx<0) setPager(pagerIndex+1); // swipe left
  else setPager(pagerIndex-1);     // swipe right
},{passive:true});

show("home");


const oc=document.getElementById('openChatGPT'); if(oc){ oc.addEventListener('click', ()=>{ window.open('https://chat.openai.com', '_blank'); }); }
