
const $ = (id)=>document.getElementById(id);
const SCREENS = ["aod","lock","home","drawer","widgets","connect","overview","music","search"];
let state = {
  screen:"home",
  locked:false, // set true to start on lock
  spaces:[
    {name:"Personal", recents:["Music","Browser","Notes","Photos"]},
    {name:"Work", recents:["Connect","Calendar","Mail","Files"]},
    {name:"Play", recents:["Games","Music","Camera"]}
  ],
  spaceIndex:0,
  weather:{
    city:"Huddersfield",
    desc:"Loading…",
    now:"—",
    hi:"—",
    lo:"—"
  },
  music:{
    playing:true,
    track:{t:"Last Christmas", a:"Wham!"},
    tab:"Home",
    query:""
  }
};

function setScreen(id){
  SCREENS.forEach(s=>$(s).classList.toggle("hidden", s!==id));
  state.screen=id;
  // aria
  SCREENS.forEach(s=>$(s).setAttribute("aria-hidden", s===id ? "false" : "true"));
}

function fmt2(n){ return String(n).padStart(2,"0"); }

// GMT time/date
function tickGMT(){
  const d = new Date();
  const hh = fmt2(d.getUTCHours());
  const mm = fmt2(d.getUTCMinutes());
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const monNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dShort = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const mShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const dow = dayNames[d.getUTCDay()];
  const mon = monNames[d.getUTCMonth()];
  const date = d.getUTCDate();
  const aodDate = `${dShort[d.getUTCDay()]} ${date} ${mShort[d.getUTCMonth()]}`;

  document.querySelectorAll("[data-sys-time]").forEach(el=>el.textContent = `${hh}:${mm}`);
  document.querySelectorAll("[data-home-hh]").forEach(el=>el.textContent = hh);
  document.querySelectorAll("[data-home-mm]").forEach(el=>el.textContent = mm);
  document.querySelectorAll("[data-lock-hh]").forEach(el=>el.textContent = hh);
  document.querySelectorAll("[data-lock-mm]").forEach(el=>el.textContent = mm);
  document.querySelectorAll("[data-home-day]").forEach(el=>el.textContent = dow);
  document.querySelectorAll("[data-home-month]").forEach(el=>el.textContent = mon);
  document.querySelectorAll("[data-home-date]").forEach(el=>el.textContent = date);
  document.querySelectorAll("[data-lock-day]").forEach(el=>el.textContent = dow);
  document.querySelectorAll("[data-lock-month]").forEach(el=>el.textContent = mon);
  document.querySelectorAll("[data-lock-date]").forEach(el=>el.textContent = date);
  document.querySelectorAll("[data-aod-time]").forEach(el=>el.textContent = `${hh}:${mm}`);
  document.querySelectorAll("[data-aod-date]").forEach(el=>el.textContent = aodDate);

  // agenda title "Monday 22nd December"
  const suffix = (n)=>{
    if (n%100>=11 && n%100<=13) return "th";
    return (n%10===1)?"st":(n%10===2)?"nd":(n%10===3)?"rd":"th";
  };
  const agendaTitle = `${dow} ${date}${suffix(date)} ${mon}`;
  const at = document.querySelector("[data-agenda-title]");
  if(at) at.textContent = agendaTitle;
}
tickGMT();
setInterval(tickGMT, 10000);

function toast(msg){
  // minimal: use console for now
  console.log("[FibreOS]", msg);
}

// Dummy agenda
function renderAgenda(){
  const el=$("agendaList");
  el.innerHTML = "";
  const items = [
    {t:"No events today", dim:true},
    {t:"Tomorrow, 09:00 - 10:00: DPD Delivery Expected"},
    {t:"Friday, 09:00 - 17:30: Lia @ Work"},
    {t:"Saturday, 09:00 - 14:30: Lia @ Work"},
  ];
  items.forEach(i=>{
    const r=document.createElement("div");
    r.className="row"+(i.dim?" dim":"");
    r.textContent=i.t;
    el.appendChild(r);
  });
}
renderAgenda();

// Skewmorphic-modern icon generator (CSS-only block)
function iconStyle(seed){
  // deterministic-ish palette
  const palettes = [
    ["#ff4aa0","#ff5f00"],
    ["#ffd200","#ff9b00"],
    ["#b9e3ff","#6f88ff"],
    ["#9b9b9b","#585858"],
    ["#48f5d2","#13b8a8"],
    ["#cf7a00","#ffb03a"],
    ["#1aa3d6","#106bff"],
    ["#b0125a","#5e2ea6"],
    ["#49a84d","#a7ff5a"]
  ];
  const p = palettes[seed % palettes.length];
  return `background:linear-gradient(180deg, ${p[0]}, ${p[1]});`;
}

const APPS = [
  {id:"music", name:"Music", glyph:"♪", open:"music"},
  {id:"connect", name:"Connect", glyph:"✉️", open:"connect"},
  {id:"search", name:"Search", glyph:"🔍", open:"search"},
  {id:"widgets", name:"Widgets", glyph:"▦", open:"widgets"},
  {id:"settings", name:"Settings", glyph:"⚙️", open:null},
  {id:"photos", name:"Photos", glyph:"🖼️", open:null},
  {id:"camera", name:"Camera", glyph:"📷", open:null},
  {id:"files", name:"Files", glyph:"📁", open:null},
  {id:"notes", name:"Notes", glyph:"✎", open:null},
  {id:"calendar", name:"Calendar", glyph:"📅", open:null},
  {id:"browser", name:"Browser", glyph:"🌐", open:null},
  {id:"mail", name:"Mail", glyph:"✉", open:null},
  {id:"games", name:"Games", glyph:"🎮", open:null},
];

function makeSkewIcon(seed, glyph){
  const wrap=document.createElement("div");
  wrap.className="dGlyph iconSkew";
  wrap.setAttribute("style", iconStyle(seed));
  wrap.textContent=glyph;
  return wrap;
}

function renderHomeDock(){
  const dock=$("homeDock");
  dock.innerHTML="";
  const pinned = ["music","connect","search","widgets"];
  pinned.forEach((id, i)=>{
    const app=APPS.find(a=>a.id===id);
    const btn=document.createElement("button");
    btn.className="dIcon";
    btn.type="button";
    btn.appendChild(makeSkewIcon(i, app.glyph));
    const lab=document.createElement("div"); lab.className="dLabel"; lab.textContent=app.name;
    btn.appendChild(lab);
    btn.onclick=()=> app.open ? setScreen(app.open) : openSystemMenu();
    dock.appendChild(btn);
  });
}
renderHomeDock();

function renderDrawer(){
  $("drawerPinned").innerHTML="";
  $("drawerGrid").innerHTML="";
  const pinned = ["music","connect","search","widgets"];
  pinned.forEach((id,i)=>{
    const a=APPS.find(x=>x.id===id);
    $("drawerPinned").appendChild(makeAppBtn(a, i));
  });
  APPS.forEach((a,i)=>{
    $("drawerGrid").appendChild(makeAppBtn(a, i+10));
  });
}
function makeAppBtn(app, seed){
  const b=document.createElement("button");
  b.className="appBtn";
  b.type="button";
  const ic=document.createElement("div");
  ic.className="ic iconSkew";
  ic.setAttribute("style", iconStyle(seed));
  ic.textContent=app.glyph;
  const nm=document.createElement("div");
  nm.className="nm";
  nm.textContent=app.name;
  b.appendChild(ic); b.appendChild(nm);
  b.onclick=()=> app.open ? setScreen(app.open) : openSystemMenu();
  return b;
}
renderDrawer();

function renderWidgets(){
  const list=$("widgetList"); list.innerHTML="";
  const widgets=[
    {t:"Now Playing", s:"Last Christmas • Wham!", tag:"Media"},
    {t:"Calendar", s:"Tomorrow: DPD Delivery Expected", tag:"Agenda"},
    {t:"Weather", s:`${state.weather.desc} • ${state.weather.now}`, tag:"Weather"},
    {t:"Files", s:"Recent: fibreos_pwa_prototype.zip", tag:"Storage"},
    {t:"Smart Home", s:"2 lights • 1 speaker", tag:"Home"},
  ];
  widgets.forEach((w,i)=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML = `<div class="cardTitle">${w.t}</div><div class="cardSub">${w.s}</div>
      <div class="pillRow"><div class="pillTag">${w.tag}</div><div class="badge">+</div></div>`;
    c.onclick=()=>toast("Add widget: "+w.t);
    list.appendChild(c);
  });
}
renderWidgets();

function renderConnect(){
  const list=$("connectList"); list.innerHTML="";
  const msgs=[
    {p:"Lia", svc:"WhatsApp", t:"Do you want anything from the shop?", n:2},
    {p:"Mum", svc:"RCS", t:"Are you free Sunday?", n:0},
    {p:"VP Trade Team", svc:"Slack", t:"New build is on staging.", n:5},
    {p:"Beans ⭐", svc:"Telepathy", t:"Feed me. Immediately.", n:99},
  ];
  // People list (unified)
  msgs.forEach((m,i)=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML = `<div class="cardTitle">${m.p} • ${m.svc}</div>
      <div class="cardSub">${m.t}</div>
      <div class="pillRow"><div class="pillTag">Open thread</div><div class="badge">${m.n}</div></div>`;
    c.onclick=()=>toast("Open thread: "+m.p);
    list.appendChild(c);
  });

  // Blocks like your design (as a scrolling list of widgets)
  const blocks=[
    {t:"Contacts", s:"Favourites • Recent"},
    {t:"Messages", s:"Unified inbox"},
    {t:"Calls", s:"Missed: 1"},
    {t:"Upcoming events", s:"Tomorrow: Delivery"},
    {t:"Shared files", s:"3 new"},
  ];
  blocks.forEach(b=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML = `<div class="cardTitle">${b.t}</div><div class="cardSub">${b.s}</div>`;
    c.onclick=()=>toast("Open block: "+b.t);
    list.appendChild(c);
  });
}
renderConnect();

function renderOverview(){
  const strip=$("spacesStrip");
  strip.innerHTML="";
  state.spaces.forEach((s,i)=>{
    const p=document.createElement("button");
    p.className="spacePill"+(i===state.spaceIndex?" active":"");
    p.type="button";
    p.textContent=s.name;
    p.onclick=()=>{ state.spaceIndex=i; renderOverview(); };
    strip.appendChild(p);
  });

  const cards=$("recentCards");
  cards.innerHTML="";
  state.spaces[state.spaceIndex].recents.forEach((r,i)=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML = `<div class="cardTitle">${r}</div><div class="cardSub">Tap to open • Close removes</div>
      <div class="pillRow"><button class="pillTag" data-open="${r}">Open</button><button class="pillTag" data-close="${r}">Close</button></div>`;
    c.onclick=(e)=>{
      const o=e.target.closest("[data-open]");
      const cl=e.target.closest("[data-close]");
      if(o){ openAppByName(o.dataset.open); e.stopPropagation(); }
      if(cl){
        state.spaces[state.spaceIndex].recents = state.spaces[state.spaceIndex].recents.filter(x=>x!==cl.dataset.close);
        renderOverview(); e.stopPropagation();
      }
    };
    cards.appendChild(c);
  });
}
renderOverview();

function openAppByName(name){
  const app = APPS.find(a=>a.name.toLowerCase()===name.toLowerCase());
  if(app && app.open) setScreen(app.open);
  else setScreen("home");
}

// Music app
const MUSIC_TABS=["Home","For You","Music","Podcasts","Radio","Library","Browse"];
function renderMusicTabs(){
  const tabs=$("musicTabs"); tabs.innerHTML="";
  MUSIC_TABS.forEach(t=>{
    const b=document.createElement("button");
    b.className="tab"+(t===state.music.tab?" active":"");
    b.type="button";
    b.textContent=t;
    b.onclick=()=>{
      state.music.tab=t;
      renderMusicTabs();
      renderMusicGrid();
    };
    tabs.appendChild(b);
  });
}
function renderMusicGrid(){
  const grid=$("musicGrid"); grid.innerHTML="";
  const palettes={
    "Home":["#ffe548","#5e2ea6","#b0125a","#f06452","#49a84d","#53c6ff","#3e51b5","#ff9dbf"],
    "For You":["#ff9dbf","#ffe548","#53c6ff","#49a84d","#f06452","#5e2ea6","#3e51b5","#b0125a"],
    "Music":["#53c6ff","#3e51b5","#49a84d","#ffe548","#f06452","#ff9dbf","#5e2ea6","#b0125a"],
    "Podcasts":["#5e2ea6","#3e51b5","#53c6ff","#ffe548","#ff9dbf","#b0125a","#f06452","#49a84d"],
    "Radio":["#49a84d","#ffe548","#f06452","#53c6ff","#3e51b5","#5e2ea6","#b0125a","#ff9dbf"],
    "Library":["#b0125a","#ff9dbf","#f06452","#ffe548","#49a84d","#53c6ff","#3e51b5","#5e2ea6"],
    "Browse":["#f06452","#49a84d","#53c6ff","#3e51b5","#5e2ea6","#b0125a","#ff9dbf","#ffe548"],
  };
  const colors=palettes[state.music.tab]||palettes["Home"];
  for(let i=0;i<8;i++){
    const d=document.createElement("div");
    d.className="mSq";
    d.style.background = colors[i%colors.length];
    grid.appendChild(d);
  }
}
function setTrack(t,a){
  $("npTitle").textContent=t;
  $("npArtist").textContent=a;
  $("pTrack").textContent=t;
  $("pArtist").textContent=a;
}
function setPlaying(on){
  state.music.playing=on;
  $("playBtn").textContent = on ? "⏸" : "▶";
  $("pPlay").textContent = on ? "⏸" : "▶";
}
function openPlayer(){ $("player").classList.remove("hidden"); }
function closePlayer(){ $("player").classList.add("hidden"); }
function openMusicSearch(){
  $("musicSearch").classList.remove("hidden");
  state.music.query="";
  $("musicQuery").textContent="";
  $("musicSearchPh").classList.remove("hidden");
  renderMusicResults("");
}
function closeMusicSearch(){ $("musicSearch").classList.add("hidden"); }

function renderQueue(){
  const q=$("queue");
  q.innerHTML = `<div class="qHead">Up next</div>`;
  [
    ["Everything She Wants","Wham!"],
    ["Careless Whisper","George Michael"],
    ["Wake Me Up Before You Go‑Go","Wham!"],
  ].forEach(([t,a])=>{
    const row=document.createElement("div");
    row.className="qItem";
    row.innerHTML=`<span>${t}</span><span class="muted">${a}</span>`;
    q.appendChild(row);
  });
}

function renderMusicResults(q){
  const box=$("musicResults"); box.innerHTML="";
  const tracks=[
    ["Last Christmas","Wham!"],
    ["Everything She Wants","Wham!"],
    ["Careless Whisper","George Michael"],
    ["Wake Me Up Before You Go‑Go","Wham!"],
    ["Blue (Da Ba Dee)","Eiffel 65"],
    ["Mr. Brightside","The Killers"],
  ];
  const qq=(q||"").trim().toLowerCase();
  const hits=tracks.filter(([t,a])=>!qq||t.toLowerCase().includes(qq)||a.toLowerCase().includes(qq)).slice(0,8);
  if(hits.length===0){
    const r=document.createElement("div");
    r.className="res";
    r.innerHTML=`<div class="t">No results</div><div class="s">Try another search</div>`;
    box.appendChild(r);
    return;
  }
  hits.forEach(([t,a])=>{
    const r=document.createElement("div"); r.className="res";
    r.innerHTML=`<div class="t">${t}</div><div class="s">${a}</div>`;
    r.onclick=()=>{ setTrack(t,a); setPlaying(true); closeMusicSearch(); };
    box.appendChild(r);
  });
}

function typeKey(k){
  if(k==="back") state.music.query = state.music.query.slice(0,-1);
  else if(k==="space") state.music.query += " ";
  else if(k==="search") {/*live*/}
  else if(k==="sym") toast("Symbols (mock)");
  else state.music.query += k;
  $("musicQuery").textContent = state.music.query;
  $("musicSearchPh").classList.toggle("hidden", state.music.query.length>0);
  renderMusicResults(state.music.query);
}
function renderKeyboard(){
  const row1="1234567890".split("");
  const row2="qwertyuiop".split("");
  const row3="asdfghjkl".split("");
  const fill=(rowId, keys)=>{
    const row=document.querySelector(`.kbdRow[data-row="${rowId}"]`);
    row.innerHTML="";
    keys.forEach(k=>{
      const b=document.createElement("button");
      b.className="kKey";
      b.type="button";
      b.textContent = (k==="back") ? "⌫" : k;
      b.onclick=()=>typeKey(k);
      row.appendChild(b);
    });
  };
  fill("1", row1);
  fill("2", row2);
  fill("3", row3.concat(["back"]));
  document.querySelectorAll(".kbdBottom .kKey").forEach(b=>{
    b.onclick=()=>typeKey(b.dataset.key);
  });
}

function wireMusic(){
  renderMusicTabs();
  renderMusicGrid();
  renderQueue();
  $("musicMenuBtn").onclick=()=>$("musicNav").classList.remove("hidden");
  $("musicCloseNav").onclick=()=>$("musicNav").classList.add("hidden");
  $("musicSearchBtn").onclick=openMusicSearch;
  $("musicSearchBtn2").onclick=openMusicSearch;
  $("musicBackSearch").onclick=closeMusicSearch;
  $("nowPlaying").onclick=(e)=>{
    if(e.target.closest(".npBtn")) return;
    openPlayer();
  };
  $("playerClose").onclick=closePlayer;

  $("prevBtn").onclick=()=>toast("Prev");
  $("nextBtn").onclick=()=>toast("Next");
  $("playBtn").onclick=()=>setPlaying(!state.music.playing);
  $("pPrev").onclick=()=>toast("Prev");
  $("pNext").onclick=()=>toast("Next");
  $("pPlay").onclick=()=>setPlaying(!state.music.playing);

  renderKeyboard();
}
wireMusic();
setPlaying(true);

// Global Search
function wireSearch(){
  $("closeSearch").onclick=()=>setScreen("home");
  $("scopeBtn").onclick=()=>toast("Scope toggle (mock)");
  const input=$("globalInput");
  input.addEventListener("input", ()=>renderGlobalResults(input.value));
  renderGlobalResults("");
}
function renderGlobalResults(q){
  const box=$("globalResults");
  box.innerHTML="";
  const query=(q||"").trim().toLowerCase();
  const apps = APPS.filter(a=>!query || a.name.toLowerCase().includes(query)).slice(0,8);
  const mk=(title,sub)=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${title}</div><div class="cardSub">${sub}</div>`;
    return c;
  };
  box.appendChild(mk("Apps", "Top results"));
  apps.forEach(a=>{
    const c=mk(a.name, "Tap to open");
    c.onclick=()=> a.open ? setScreen(a.open) : openSystemMenu();
    box.appendChild(c);
  });
  box.appendChild(mk("Web", query?`Search the web for “${q}”`:"Type to search"));
}
wireSearch();

// Notifs + QS dummy
function renderNotifs(){
  const list=$("notifList"); list.innerHTML="";
  const items=[
    ["Message", "Content hidden until unlock"],
    ["Calendar", "Delivery expected tomorrow 09:00"],
    ["Weather", `${state.weather.desc} • ${state.weather.now}`]
  ];
  items.forEach(([t,s])=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${t}</div><div class="cardSub">${s}</div>`;
    list.appendChild(c);
  });
}
function renderQS(){
  const list=$("qsList"); list.innerHTML="";
  const toggles=[
    ["Wi‑Fi","On"],
    ["Bluetooth","Off"],
    ["Do Not Disturb","Off"],
    ["Airplane mode","Off"],
  ];
  toggles.forEach(([t,v])=>{
    const r=document.createElement("div"); r.className="card";
    r.innerHTML=`<div class="cardTitle">${t}</div><div class="cardSub">${v}</div>`;
    list.appendChild(r);
  });
  const br=document.createElement("div"); br.className="card";
  br.innerHTML=`<div class="cardTitle">Brightness</div><div class="cardSub"><input type="range" min="0" max="100" value="70" style="width:100%"></div>`;
  list.appendChild(br);
}
renderNotifs(); renderQS();

// System menu (your screenshot-style)
function openSystemMenu(){
  const m=$("sysMenu");
  m.classList.remove("hidden");
  // build icons row each time
  const row=$("sysIconRow");
  row.innerHTML="";
  const items=[
    APPS.find(a=>a.id==="music"),
    APPS.find(a=>a.id==="connect"),
    APPS.find(a=>a.id==="search"),
    APPS.find(a=>a.id==="widgets"),
    APPS.find(a=>a.id==="settings"),
  ];
  items.forEach((a,i)=>{
    const it=document.createElement("button");
    it.className="sysApp";
    it.type="button";
    it.innerHTML = `<div class="icWrap">${makeEmojiAppGlyph(a.glyph,i)}</div><div class="label">${a.name}</div>`;
    it.onclick=()=>{ closeSystemMenu(); a.open ? setScreen(a.open) : toast("Settings (mock)"); };
    row.appendChild(it);
  });
}
function makeEmojiAppGlyph(glyph, seed){
  // return a simple colored icon block with glyph
  const colors=[
    ["#ff4aa0","#ff5f00"],
    ["#1aa3d6","#106bff"],
    ["#ffd200","#ff9b00"],
    ["#48f5d2","#13b8a8"],
    ["#9b9b9b","#585858"],
  ];
  const p=colors[seed%colors.length];
  return `<div class="iconSkew" style="width:44px;height:44px;border-radius:16px;display:grid;place-items:center;${`background:linear-gradient(180deg, ${p[0]}, ${p[1]});`}">${glyph}</div>`;
}
function closeSystemMenu(){ $("sysMenu").classList.add("hidden"); }
$("sysClose").onclick=closeSystemMenu;
$("sysMenu").addEventListener("click",(e)=>{ if(e.target.id==="sysMenu") closeSystemMenu(); });

// Buttons
$("btnConnect").onclick=()=>setScreen("connect");
$("btnSearch").onclick=()=>setScreen("search");
$("homeSearch").onclick=()=>setScreen("search");

// Weather: Huddersfield via Open-Meteo (geocode + forecast)
async function loadWeatherHuddersfield(){
  try{
    const geo = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=Huddersfield&count=1&language=en&format=json");
    const gj = await geo.json();
    const hit = gj && gj.results && gj.results[0];
    if(!hit) throw new Error("No geocode result");
    const lat=hit.latitude, lon=hit.longitude;

    // current + daily hi/lo in Celsius
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=UTC`;
    const w = await fetch(url);
    const wj = await w.json();

    const now = wj.current?.temperature_2m;
    const code = wj.current?.weather_code;
    const hi = wj.daily?.temperature_2m_max?.[0];
    const lo = wj.daily?.temperature_2m_min?.[0];

    const desc = codeToText(code);
    state.weather.desc = desc;
    state.weather.now = (now!=null)?`${Math.round(now)}°`:"—";
    state.weather.hi = (hi!=null)?`${Math.round(hi)}°`:"—";
    state.weather.lo = (lo!=null)?`${Math.round(lo)}°`:"—";

    applyWeather();
    renderWidgets();
    renderNotifs();
  }catch(e){
    state.weather.desc="Cloudy";
    state.weather.now="7°";
    state.weather.hi="9°";
    state.weather.lo="7°";
    applyWeather();
  }
}
function codeToText(code){
  // Open-Meteo weather codes (simplified)
  const map = {
    0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Overcast",
    45:"Fog",48:"Rime fog",
    51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",
    61:"Light rain",63:"Rain",65:"Heavy rain",
    71:"Light snow",73:"Snow",75:"Heavy snow",
    80:"Rain showers",81:"Showers",82:"Heavy showers",
    95:"Thunderstorm"
  };
  return map[code] || "Cloudy";
}
function applyWeather(){
  const set = (sel, val)=>document.querySelectorAll(sel).forEach(el=>el.textContent=val);
  set("[data-home-desc]", state.weather.desc);
  set("[data-home-now]", state.weather.now);
  set("[data-home-hi]", state.weather.hi);
  set("[data-home-lo]", state.weather.lo);

  set("[data-lock-desc]", state.weather.desc);
  set("[data-lock-now]", state.weather.now);
  set("[data-lock-hi]", state.weather.hi);
  set("[data-lock-lo]", state.weather.lo);

  set("[data-aod-desc]", state.weather.desc);
  set("[data-aod-temp]", state.weather.now);
}
loadWeatherHuddersfield();

// Gestures (stable)
let sx=0, sy=0, t0=0;
document.addEventListener("touchstart",(e)=>{
  const p=e.touches[0];
  sx=p.clientX; sy=p.clientY; t0=performance.now();
},{passive:true});

function closeShades(){
  $("notifs").classList.add("hidden");
  $("qs").classList.add("hidden");
}
function openNotifs(){ $("qs").classList.add("hidden"); $("notifs").classList.remove("hidden"); }
function openQS(){ $("notifs").classList.add("hidden"); $("qs").classList.remove("hidden"); }

document.addEventListener("touchend",(e)=>{
  const p=e.changedTouches[0];
  const dx=p.clientX-sx, dy=p.clientY-sy, dt=performance.now()-t0;
  if(Math.max(Math.abs(dx),Math.abs(dy))<42 || dt>700) return;

  const isHoriz = Math.abs(dx) > Math.abs(dy);
  const dir = isHoriz ? (dx>0?"right":"left") : (dy>0?"down":"up");

  // Shades / overlays close by down swipe
  if(!$("notifs").classList.contains("hidden") || !$("qs").classList.contains("hidden")){
    if(dir==="down") closeShades();
    return;
  }
  if(!$("musicSearch").classList.contains("hidden")){
    if(dir==="down") closeMusicSearch();
    return;
  }
  if(!$("player").classList.contains("hidden")){
    if(dir==="down") closePlayer();
    return;
  }
  if(!$("sysMenu").classList.contains("hidden")){
    if(dir==="down" || dir==="up") closeSystemMenu();
    return;
  }

  // Lock/AOD gestures
  if(state.screen==="aod"){
    if(dir==="up" || dir==="down") setScreen("lock");
    return;
  }
  if(state.screen==="lock"){
    // bottom corners (swipe up from bottom 120px)
    const fromBottom = sy > (window.innerHeight - 140);
    if(fromBottom && sx < 140 && dir==="up"){ openNotifs(); return; }
    if(fromBottom && sx > (window.innerWidth - 140) && dir==="up"){ openQS(); return; }
    if(dir==="up"){ setScreen("home"); return; }
    if(dir==="down"){ setScreen("aod"); return; }
    return;
  }

  // Main nav gestures (from your map)
  if(state.screen==="home"){
    if(dir==="up") setScreen("drawer");
    if(dir==="down") setScreen("overview");
    if(dir==="left") setScreen("connect");
    if(dir==="right") setScreen("widgets");
    return;
  }
  if(state.screen==="drawer"){
    if(dir==="down") setScreen("home");
    return;
  }
  if(state.screen==="widgets"){
    if(dir==="right") setScreen("home");
    return;
  }
  if(state.screen==="connect"){
    if(dir==="left") setScreen("home");
    return;
  }
  if(state.screen==="overview"){
    if(dir==="up") setScreen("home");
    if(dir==="left"){ state.spaceIndex=(state.spaceIndex+1)%state.spaces.length; renderOverview(); }
    if(dir==="right"){ state.spaceIndex=(state.spaceIndex-1+state.spaces.length)%state.spaces.length; renderOverview(); }
    return;
  }
  if(state.screen==="music"){
    if(dir==="right") setScreen("home");
    return;
  }
  if(state.screen==="search"){
    if(dir==="down" || dir==="right") setScreen("home");
    return;
  }
},{passive:true});

// Tap to wake on AOD
$("aod").addEventListener("click", ()=>setScreen("lock"));

// Prevent pull-to-refresh on Android Chrome by blocking downward drag at top
let ptrY = null;
document.addEventListener("touchmove",(e)=>{
  if(ptrY===null) return;
  const y=e.touches[0].clientY;
  const dy=y-ptrY;
  if(ptrY < 70 && dy>0){
    e.preventDefault();
  }
},{passive:false});
document.addEventListener("touchstart",(e)=>{ ptrY=e.touches[0].clientY; },{passive:true});
document.addEventListener("touchend",()=>{ ptrY=null; },{passive:true});

// System menu: open by long-press on Home indicator area
let lp=null;
document.querySelectorAll(".homeIndicator").forEach(ind=>{
  ind.addEventListener("touchstart",(e)=>{
    if(state.screen!=="home" && state.screen!=="music") return;
    lp=setTimeout(()=>openSystemMenu(), 420);
  },{passive:true});
  ind.addEventListener("touchend",()=>clearTimeout(lp),{passive:true});
  ind.addEventListener("touchmove",()=>clearTimeout(lp),{passive:true});
});

if(state.locked) setScreen("lock");
else setScreen("home");

// Service worker
if("serviceWorker" in navigator){
  window.addEventListener("load", async ()=>{
    try{
      const reg = await navigator.serviceWorker.register("sw.js");
      if(reg.waiting) reg.waiting.postMessage({type:"SKIP_WAITING"});
    }catch(e){}
  });
}
