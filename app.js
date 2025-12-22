
const $ = (id)=>document.getElementById(id);
const screens = ["home","drawer","widgets","connect","music"];
const state = {
  surface:"home",
  apps:["Music","Browser","Messages","Camera","Photos","Settings","Files","Notes","Connect"],
  music:{
    playing:true,
    track:{title:"Last Christmas", artist:"Wham!"},
    query:"",
    tab:"home"
  }
};

function setDebug(){ const d=$("debug"); if(d) d.textContent = state.surface + (state.surface==="music" ? `:${state.music.tab}`:""); }
function show(id){
  screens.forEach(s=>$(s).classList.toggle("hidden", s!==id));
  state.surface=id;
  setDebug();
  location.hash = id; // makes refresh land on same screen
}
function toast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.remove("hidden");
  clearTimeout(toast._tm); toast._tm=setTimeout(()=>t.classList.add("hidden"), 1200);
}
function tick(){
  const d=new Date();
  const hh=String(d.getHours()).padStart(2,"0");
  const mm=String(d.getMinutes()).padStart(2,"0");
  document.querySelectorAll("[data-hh]").forEach(e=>e.textContent=hh);
  document.querySelectorAll("[data-mm]").forEach(e=>e.textContent=mm);
}
setInterval(tick, 5000); tick();

function wireHome(){
  $("openMusicTile").onclick=()=>show("music");
  $("homeSearch").onclick=()=>toast("Search Everything (mock)");
  document.querySelectorAll(".fab").forEach(b=>{
    b.onclick=()=>{
      const open=b.dataset.open;
      if(open==="connect") show("connect");
      else toast("Search (mock)");
    };
  });
}
wireHome();

function renderHomeDock(){
  const dock=$("homeDock");
  dock.innerHTML="";
  const icons=[
    {cls:"music", glyph:"♪", open:"music"},
    {cls:"home", glyph:"⌂", open:"home"},
    {cls:"photos", glyph:"🖼️"},
    {cls:"camera", glyph:"📷"},
  ];
  icons.forEach(i=>{
    const b=document.createElement("button");
    b.className="dIcon "+i.cls;
    b.type="button";
    b.textContent=i.glyph;
    b.onclick=()=>{ i.open ? show(i.open) : toast(i.glyph); };
    dock.appendChild(b);
  });
}
renderHomeDock();

function renderDrawer(){
  const pr=$("pinnedRow"); pr.innerHTML="";
  ["Music","Browser","Messages","Camera"].forEach(a=>{
    const x=document.createElement("button"); x.className="app"; x.type="button"; x.textContent=a[0];
    x.onclick=()=>{ if(a==="Music") show("music"); else toast("Open "+a); };
    pr.appendChild(x);
  });
  const ag=$("appsGrid"); ag.innerHTML="";
  state.apps.forEach(a=>{
    const x=document.createElement("button"); x.className="app"; x.type="button"; x.textContent=a[0];
    x.onclick=()=>{ if(a==="Music") show("music"); else if(a==="Connect") show("connect"); else toast("Open "+a); };
    ag.appendChild(x);
  });
}
renderDrawer();

function renderConnect(){
  const list=$("connectList"); list.innerHTML="";
  ["Messages","Calls","Contacts","Upcoming events","Shared files"].forEach(w=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${w}</div><div class="sub">Tap title for full view</div>`;
    c.onclick=()=>toast("Open "+w);
    list.appendChild(c);
  });
}
renderConnect();

function renderWidgets(){
  const list=$("widgetList"); list.innerHTML="";
  ["Now Playing","Calendar","Weather","Files","Photos","Smart Home"].forEach(w=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${w}</div><div class="sub">Tap to add to Home (mock)</div>`;
    c.onclick=()=>toast("Add widget: "+w);
    list.appendChild(c);
  });
}
renderWidgets();


function renderMusicGrid(){
  const grid=$("musicGrid"); grid.innerHTML="";
  const palettes = {
    home:["#ffe548","#5e2ea6","#b0125a","#f06452","#49a84d","#53c6ff","#3e51b5","#ff9dbf"],
    foryou:["#ff9dbf","#ffe548","#53c6ff","#49a84d","#f06452","#5e2ea6","#3e51b5","#b0125a"],
    music:["#53c6ff","#3e51b5","#49a84d","#ffe548","#f06452","#ff9dbf","#5e2ea6","#b0125a"],
    podcasts:["#5e2ea6","#3e51b5","#53c6ff","#ffe548","#ff9dbf","#b0125a","#f06452","#49a84d"],
    radio:["#49a84d","#ffe548","#f06452","#53c6ff","#3e51b5","#5e2ea6","#b0125a","#ff9dbf"],
    library:["#b0125a","#ff9dbf","#f06452","#ffe548","#49a84d","#53c6ff","#3e51b5","#5e2ea6"],
    browse:["#f06452","#49a84d","#53c6ff","#3e51b5","#5e2ea6","#b0125a","#ff9dbf","#ffe548"],
  };
  const colors = palettes[state.music.tab] || palettes.home;
  for(let i=0;i<8;i++){
    const d=document.createElement("div");
    d.className="mSq";
    d.style.background=colors[i%colors.length];
    grid.appendChild(d);
  }
}
renderMusicGrid();

function setPlaying(on){
  state.music.playing=on;
  $("playBtn").textContent = on ? "⏸" : "▶";
  $("pPlay").textContent = on ? "⏸" : "▶";
}
function openPlayer(){ $("player").classList.remove("hidden"); }
function closePlayer(){ $("player").classList.add("hidden"); }

$("nowPlaying").onclick=(e)=>{ if(e.target.closest(".npBtn")) return; openPlayer(); };
$("playerClose").onclick=closePlayer;
$("playerBackHome").onclick=()=>{ closePlayer(); $("musicNav").classList.add("hidden"); };

$("prevBtn").onclick=()=>toast("Prev");
$("nextBtn").onclick=()=>toast("Next");
$("playBtn").onclick=()=>setPlaying(!state.music.playing);
$("pPrev").onclick=()=>toast("Prev");
$("pNext").onclick=()=>toast("Next");
$("pPlay").onclick=()=>setPlaying(!state.music.playing);

$("musicMenuBtn").onclick=()=>$("musicNav").classList.remove("hidden");
$("musicCloseNav").onclick=()=>$("musicNav").classList.add("hidden");

// Tabs now actually change content + active state
$("musicTabs").onclick=(e)=>{
  const btn=e.target.closest(".tab");
  if(!btn) return;
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  btn.classList.add("active");
  state.music.tab = btn.dataset.tab || "home";
  renderMusicGrid();
  toast("Tab: "+btn.textContent);
};

// Search overlay
function openMusicSearch(){
  $("musicSearch").classList.remove("hidden");
  state.music.query="";
  $("musicQuery").textContent="";
  $("musicSearchPh").classList.remove("hidden");
  renderMusicResults("");
}
function closeMusicSearch(){ $("musicSearch").classList.add("hidden"); }
$("musicSearchBtn").onclick=openMusicSearch;
$("musicSearchBtn2").onclick=openMusicSearch;
$("musicBackSearch").onclick=closeMusicSearch;

function renderMusicResults(q){
  const box=$("musicResults"); box.innerHTML="";
  const tracks=[
    {t:"Last Christmas", a:"Wham!"},
    {t:"Everything She Wants", a:"Wham!"},
    {t:"Careless Whisper", a:"George Michael"},
    {t:"Wake Me Up Before You Go‑Go", a:"Wham!"},
    {t:"Blue (Da Ba Dee)", a:"Eiffel 65"},
    {t:"Mr. Brightside", a:"The Killers"},
  ];
  const qq=(q||"").trim().toLowerCase();
  const hits=tracks.filter(x=>!qq || x.t.toLowerCase().includes(qq) || x.a.toLowerCase().includes(qq)).slice(0,8);
  hits.forEach(x=>{
    const r=document.createElement("div");
    r.className="res";
    r.innerHTML=`<div class="t">${x.t}</div><div class="s">${x.a}</div>`;
    r.onclick=()=>{
      state.music.track={title:x.t, artist:x.a};
      $("npTitle").textContent=x.t; $("npArtist").textContent=x.a;
      $("pTrack").textContent=x.t; $("pArtist").textContent=x.a;
      closeMusicSearch();
      toast("Play: "+x.t);
      setPlaying(true);
    };
    box.appendChild(r);
  });
  if(hits.length===0){
    const r=document.createElement("div");
    r.className="res";
    r.innerHTML=`<div class="t">No results</div><div class="s">Try another search</div>`;
    box.appendChild(r);
  }
}

function typeKey(k){
  if(k==="back") state.music.query = state.music.query.slice(0,-1);
  else if(k==="space") state.music.query += " ";
  else if(k==="search") {/* live */}
  else if(k==="sym") toast("Symbols (mock)");
  else state.music.query += k;
  $("musicQuery").textContent = state.music.query;
  $("musicSearchPh").classList.toggle("hidden", state.music.query.length>0);
  renderMusicResults(state.music.query);
}
const row1="1234567890".split("");
const row2="qwertyuiop".split("");
const row3="asdfghjkl".split("");
function fillRow(rowId, keys){
  const row=document.querySelector(`.kbdRow[data-row="${rowId}"]`);
  row.innerHTML="";
  keys.forEach(k=>{
    const b=document.createElement("button");
    b.className="kKey";
    b.type="button";
    b.textContent=(k==="back")?"⌫":k;
    b.onclick=()=>typeKey(k);
    row.appendChild(b);
  });
}
fillRow("1", row1);
fillRow("2", row2);
fillRow("3", row3.concat(["back"]));
document.querySelectorAll(".kbdBottom .kKey").forEach(b=>b.onclick=()=>typeKey(b.dataset.key));

// Gestures with safer routing
let sx=0, sy=0, t0=0;
document.addEventListener("touchstart",(e)=>{
  const p=e.touches[0]; sx=p.clientX; sy=p.clientY; t0=performance.now();
},{passive:true});
document.addEventListener("touchend",(e)=>{
  const p=e.changedTouches[0];
  const dx=p.clientX-sx, dy=p.clientY-sy, dt=performance.now()-t0;
  if(Math.max(Math.abs(dx),Math.abs(dy))<40 || dt>650) return;
  const dir=(Math.abs(dx)>Math.abs(dy))?(dx>0?"right":"left"):(dy>0?"down":"up");

  // music overlays close with down swipe
  if(state.surface==="music"){
    if(!$("musicSearch").classList.contains("hidden") && dir==="down"){ closeMusicSearch(); return; }
    if(!$("player").classList.contains("hidden") && dir==="down"){ closePlayer(); return; }
  }

  if(state.surface==="home"){
    if(dir==="up") show("drawer");
    if(dir==="left") show("connect");
    if(dir==="right") show("widgets");
    if(dir==="down") show("music"); // demo shortcut
  } else if(state.surface==="drawer"){
    if(dir==="down") 
// Prevent Android Chrome pull-to-refresh within the capsule
let _ptrY = null;
document.addEventListener("touchstart",(e)=>{
  _ptrY = e.touches[0].clientY;
},{passive:true});
document.addEventListener("touchmove",(e)=>{
  if(_ptrY===null) return;
  const y = e.touches[0].clientY;
  const dy = y - _ptrY;
  // If pulling down from very top of capsule, block browser refresh
  const atTop = (document.scrollingElement ? document.scrollingElement.scrollTop : 0) === 0;
  if(atTop && dy > 0 && _ptrY < 70){
    e.preventDefault();
  }
},{passive:false});

show("home");
  } else if(state.surface==="widgets"){
    if(dir==="right") show("home");
  } else if(state.surface==="connect"){
    if(dir==="left") show("home");
  } else if(state.surface==="music"){
    if(dir==="right") show("home");
  }
},{passive:true});

// hash routing (prevents “no changes” confusion when refreshing)
function routeFromHash(){
  const h=(location.hash||"").replace("#","").trim();
  if(screens.includes(h)) show(h);
}
window.addEventListener("hashchange", routeFromHash);

// PWA SW
if("serviceWorker" in navigator){
  window.addEventListener("load", async ()=>{
    try{
      const reg = await navigator.serviceWorker.register("sw.js");
      // ensure latest takes over quickly
      if(reg.waiting) reg.waiting.postMessage({type:"SKIP_WAITING"});
    }catch(e){}
  });
}

show("home");
setPlaying(true);
routeFromHash();
