// FibreOS Nav Reset v3.0.1
const state = {
  pageIndex: 0,
  drawerOpen: false
};

const homeTrack = document.getElementById('homeTrack');
const drawer = document.getElementById('drawer');
const drawerSheet = document.getElementById('drawerSheet');
const toast = document.getElementById('toast');

function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

function setBgForPage(i){
  // quick theme shift per page (capsule stays fixed)
  const root = document.documentElement;
  if(i===0){
    root.style.setProperty('--accentA','rgba(208,25,92,.22)');
    root.style.setProperty('--accentB','rgba(72,245,210,.15)');
  }else if(i===1){
    root.style.setProperty('--accentA','rgba(72,245,210,.20)');
    root.style.setProperty('--accentB','rgba(255,210,80,.16)');
  }else{
    root.style.setProperty('--accentA','rgba(255,70,140,.18)');
    root.style.setProperty('--accentB','rgba(110,120,255,.16)');
  }
}

function render(){
  homeTrack.style.transform = `translate3d(${-state.pageIndex*100}%,0,0)`;
  drawer.classList.toggle('is-open', state.drawerOpen);
  setBgForPage(state.pageIndex);
}

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.remove('show'), 1200);
}

// ---- Time + date (device local time) ----
function pad2(n){ return String(n).padStart(2,'0'); }

function updateClock(){
  const d = new Date();
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  document.querySelectorAll('[data-hh]').forEach(el=>el.textContent = hh);
  document.querySelectorAll('[data-mm]').forEach(el=>el.textContent = mm);
  const capTime = document.getElementById('capTime');
  if(capTime) capTime.textContent = `${hh}:${mm}`;

  // Date strings
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const heroDay = document.getElementById('heroDay');
  const heroMonth = document.getElementById('heroMonth');
  const heroDate = document.getElementById('heroDate');
  if(heroDay) heroDay.textContent = days[d.getDay()];
  if(heroMonth) heroMonth.textContent = months[d.getMonth()];
  if(heroDate) heroDate.textContent = String(d.getDate());
}
updateClock();
setInterval(updateClock, 1000);

// ---- Battery (dummy stable for now) ----
let batPct = 64;
let batDir = 1;
function tickBattery(){
  // stable dummy, no --%
  batPct += batDir * 1;
  if(batPct>=98) batDir = -1;
  if(batPct<=12) batDir = 1;

  const fill = document.getElementById('batFill');
  const pctEl = document.getElementById('batPct');
  if(fill) fill.style.width = `${clamp(batPct,6,100)}%`;
  if(pctEl) pctEl.textContent = `${Math.round(batPct)}%`;
}
tickBattery();
setInterval(tickBattery, 2200);

// ---- Drawer content ----
const drawerGrid = document.getElementById('drawerGrid');
const APPS = [
  ['Music','🎵','music'],
  ['Connect','✉️','connect'],
  ['Search','🔎','search'],
  ['Widgets','🧩','widgets'],
  ['Settings','⚙️','settings'],
  ['Photos','🖼️','photos'],
  ['Camera','📷','camera'],
  ['Browser','🌐','browser'],
  ['Chat','🤖','chat'],
  ['Store','🛍️','store'],
  ['Maps','🗺️','maps'],
  ['Notes','🗒️','notes'],
  ['Clock','⏱️','clock'],
  ['Mail','📮','mail'],
  ['Wallet','👛','wallet'],
  ['Games','🎮','games'],
  ['Health','❤️','health'],
  ['Files','🗂️','files'],
  ['TV','📺','tv'],
  ['Remote','🕹️','remote'],
];

function renderDrawerGrid(){
  if(!drawerGrid) return;
  drawerGrid.innerHTML = APPS.map(([name,glyph,id]) => `
    <button class="drawerApp" data-app="${id}">
      <span class="glyph">${glyph}</span>
      <span class="lbl">${name}</span>
    </button>
  `).join('');
  drawerGrid.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-app');
      showToast(`${id} (stub)`);
      closeDrawer();
    });
  });
}
renderDrawerGrid();

// Open app stubs from pinned icons
document.querySelectorAll('[data-open]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-open');
    showToast(`${id} (stub)`);
  });
});

// ---- Drawer open/close ----
function openDrawer(){
  if(state.drawerOpen) return;
  state.drawerOpen = true;
  render();
  // reset scroll to top so pinned sticks immediately like design
  drawerSheet.scrollTop = 0;
}
function closeDrawer(){
  if(!state.drawerOpen) return;
  state.drawerOpen = false;
  render();
}
document.getElementById('capMenuBtn').addEventListener('click', ()=>{
  state.drawerOpen ? closeDrawer() : openDrawer();
});

// HomeBar: tap always closes drawer + returns to page 0
const homeBar = document.getElementById('homeBar');
homeBar.addEventListener('click', ()=>{
  closeDrawer();
  state.pageIndex = 0;
  render();
});

// ---- Horizontal pager gestures (home only, drawer closed) ----
let startX=0, startY=0, tracking=false;
let lastX=0;

function onTouchStart(e){
  if(state.drawerOpen) return;
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
  lastX = startX;
  tracking = true;
}
function onTouchMove(e){
  if(!tracking || state.drawerOpen) return;
  const t = e.touches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;
  // ignore vertical intent
  if(Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10){
    tracking = false;
    return;
  }
  lastX = t.clientX;
}
function onTouchEnd(){
  if(!tracking || state.drawerOpen) return;
  const dx = lastX - startX;
  if(Math.abs(dx) > 48){
    const dir = dx < 0 ? 1 : -1;
    state.pageIndex = clamp(state.pageIndex + dir, 0, 2);
    render();
  }
  tracking=false;
}
document.getElementById('homePager').addEventListener('touchstart', onTouchStart, {passive:true});
document.getElementById('homePager').addEventListener('touchmove', onTouchMove, {passive:true});
document.getElementById('homePager').addEventListener('touchend', onTouchEnd, {passive:true});

// ---- Vertical drawer gesture (swipe up to open, swipe down to close when at top) ----
let vStartY=0, vStartX=0, vTracking=false;

function vTouchStart(e){
  const t = e.touches[0];
  vStartY = t.clientY;
  vStartX = t.clientX;
  vTracking = true;
}
function vTouchMove(e){
  if(!vTracking) return;
  const t = e.touches[0];
  const dx = t.clientX - vStartX;
  const dy = t.clientY - vStartY;

  // open: swipe up on home when drawer closed
  if(!state.drawerOpen){
    if(Math.abs(dy) > Math.abs(dx) && dy < -52){
      openDrawer();
      vTracking = false;
    }
    return;
  }

  // close: swipe down only if drawer scroll at top (matches design)
  const atTop = drawerSheet.scrollTop <= 0;
  if(state.drawerOpen && atTop){
    if(Math.abs(dy) > Math.abs(dx) && dy > 62){
      closeDrawer();
      vTracking = false;
    }
  }
}
function vTouchEnd(){ vTracking = false; }

document.getElementById('homePager').addEventListener('touchstart', vTouchStart, {passive:true});
document.getElementById('homePager').addEventListener('touchmove', vTouchMove, {passive:true});
document.getElementById('homePager').addEventListener('touchend', vTouchEnd, {passive:true});

drawer.addEventListener('touchstart', vTouchStart, {passive:true});
drawer.addEventListener('touchmove', vTouchMove, {passive:true});
drawer.addEventListener('touchend', vTouchEnd, {passive:true});

// Search input: just focus, no logic yet
document.getElementById('capSearchInput').addEventListener('focus', ()=>{
  showToast('Search (input only)');
});

render();
