/* FibreOS prototype (v23)
   - Pixel-perfect-ish layout for the provided home + music bar style
   - No page reloads, no browser scroll pull-to-refresh
   - GMT/UTC time + date
   - Weather (Huddersfield) via Open-Meteo (no key)
*/

const state = {
  spaceIndex: 0,              // 0 home, 1 widgethub
  overlay: null,              // "search" | "connect" | "music"
  isPlaying: true,
  progress: 0.35,
  tracks: [
    { title: "Last Christmas", artist: "Wham!", dur: "4:23" },
    { title: "Jingle Bell Rock", artist: "Bobby Helms", dur: "2:10" },
    { title: "Santa Tell Me", artist: "Ariana Grande", dur: "3:24" },
    { title: "Fairytale of New York", artist: "The Pogues", dur: "4:33" },
    { title: "Merry Xmas Everybody", artist: "Slade", dur: "3:46" },
  ],
  weather: { desc: "Loading…", temp: "—°", hi: "—", lo: "—" },
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function setScale(){
  const w = 360, h = 808;
  const s = Math.min(window.innerWidth / w, window.innerHeight / h);
  $("#capsule").style.setProperty("--scale", String(Math.max(0.65, Math.min(1.2, s))));
}
window.addEventListener("resize", setScale);
setScale();

/* ---------- Time (UTC/GMT) ---------- */
function fmtTimeUTC(d){
  return d.toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtWeekdayUTC(d){
  return d.toLocaleDateString("en-GB", { timeZone:"UTC", weekday:"long" });
}
function fmtMonthUTC(d){
  return d.toLocaleDateString("en-GB", { timeZone:"UTC", month:"long" });
}
function fmtDayUTC(d){
  return d.toLocaleDateString("en-GB", { timeZone:"UTC", day:"2-digit" });
}
function updateTime(){
  const d = new Date();
  const t = fmtTimeUTC(d);
  // status bars
  ["#sysTime","#sysTime2","#sysTime3","#sysTime4","#sysTime5"].forEach(id => {
    const el = $(id);
    if (el) el.textContent = t;
  });
  // big clock digits on home (HH:MM)
  const hh = t.slice(0,2);
  const mm = t.slice(3,5);
  $("#t_h1").textContent = hh[0];
  $("#t_h2").textContent = hh[1];
  $("#t_m1").textContent = mm[0];
  $("#t_m2").textContent = mm[1];

  $("#dw_weekday").textContent = fmtWeekdayUTC(d);
  $("#dw_month").textContent = fmtMonthUTC(d);
  $("#dw_day").textContent = String(parseInt(fmtDayUTC(d),10));

  // calendar header (dummy, but UTC)
  const suffix = (n) => {
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    if (n % 10 === 1) return "st";
    if (n % 10 === 2) return "nd";
    if (n % 10 === 3) return "rd";
    return "th";
  };
  const day = parseInt(fmtDayUTC(d),10);
  $("#calHeader").textContent = `${fmtWeekdayUTC(d)} ${day}${suffix(day)} ${fmtMonthUTC(d)}`;
}
updateTime();
setInterval(updateTime, 10_000);

/* ---------- Weather (Huddersfield) ---------- */
const WX_KEY = "fibreos_wx_cache_v1";
const WX_TS_KEY = "fibreos_wx_ts_v1";

function weatherCodeToText(code){
  // Open-Meteo weather_code mapping (lightweight)
  const map = [
    [0, "Clear"],
    [1, "Mainly clear"],
    [2, "Partly cloudy"],
    [3, "Cloudy"],
    [45, "Fog"],
    [48, "Rime fog"],
    [51, "Light drizzle"],
    [53, "Drizzle"],
    [55, "Heavy drizzle"],
    [61, "Light rain"],
    [63, "Rain"],
    [65, "Heavy rain"],
    [71, "Light snow"],
    [73, "Snow"],
    [75, "Heavy snow"],
    [80, "Rain showers"],
    [81, "Showers"],
    [82, "Violent showers"],
    [95, "Thunderstorm"],
    [96, "Thunder + hail"],
    [99, "Thunder + hail"],
  ];
  for (const [k,v] of map){
    if (k === code) return v;
  }
  return "Weather";
}

async function fetchWeatherHuddersfield(){
  // Cache for 30 mins to avoid hammering APIs
  const last = Number(localStorage.getItem(WX_TS_KEY) || "0");
  if (Date.now() - last < 30 * 60 * 1000) {
    const cached = localStorage.getItem(WX_KEY);
    if (cached) return JSON.parse(cached);
  }

  const geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=Huddersfield&count=1&language=en&format=json";
  const geo = await (await fetch(geoUrl)).json();
  if (!geo?.results?.length) throw new Error("No geocode results for Huddersfield");

  const { latitude, longitude } = geo.results[0];

  const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=UTC`;
  const data = await (await fetch(wxUrl)).json();

  const code = data?.current?.weather_code;
  const temp = Math.round(data?.current?.temperature_2m);
  const hi = Math.round(data?.daily?.temperature_2m_max?.[0]);
  const lo = Math.round(data?.daily?.temperature_2m_min?.[0]);

  const result = {
    desc: weatherCodeToText(code),
    temp: Number.isFinite(temp) ? `${temp}°` : "—°",
    hi: Number.isFinite(hi) ? hi : "—",
    lo: Number.isFinite(lo) ? lo : "—",
  };
  localStorage.setItem(WX_KEY, JSON.stringify(result));
  localStorage.setItem(WX_TS_KEY, String(Date.now()));
  return result;
}

async function updateWeather(){
  try{
    const w = await fetchWeatherHuddersfield();
    state.weather = w;
    $("#wx_desc").textContent = w.desc;
    $("#wx_temp").textContent = w.temp;
    $("#wx_range").textContent = `${w.hi}° • ${w.lo}°`;
  }catch(e){
    $("#wx_desc").textContent = "Weather unavailable";
  }
}
updateWeather();
setInterval(updateWeather, 30 * 60 * 1000);

/* ---------- Navigation ---------- */
function setSpace(idx){
  state.spaceIndex = Math.max(0, Math.min(1, idx));
  $("#spaces").style.transform = `translateX(${state.spaceIndex * -360}px)`;
}
function openOverlay(name){
  state.overlay = name;
  const el = document.querySelector(`.overlay[data-screen="${name}"]`);
  if (el) el.classList.add("open");
  // ensure keyboard focus for search
  if (name === "search") {
    setTimeout(() => $("#searchInput")?.focus(), 50);
  }
}
function closeOverlay(name){
  const el = document.querySelector(`.overlay[data-screen="${name}"]`);
  if (el) el.classList.remove("open");
  if (state.overlay === name) state.overlay = null;
}

/* Buttons that open overlays */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-open]");
  if (btn){
    const target = btn.getAttribute("data-open");
    if (target === "home") { setSpace(0); return; }
    if (target === "widgethub") { setSpace(1); return; }
    if (["search","connect","music"].includes(target)) { openOverlay(target); return; }
    // placeholder for other apps
    toast(`"${target}" is a dummy app for now.`);
  }
  const close = e.target.closest("[data-close]");
  if (close){
    closeOverlay(close.getAttribute("data-close"));
  }
});

/* Search Everything */
function buildSearchResults(query){
  const q = query.trim().toLowerCase();
  const apps = [
    { name:"Music", sub:"App", icon:"assets/icons/music.png", open:"music" },
    { name:"Connect Hub", sub:"System app", icon:"assets/icons/connect.png", open:"connect" },
    { name:"Widget Hub", sub:"Space", icon:"assets/icons/widgets.png", open:"widgethub" },
    { name:"Settings", sub:"System app (dummy)", icon:"assets/icons/settings.png", open:"settings" },
    { name:"Camera", sub:"App (dummy)", icon:"assets/icons/camera.png", open:"camera" },
  ];

  const results = apps.filter(a => !q || a.name.toLowerCase().includes(q)).slice(0, 6);

  // web + other dummy results
  if (q){
    results.push({ name:`Search the web for “${query}”`, sub:"Web", icon:"assets/icons/browser.png", open:"browser" });
    results.push({ name:`Settings: ${query}`, sub:"System", icon:"assets/icons/settings.png", open:"settings" });
    results.push({ name:`Files matching: ${query}`, sub:"Files", icon:"assets/icons/widgets.png", open:"files" });
  }
  return results;
}

function renderSearchResults(){
  const q = $("#searchInput").value;
  const list = buildSearchResults(q);
  const root = $("#searchResults");
  root.innerHTML = "";
  list.forEach(item => {
    const row = document.createElement("button");
    row.className = "result";
    row.type = "button";
    row.innerHTML = `
      <img src="${item.icon}" alt="">
      <div class="r-meta">
        <div class="r-title">${escapeHtml(item.name)}</div>
        <div class="r-sub">${escapeHtml(item.sub)}</div>
      </div>
      <div aria-hidden="true">›</div>
    `;
    row.addEventListener("click", () => {
      closeOverlay("search");
      if (item.open === "widgethub") setSpace(1);
      else if (item.open === "home") setSpace(0);
      else if (["music","connect","search"].includes(item.open)) openOverlay(item.open);
      else toast(`"${item.open}" is a dummy action.`);
    });
    root.appendChild(row);
  });
}
$("#globalSearchBtn").addEventListener("click", () => openOverlay("search"));
$("#globalSearchBtn2").addEventListener("click", () => openOverlay("search"));
$("#searchClose").addEventListener("click", () => closeOverlay("search"));
$("#searchInput").addEventListener("input", renderSearchResults);
renderSearchResults();

/* Connect Hub dummy threads */
function renderConnect(){
  const threads = [
    { who:"Lia", via:"WhatsApp", msg:"Do you want anything from the shop?", unread:2 },
    { who:"Mum", via:"RCS", msg:"Are you free Sunday?", unread:0 },
    { who:"VP Trade Team", via:"Slack", msg:"New build is on staging.", unread:5 },
    { who:"Beans 🐈", via:"Telepathy", msg:"feed me. now.", unread:99 },
    { who:"DPD", via:"Email", msg:"Your parcel arrives tomorrow 09:00–10:00", unread:1 },
  ];
  const root = $("#connectList");
  root.innerHTML = "";
  threads.forEach(t => {
    const row = document.createElement("div");
    row.className = "thread";
    row.innerHTML = `
      <div class="avatar">${escapeHtml(t.who.slice(0,1).toUpperCase())}</div>
      <div class="meta">
        <div class="name">${escapeHtml(t.who)} <span style="opacity:.7;font-weight:700;">· ${escapeHtml(t.via)}</span></div>
        <div class="snippet">${escapeHtml(t.msg)}</div>
      </div>
      ${t.unread ? `<div class="badge">${t.unread}</div>` : ``}
    `;
    root.appendChild(row);
  });
}
renderConnect();

/* Music app */
function renderTrackList(){
  const root = $("#trackList");
  root.innerHTML = "";
  state.tracks.forEach((t, i) => {
    const row = document.createElement("button");
    row.className = "trackrow";
    row.type = "button";
    row.innerHTML = `
      <div class="mini"></div>
      <div class="meta">
        <div class="t">${escapeHtml(t.title)}</div>
        <div class="a">${escapeHtml(t.artist)}</div>
      </div>
      <div class="dur">${escapeHtml(t.dur)}</div>
    `;
    row.addEventListener("click", () => {
      setNowPlaying(t.title, t.artist);
      state.progress = Math.min(0.95, 0.15 + i*0.12);
      syncProgress();
      toast(`Playing: ${t.title} — ${t.artist}`);
    });
    root.appendChild(row);
  });
}
renderTrackList();

function setNowPlaying(title, artist){
  $("#trackTitle").textContent = title;
  $("#trackArtist").textContent = artist;
  $("#npTitle").textContent = title;
  $("#npArtist").textContent = artist;
  $("#sheetTitle").textContent = title;
  $("#sheetArtist").textContent = artist;
}

function syncPlayState(){
  const icon = state.isPlaying ? "⏸" : "▶";
  $("#playBtn").textContent = icon;
  $("#npPlay").textContent = icon;
  $("#sPlay").textContent = icon;
}
function syncProgress(){
  const pct = Math.round(state.progress * 100);
  $("#barFill").style.width = pct + "%";
  $("#sFill").style.width = pct + "%";
}
syncPlayState();
syncProgress();

["#playBtn","#sPlay"].forEach(id => {
  $(id).addEventListener("click", () => {
    state.isPlaying = !state.isPlaying;
    syncPlayState();
  });
});
["#prevBtn","#nextBtn","#sPrev","#sNext"].forEach(id => {
  $(id).addEventListener("click", () => toast("Playback controls are wired (dummy)."));
});

/* Now playing sheet */
const sheet = $("#nowPlayingSheet");
$("#nowPlayingBtn").addEventListener("click", () => {
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden","false");
});
$("#sheetClose").addEventListener("click", () => {
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden","true");
});

/* Menu */
const menuOverlay = $("#menuOverlay");
const menuTitle = $("#menuTitle");
function openMenu(title){
  menuTitle.textContent = title;
  menuOverlay.hidden = false;
}
function closeMenu(){
  menuOverlay.hidden = true;
}
$("#menuClose").addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", (e) => {
  if (e.target === menuOverlay) closeMenu();
});

document.addEventListener("click", (e) => {
  const m = e.target.closest("[data-open-menu]");
  if (m){
    openMenu(m.getAttribute("data-open-menu") === "music" ? "Music" : "System");
  }
  const app = e.target.closest(".menu-app");
  if (app){
    closeMenu();
    const t = app.getAttribute("data-open");
    if (t === "widgethub") setSpace(1);
    else if (t === "music") openOverlay("music");
    else if (t === "connect") openOverlay("connect");
    else if (t === "search") openOverlay("search");
    else toast(`"${t}" is a dummy app.`);
  }
});

/* ---------- Gestures ---------- */
let touch = null;

function isInScrollable(target){
  const sc = target.closest(".scrollable");
  if (!sc) return false;
  // allow vertical scroll inside scrollables
  return true;
}

$("#capsule").addEventListener("pointerdown", (e) => {
  // Don't start gestures if an overlay is open and the user is interacting with a scrollable.
  const inScroll = isInScrollable(e.target);
  touch = {
    id: e.pointerId,
    x0: e.clientX,
    y0: e.clientY,
    t0: performance.now(),
    inScroll,
    decided: false,
    axis: null,
  };
  $("#capsule").setPointerCapture(e.pointerId);
});

$("#capsule").addEventListener("pointermove", (e) => {
  if (!touch || touch.id !== e.pointerId) return;

  const dx = e.clientX - touch.x0;
  const dy = e.clientY - touch.y0;

  // If user started on a scrollable, don't steal the gesture unless it's clearly horizontal
  if (!touch.decided){
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < 12 && ay < 12) return;
    touch.decided = true;
    touch.axis = ax > ay ? "x" : "y";
    // if started in scrollable + vertical, let the scrollable handle it
    if (touch.inScroll && touch.axis === "y") {
      // do nothing (browser will scroll inside element)
      return;
    }
  }

  // prevent default scrolling on our controlled gestures
  if (!(touch.inScroll && touch.axis === "y")) e.preventDefault();
}, { passive:false });

$("#capsule").addEventListener("pointerup", (e) => {
  if (!touch || touch.id !== e.pointerId) return;
  const dx = e.clientX - touch.x0;
  const dy = e.clientY - touch.y0;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);

  // If vertical scroll inside a scrollable, ignore.
  if (touch.inScroll && touch.axis === "y") { touch = null; return; }

  // Gestures are only active when NO overlay is open (simple rule for prototype stability)
  if (state.overlay) { touch = null; return; }

  // Horizontal: switch spaces
  if (ax > ay && ax > 60){
    if (dx > 0) setSpace(1);     // swipe right => widget hub
    else setSpace(0);            // swipe left => home
    touch = null;
    return;
  }

  // Vertical on home: swipe up => toast (app drawer later), swipe down => toast (multitask later)
  if (ay > ax && ay > 60){
    if (dy < 0) toast("Swipe up: App Drawer (coming next)");
    else toast("Swipe down: Multitasking (coming next)");
  }

  touch = null;
});

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._tm);
  toast._tm = setTimeout(() => t.hidden = true, 1500);
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}