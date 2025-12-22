
const screens = ["home","drawer","widgets","connect","overview","lock","aod"];
const $ = (id)=>document.getElementById(id);
const show = (id)=>{
  screens.forEach(s=>$(s).classList.toggle("hidden", s!==id));
  state.surface=id;
  closeShades(); closeSearch(); closeSheet();
};
const state = {
  surface:"home",
  edit:false,
  scope:"app",
  live:false,
  space:0,
  spaces:[
    {name:"Personal", recents:["Music","Browser","Notes"]},
    {name:"Work", recents:["Mail","Calendar","Chat"]},
    {name:"Play", recents:["Games","Photos"]}
  ],
  pinned:["Music","Browser","Messages","Camera"],
  apps:["Music","Browser","Messages","Camera","Photos","Settings","Files","Notes","Calendar","Mail","Maps","Clock","Store","Recorder","Weather","Gallery"],
};

function timeTick(){
  const d=new Date();
  const hh=String(d.getHours()).padStart(2,"0");
  const mm=String(d.getMinutes()).padStart(2,"0");
  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const date=`${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  document.querySelectorAll("[data-time]").forEach(e=>e.textContent=`${hh}:${mm}`);
  document.querySelectorAll("[data-date]").forEach(e=>e.textContent=date);
}
setInterval(timeTick, 5000); timeTick();

function toast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.remove("hidden");
  clearTimeout(toast._tm); toast._tm=setTimeout(()=>t.classList.add("hidden"), 1200);
}

function render(){
  // home grid
  const grid=$("grid"); grid.innerHTML="";
  const items=[
    {type:"widget",name:"Calendar"},
    {type:"widget",name:"Connect"},
    {type:"widget",name:"Weather"},
    {type:"widget",name:"Files"},
    {type:"app",name:"Notes"},
    {type:"app",name:"Photos"},
    {type:"app",name:"Store"},
    {type:"app",name:"Settings"},
  ];
  items.forEach(it=>{
    const d=document.createElement("div");
    d.className="tile";
    d.innerHTML=`<div class="dot"></div><div><div style="font-weight:900">${it.name}</div><div class="sub" style="margin:0">${it.type}</div></div>`;
    d.onclick=()=>toast(`${it.type}: ${it.name}`);
    grid.appendChild(d);
  });
  // dock
  const dock=$("dock"); dock.innerHTML="";
  state.pinned.slice(0,4).forEach(a=>{
    const b=document.createElement("div"); b.className="pin"; b.textContent=a[0];
    b.onclick=()=>toast(`Open pinned: ${a}`);
    dock.appendChild(b);
  });
  // drawer
  const pr=$("pinnedRow"); pr.innerHTML="";
  state.pinned.slice(0,4).forEach(a=>{
    const x=document.createElement("div"); x.className="app"; x.textContent=a[0];
    x.onclick=()=>toast(`Open: ${a}`);
    pr.appendChild(x);
  });
  const ag=$("appsGrid"); ag.innerHTML="";
  state.apps.forEach(a=>{
    const x=document.createElement("div"); x.className="app"; x.textContent=a[0];
    x.onclick=()=>toast(`Open: ${a}`);
    ag.appendChild(x);
  });
  // widgets list
  const wl=$("widgetList"); wl.innerHTML="";
  ["Now Playing","Calendar","Weather","Files"].forEach(w=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${w}</div><div class="sub">Tap to add</div>`;
    c.onclick=()=>toast(`Add widget: ${w}`);
    wl.appendChild(c);
  });
  // connect list
  const cl=$("connectList"); cl.innerHTML="";
  ["Messages","Calls","Contacts","Upcoming events","Shared files"].forEach(w=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${w}</div><div class="sub">Tap title for full view</div>`;
    c.onclick=()=>toast(`Open ${w}`);
    cl.appendChild(c);
  });
  // overview spaces + recents
  const sp=$("spaces"); sp.innerHTML="";
  state.spaces.forEach((s,i)=>{
    const e=document.createElement("div");
    e.className="space"+(i===state.space?" active":"");
    e.textContent=s.name;
    e.onclick=()=>{state.space=i; render();};
    sp.appendChild(e);
  });
  const rc=$("recents"); rc.innerHTML="";
  state.spaces[state.space].recents.forEach(a=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${a}</div><div class="sub">Tap to open • Close removes</div><div style="margin-top:10px;display:flex;gap:10px"><button class="pill small" data-open>Open</button><button class="pill small" data-close>Close</button></div>`;
    c.onclick=(ev)=>{
      if(ev.target && ev.target.dataset.close!==undefined){
        state.spaces[state.space].recents=state.spaces[state.space].recents.filter(x=>x!==a);
        render(); toast(`Closed: ${a}`); ev.stopPropagation(); return;
      }
      if(ev.target && ev.target.dataset.open!==undefined){
        toast(`Open full screen: ${a}`); show("home"); ev.stopPropagation(); return;
      }
    };
    rc.appendChild(c);
  });
  // notifs
  const nl=$("notifList"); nl.innerHTML="";
  ["Message","Calendar","Weather"].forEach(n=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${n}</div><div class="sub">Hidden until unlock</div>`;
    nl.appendChild(c);
  });
  $("live").classList.toggle("hidden", !state.live);
}
render();

// --- sheet / edit / live / lock
$("menuBtn").onclick=()=>openSheet();
$("sheetClose").onclick=()=>closeSheet();
$("editBtn").onclick=()=>{closeSheet(); setEdit(true);};
$("doneBtn").onclick=()=>setEdit(false);
$("liveBtn").onclick=()=>{state.live=!state.live; render(); closeSheet(); toast(state.live?"Live on":"Live off");};
$("lockBtn").onclick=()=>{closeSheet(); show("lock");};
$("npBtn").onclick=()=>{state.live=true; render(); toast("Now playing (collapsed)");};
$("liveExpand").onclick=()=>toast("Expanded now playing (mock)");
$("searchBtn").onclick=()=>openSearch();

// long press on home => edit
let lp=null;
$("home").addEventListener("touchstart",(e)=>{
  if(state.surface!=="home"||state.edit) return;
  if(e.target.closest(".bar")) return;
  lp=setTimeout(()=>setEdit(true), 520);
},{passive:true});
["touchend","touchmove","touchcancel"].forEach(evt=>{
  $("home").addEventListener(evt,()=>clearTimeout(lp),{passive:true});
});

function setEdit(on){
  state.edit=on;
  $("edit").classList.toggle("hidden", !on);
  toast(on?"Edit mode on":"Edit mode off");
}

function openSheet(){ $("sheet").classList.remove("hidden"); }
function closeSheet(){ $("sheet").classList.add("hidden"); }
document.addEventListener("click",(e)=>{
  if(!$("sheet").classList.contains("hidden")){
    const inside=$("sheet").contains(e.target) || e.target.id==="menuBtn";
    if(!inside) closeSheet();
  }
});

// drag floatables only in edit
document.querySelectorAll(".floatable").forEach(el=>{
  let dragging=false, ox=0, oy=0;
  el.addEventListener("pointerdown",(e)=>{
    if(!state.edit) return;
    dragging=true; el.setPointerCapture(e.pointerId);
    const r=el.getBoundingClientRect(); ox=e.clientX-r.left; oy=e.clientY-r.top;
  });
  el.addEventListener("pointermove",(e)=>{
    if(!dragging) return;
    const pad=6;
    const x=Math.max(pad, Math.min(window.innerWidth-el.offsetWidth-pad, e.clientX-ox));
    const y=Math.max(pad+30, Math.min(window.innerHeight-el.offsetHeight-100, e.clientY-oy));
    el.style.left=x+"px"; el.style.top=y+"px";
  });
  ["pointerup","pointercancel"].forEach(evt=>el.addEventListener(evt,()=>dragging=false));
});

// --- search
function openSearch(){
  $("search").classList.remove("hidden");
  $("q").value=""; renderResults("");
  $("q").focus();
}
function closeSearch(){ $("search").classList.add("hidden"); }
function renderResults(q){
  const box=$("results"); box.innerHTML="";
  const query=(q||"").trim().toLowerCase();
  const apps=state.apps.filter(a=>!query||a.toLowerCase().includes(query));
  const results=(state.scope==="app")
    ? apps.slice(0,8).map(a=>({k:"App",t:a,s:"Launch"}))
    : [
        ...apps.slice(0,6).map(a=>({k:"App",t:a,s:"Launch"})),
        {k:"Web",t:`Search web for "${q}"`,s:"Open browser"},
        ...["Lia (contact)","Wi‑Fi (setting)","Project FibreOS (file)"].filter(x=>!query||x.toLowerCase().includes(query)).map(x=>({k:"Other",t:x,s:"Open"}))
      ];
  if(results.length===0) results.push({k:"",t:"No results",s:"Try another query"});
  results.forEach(r=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div class="cardTitle">${r.t}</div><div class="sub">${r.k} • ${r.s}</div>`;
    c.onclick=()=>toast(`${r.k||"Result"}: ${r.t}`);
    box.appendChild(c);
  });
}
$("q").addEventListener("input",(e)=>renderResults(e.target.value));
$("scope").onclick=()=>{
  state.scope=state.scope==="app"?"global":"app";
  $("scope").textContent=state.scope==="app"?"In‑app":"Global";
  renderResults($("q").value);
};
$("search").addEventListener("click",(e)=>{
  const inUI=e.target.closest(".results")||e.target.closest(".searchRow")||e.target.closest(".kbd");
  if(!inUI) closeSearch();
});
document.querySelectorAll("[data-k]").forEach(b=>{
  b.onclick=()=>{
    const k=b.dataset.k;
    if(k==="back") $("q").value=$("q").value.slice(0,-1);
    if(k==="space") $("q").value=$("q").value+" ";
    renderResults($("q").value); $("q").focus();
  };
});

// --- shades
function openNotifs(){ $("notifs").classList.remove("hidden"); $("qs").classList.add("hidden"); toast("Notifications"); }
function openQS(){ $("qs").classList.remove("hidden"); $("notifs").classList.add("hidden"); toast("Quick settings"); }
function closeShades(){ $("notifs").classList.add("hidden"); $("qs").classList.add("hidden"); }
$("notifs").onclick=()=>closeShades();
$("qs").onclick=()=>closeShades();

// --- gestures
let sx=0, sy=0, t0=0;
document.addEventListener("touchstart",(e)=>{
  const p=e.touches[0]; sx=p.clientX; sy=p.clientY; t0=performance.now();
},{passive:true});
document.addEventListener("touchend",(e)=>{
  const p=e.changedTouches[0];
  const dx=p.clientX-sx, dy=p.clientY-sy, dt=performance.now()-t0;
  if(Math.max(Math.abs(dx),Math.abs(dy))<40 || dt>650) return;

  // close shades/search with down swipe
  if(!$("notifs").classList.contains("hidden") || !$("qs").classList.contains("hidden")){
    if(dy>40) closeShades();
    return;
  }
  if(!$("search").classList.contains("hidden")){
    if(dy>40) closeSearch();
    return;
  }

  // lock corner shades (swipe up from bottom corners)
  if(state.surface==="lock"){
    const fromBottom = sy > (window.innerHeight-120);
    if(fromBottom && sx < 120 && dy < -40){ openNotifs(); return; }
    if(fromBottom && sx > (window.innerWidth-120) && dy < -40){ openQS(); return; }
  }

  const dir = (Math.abs(dx)>Math.abs(dy)) ? (dx>0?"right":"left") : (dy>0?"down":"up");
  handle(dir);
},{passive:true});

function handle(dir){
  switch(state.surface){
    case "home":
      if(dir==="up") show("drawer");
      if(dir==="down") show("overview");
      if(dir==="left") show("connect");
      if(dir==="right") show("widgets");
      break;
    case "drawer":
      if(dir==="down") show("home");
      break;
    case "widgets":
      if(dir==="right") show("home");
      break;
    case "connect":
      if(dir==="left") show("home");
      break;
    case "overview":
      if(dir==="up") show("home");
      if(dir==="left"){ state.space=(state.space+1)%state.spaces.length; render(); }
      if(dir==="right"){ state.space=(state.space-1+state.spaces.length)%state.spaces.length; render(); }
      break;
    case "lock":
      if(dir==="up"){ closeShades(); show("home"); toast("Unlocked"); }
      if(dir==="down") show("aod");
      break;
    case "aod":
      if(dir==="up") show("lock");
      break;
  }
}

// tap AOD to wake
$("aod").onclick=()=>show("lock");

// PWA SW
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

show("home");
