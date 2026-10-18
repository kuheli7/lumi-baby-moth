// Hobbies: the list of half-finished projects, and Lumi's attic: a dark room where Lumi's lantern is your
// cursor, with its hobbies to find and things to do (the bed plays a lullaby).
(() => {
  "use strict";
  const { $, $$, sfx, store, restart, reduceMotion } = app;

  const drop = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -6 Q5 0 0 5 Q-5 0 0 -6Z" fill="#cfeafa" stroke="#8fc3e8" stroke-width="1.2"/>`;
  const heartPath = (x, y, s, fill) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -2 C-3 -7 -10 -4 -6 2 L0 7 L6 2 C10 -4 3 -7 0 -2 Z" fill="${fill}"/>`;

  // small hand-drawn icons, 64×64
  const ICON = {
    moons: `<g transform="rotate(-6 32 31)"><rect x="10" y="13" width="44" height="34" rx="4" fill="#fffdf6" stroke="#e3cdb5" stroke-width="2"/>
      <path d="M27 20 A10 10 0 1 0 37 36 A8 8 0 1 1 27 20Z" fill="#f6cf6a"/><circle cx="45" cy="25" r="4.5" fill="none" stroke="#a89a8a" stroke-width="1.4" stroke-dasharray="2 2"/></g>
      <path d="M38 56 L54 36" stroke="#8a5a32" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="54.6" cy="35.2" rx="2.4" ry="4.6" transform="rotate(38 54.6 35.2)" fill="#8fc3e8"/>`,
    jar: `<rect x="15" y="22" width="34" height="34" rx="10" fill="#e4f2fb" stroke="#9db7cf" stroke-width="2.5"/>
      <rect x="18" y="38" width="28" height="15" rx="7" fill="#f6cf6a" opacity=".55"/>
      ${star4(26, 45, 4, "#f2b450")}${star4(38, 42, 3.4, "#f2b450")}
      <rect x="18" y="14" width="28" height="9" rx="3" fill="#a34063"/>${star4(44, 13, 5.5, "#f6cf6a")}
      <path d="M20 28 Q19 36 21 44" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
    beads: `<path d="M8 20 Q32 56 56 20" fill="none" stroke="#c9a7ea" stroke-width="2"/>
      ${drop(19, 36, 1.7)}${drop(32, 42, 1.7)}${drop(45, 36, 1.7)}
      <path d="M56 20 L60 13" stroke="#9aa3ad" stroke-width="2" stroke-linecap="round"/>`,
    guitar: `<g transform="rotate(32 32 34)">
      <rect x="29.5" y="6" width="5" height="26" fill="#8a5a32"/><rect x="27" y="1" width="10" height="9" rx="2.5" fill="#6f4528"/>
      <circle cx="32" cy="35" r="10" fill="#8a5a32"/><circle cx="32" cy="47" r="12.5" fill="#8a5a32"/>
      <circle cx="32" cy="35" r="8" fill="#e0a466"/><circle cx="32" cy="47" r="10.5" fill="#e0a466"/>
      <circle cx="32" cy="40" r="3.6" fill="#4b2e1f"/><line x1="32" y1="4" x2="32" y2="54" stroke="#fbf7ec" stroke-width="1.3"/></g>`,
    museum: `<rect x="11" y="50" width="42" height="6" rx="2" fill="#8a5a32"/>
      <rect x="23" y="31" width="18" height="14" rx="2" fill="#fffdf6" stroke="#c9b49b" stroke-width="1.2"/>
      <text x="32" y="42" text-anchor="middle" font-size="10" font-family="Fredoka, sans-serif" font-weight="600" fill="#a34063">?!</text>
      <path d="M14 50 V30 Q14 12 32 12 Q50 12 50 30 V50Z" fill="#e8f4fb" fill-opacity=".5" stroke="#9db7cf" stroke-width="2.5"/>
      <circle cx="32" cy="9" r="3" fill="#9db7cf"/><path d="M19 32 Q19 22 25 17" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
    website: `<rect x="11" y="13" width="42" height="29" rx="3.5" fill="#4b3b7c"/><rect x="14" y="16" width="36" height="23" rx="2" fill="#fbf3e9"/>
      ${heartPath(32, 26.5, .9, "#ee8196")}<path d="M5 45 H59 L55 52 H9Z" fill="#b9a9da"/>`,
    new: `${star4(32, 32, 18, "#f6cf6a")}${star4(50, 14, 6, "#c9a7ea")}${star4(14, 50, 5, "#f8b0bf")}`,
  };
  const iconSvg = (id) => `<svg viewBox="0 0 64 64" aria-hidden="true">${ICON[id]}</svg>`;

  // the five hobbies from the character sheet, plus this very website
  // room: where it sits in the attic's 640×400 scene, and where its tag goes [x, y, anchor]
  const HOBBIES = [
    { id: "moons", name: "watercolor moons", tile: "#fde6ec", started: "3 nights ago", status: "half-finished", progress: 40,
      note: "painted three moons. two came out looking like lemons. the third is still a pencil circle.",
      room: [62, 196, 172, 80], tag: [66, 290, 0] },
    { id: "jar", name: "resin jar of stars", tile: "#fff1d2", started: "a week ago", status: "sticky", progress: 30,
      note: "poured the resin. forgot the stars. added the stars. the resin had already set. one star lives on the lid now.",
      room: [400, 76, 82, 80], tag: [440, 176, .5] },
    { id: "beads", name: "dew-drop bead jewellery", tile: "#e3f1fb", started: "4 nights ago", status: "needle missing", progress: 15,
      note: "strung three dew drops. they evaporated by morning. switched to glass beads, then lost the needle.",
      room: [352, 222, 120, 54], tag: [412, 290, .5] },
    { id: "guitar", name: "the guitar (one string)", tile: "#fdebd9", started: "2 weeks ago", status: "one (1) string", progress: 5,
      note: "learned one string. it is a very good string. the other five are 'coming soon'.",
      room: [478, 82, 130, 314], tag: [606, 244, 1], pluck: true },
    { id: "museum", name: "museum of useless facts", tile: "#efe7fb", started: "every night", status: "open late", progress: 99,
      note: "the only hobby that grows by itself. it can never be finished, because new facts keep happening.",
      room: [505, 52, 112, 104], tag: [612, 40, 1], link: ["#facts", "visit the museum ›"] },
    { id: "website", name: "this website", tile: "#e9e4f7", started: "Oct 17, 5:17 PM", status: "still in progress", progress: 90,
      note: "the only hobby with a deadline. Lumi is trying very hard to finish this one.",
      link: ["#credits", "see who helped ›"] },
  ];

  // ---------- the list ----------
  const list = $("#hobby-list");
  const CHEV = `<svg class="i chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const card = (h) => `<li class="hobby"><details>
      <summary>
        <span class="hobby-ico" style="background:${h.tile}">${iconSvg(h.icon || h.id)}</span>
        <span><span class="hobby-name">${esc(h.name)}</span><span class="hobby-meta">started ${esc(h.started)}<br>status: ${esc(h.status)}</span></span>
        ${CHEV}
      </summary>
      <div class="hobby-more">
        <span class="construction">🚧 under construction</span>
        <p>${esc(h.note)}</p>
        <div class="progress"><span>progress</span><span class="progress-bar"><i style="--p:${h.progress}%"></i></span><span>${h.progress}%</span></div>
        ${h.pluck ? `<button class="btn btn-gold small" data-pluck data-sfx="none">🎸 pluck the string</button>` : ""}
        ${h.link ? `<a class="btn btn-lilac small" href="${h.link[0]}">${h.link[1]}</a>` : ""}
      </div>
    </details></li>`;

  let mine = store.get("hobbies", []);
  if (!Array.isArray(mine)) mine = [];
  const suggested = () => mine.map(m => ({ id: "new", icon: "new", tile: "#fff6e0", name: m.name, started: "just now", status: "started (as always)", progress: 0,
    note: "a brand new hobby, suggested by a visitor. Lumi is very excited. Lumi has not started it yet." }));
  const renderList = () => { list.innerHTML = suggested().concat(HOBBIES).map(card).join(""); };
  renderList();

  $("#suggest").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#suggest-input"), name = input.value.trim().slice(0, 32);
    if (!name) return;
    input.value = "";
    mine = [{ name }].concat(mine).slice(0, 6);
    store.set("hobbies", mine);
    renderList();
    sfx.play.shiny();
    app.lumi.react("starry", `ooh, shiny. new hobby: ${name}!`, 3000);
    app.toast(`✨ Lumi started “${name}”. it is 0% done.`);
  });

  // ---------- the guitar: one string, one note. pluck it three times quickly for Lumi's greatest hit ----------
  let plucks = [];
  function pluckString() {
    const s = $("#room-scene .string");
    if (s && !reduceMotion) restart(s, "twang");
    sfx.play.pluck(196);
    const now = Date.now();
    plucks = plucks.filter(t => now - t < 1800).concat(now);
    if (plucks.length < 3) return;
    plucks = [];
    [196, 196, 293.7, 293.7, 329.6, 329.6, 293.7].forEach((f, i) => sfx.play.pluck(f, .45 + i * .32));
    app.secret("song");
    app.lumi.react("starry", "i'm a musician now!! (new hobby.)", 3400);
    app.toast("🎸 Lumi's Greatest Hit: Twinkle Twinkle, one-string edition ♪");
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-pluck]")) pluckString(); });

  // ======================================================================
  //  Lumi's attic (dark until the lantern comes by)
  // ======================================================================
  const VB_W = 640, VB_H = 400;
  const SCENE = `<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <pattern id="rm-paper" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M20 14 Q21 19 26 20 Q21 21 20 26 Q19 21 14 20 Q19 19 20 14Z" fill="#efdcc8"/></pattern>
      <linearGradient id="rm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2150"/><stop offset="1" stop-color="#4a3a7a"/></linearGradient>
      <linearGradient id="rm-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d3a271"/><stop offset="1" stop-color="#b9875a"/></linearGradient>
    </defs>
    <rect width="${VB_W}" height="${VB_H}" fill="#f6e7d6"/>
    <rect width="${VB_W}" height="${VB_H}" fill="url(#rm-paper)"/>
    <rect y="336" width="${VB_W}" height="64" fill="#d8b08a"/>
    <rect y="331" width="${VB_W}" height="6" fill="#c49770"/>

    <!-- the window, with the actual night outside -->
    <rect x="38" y="36" width="156" height="122" rx="10" fill="url(#rm-sky)" stroke="#9a7452" stroke-width="7"/>
    <path d="M150 54 A24 24 0 1 0 172 86 A18 18 0 1 1 150 54Z" fill="#fde7a8"/>
    ${star4(70, 62, 5, "#fde7a8")}${star4(96, 128, 4, "#fde7a8")}${star4(176, 132, 3.5, "#fde7a8")}
    <path d="M116 40 V154 M42 97 H190" stroke="#9a7452" stroke-width="5"/>

    <!-- a to-do note on the wall -->
    <g transform="rotate(-5 262 76)">
      <rect x="226" y="50" width="76" height="58" fill="#fff3a8"/>
      <text x="264" y="72" text-anchor="middle" font-family="Patrick Hand, cursive" font-size="12" fill="#5c4033">TODO:</text>
      <text x="264" y="88" text-anchor="middle" font-family="Patrick Hand, cursive" font-size="12" fill="#5c4033">finish 1 thing</text>
      <path d="M240 96 Q264 100 290 95" stroke="#a34063" stroke-width="1.5" fill="none"/></g>

    <!-- the frame for a painting made at the easel (empty until one is hung) -->
    <g id="rm-art" display="none">
      <rect x="312" y="40" width="70" height="56" rx="3" fill="#a87a50"/>
      <rect x="316.5" y="44.5" width="61" height="47" fill="#fffdf6"/>
      <image id="rm-art-img" x="317" y="45" width="60" height="46" preserveAspectRatio="xMidYMid slice"/>
    </g>

    <!-- shelf and desk -->
    <rect x="384" y="154" width="236" height="12" rx="3" fill="url(#rm-wood)"/>
    <path d="M404 166 v18 l14 -18 Z M600 166 v18 l-14 -18 Z" fill="#b9875a"/>
    <rect x="36" y="284" width="14" height="50" fill="#a87a50"/>
    <rect x="452" y="284" width="14" height="50" fill="#a87a50"/>
    <rect x="18" y="268" width="470" height="17" rx="5" fill="url(#rm-wood)"/>

    <!-- the desk lamp and the paint box where Lumi hatched -->
    <ellipse cx="300" cy="268" rx="28" ry="6" fill="#a34063"/>
    <path d="M300 266 L286 214 L330 184" fill="none" stroke="#a34063" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="286" cy="214" r="5" fill="#c25a7e"/>
    <path d="M318 176 L342 176 L356 204 L304 204 Z" fill="#f8b0bf" stroke="#a34063" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="330" cy="206" rx="9" ry="4.5" fill="#fff4c8"/>
    <rect x="246" y="222" width="70" height="26" rx="4" fill="#fde2ea" stroke="#a34063" stroke-width="2.5"/>
    <text x="281" y="240" text-anchor="middle" font-family="Patrick Hand, cursive" font-size="11" fill="#a34063">hatched here ✦</text>
    <rect x="244" y="248" width="74" height="21" rx="4" fill="#fffdf6" stroke="#a34063" stroke-width="2.5"/>
    ${["#e8838f", "#f6cf6a", "#8fc3e8", "#a8d8a0", "#c9a7ea", "#f4a76b"].map((c, i) => `<rect x="${250 + i * 11}" y="253" width="8" height="10" rx="2" fill="${c}"/>`).join("")}

    <!-- 1. watercolor moons -->
    <g transform="rotate(-4 140 244)">
      <rect x="70" y="214" width="132" height="54" rx="3" fill="#fffdf6" stroke="#e3d2bd" stroke-width="2"/>
      <circle cx="98" cy="241" r="14" fill="#fbe39a" opacity=".9"/><circle cx="94" cy="237" r="3" fill="#f3cf6a"/><circle cx="103" cy="246" r="2.2" fill="#f3cf6a"/>
      <path d="M138 227 A14 14 0 1 0 150 251 A11 11 0 1 1 138 227Z" fill="#fbe39a" opacity=".9"/>
      <circle cx="174" cy="241" r="13" fill="none" stroke="#9a8a7a" stroke-width="1.4" stroke-dasharray="3 3"/>
    </g>
    <rect x="206" y="232" width="22" height="36" rx="4" fill="#cfeafa" fill-opacity=".6" stroke="#9db7cf" stroke-width="2"/>
    <rect x="208" y="246" width="18" height="20" rx="3" fill="#8fc3e8" opacity=".55"/>
    <path d="M182 266 L218 228" stroke="#8a5a32" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="217" cy="229" rx="2.6" ry="5" transform="rotate(43 217 229)" fill="#5a8fc0"/>

    <!-- 2. resin jar of stars (one star stuck on the lid) -->
    <rect x="414" y="100" width="52" height="54" rx="12" fill="#dff0fb" fill-opacity=".7" stroke="#9db7cf" stroke-width="3"/>
    <rect x="417" y="127" width="46" height="24" rx="9" fill="#f6cf6a" fill-opacity=".5"/>
    ${star4(430, 139, 5, "#f2b450")}${star4(448, 135, 4, "#f2b450")}${star4(441, 146, 3, "#f2b450")}
    <path d="M421 110 Q420 122 423 134" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
    <rect x="418" y="90" width="44" height="12" rx="3" fill="#a34063"/>
    <circle cx="440" cy="85" r="4.5" fill="none" stroke="#c9a35a" stroke-width="2"/>
    ${star4(457, 88, 6, "#f6cf6a")}

    <!-- 5. museum of useless facts -->
    <rect x="520" y="58" width="84" height="17" rx="3" fill="#f2d488" stroke="#8a6a2a" stroke-width="2"/>
    <text x="562" y="71" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="10" letter-spacing="2" fill="#4a3510">MUSEUM</text>
    <rect x="522" y="144" width="80" height="10" rx="3" fill="#8a5a32"/>
    <rect x="548" y="114" width="28" height="22" rx="2" fill="#fffdf6" stroke="#c9b49b" stroke-width="1.5"/>
    <text x="562" y="130" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="13" fill="#a34063">?!</text>
    <path d="M528 144 V112 Q528 86 562 86 Q596 86 596 112 V144 Z" fill="#e8f4fb" fill-opacity=".45" stroke="#9db7cf" stroke-width="3"/>
    <circle cx="562" cy="82" r="4" fill="#9db7cf"/>
    <path d="M535 116 Q536 102 546 95" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>

    <!-- 3. dew-drop beads -->
    <ellipse cx="380" cy="264" rx="22" ry="7" fill="#fde2ea" stroke="#e8a0b4" stroke-width="2"/>
    <circle cx="373" cy="261" r="3" fill="#cfeafa"/><circle cx="381" cy="263" r="3" fill="#d8c6f3"/><circle cx="388" cy="260" r="3" fill="#fff"/>
    <path d="M392 260 Q420 230 456 250" stroke="#c9a7ea" stroke-width="1.6" fill="none"/>
    ${drop(408, 246, 1.1)}${drop(423, 240, 1.1)}${drop(438, 241, 1.1)}
    <path d="M456 250 L470 242" stroke="#9aa3ad" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Lumi's bed under the desk: a matchbox, a cotton-ball pillow and a sock for a blanket -->
    <rect x="186" y="304" width="170" height="30" rx="4" fill="#ecd5b4" stroke="#b98a5c" stroke-width="2.5"/>
    <rect x="186" y="304" width="46" height="30" rx="4" fill="#a34063" stroke="#85304f" stroke-width="2.5"/>
    ${star4(209, 319, 7, "#f6cf6a")}
    <ellipse cx="252" cy="303" rx="17" ry="8.5" fill="#fffaf4" stroke="#e3cdb5" stroke-width="2"/>
    <path d="M272 297 h72 a6 6 0 0 1 6 6 v5 h-84 v-5 a6 6 0 0 1 6 -6z" fill="#c9b7f0" stroke="#9c86d6" stroke-width="2"/>
    <path d="M288 298 v9 M304 298 v9 M320 298 v9 M336 298 v9" stroke="#fff" stroke-width="3" opacity=".55"/>

    <!-- 4. the guitar with one string, leaning on the desk -->
    <g transform="rotate(-10 548 340)">
      <rect x="541" y="112" width="14" height="150" fill="#8a5a32"/>
      <path d="M541 140 h14 M541 170 h14 M541 200 h14 M541 230 h14" stroke="#c9a36a" stroke-width="1.2"/>
      <rect x="535" y="86" width="26" height="30" rx="6" fill="#6f4528"/>
      <circle cx="531" cy="94" r="3" fill="#e7c88f"/><circle cx="531" cy="106" r="3" fill="#e7c88f"/><circle cx="565" cy="94" r="3" fill="#e7c88f"/><circle cx="565" cy="106" r="3" fill="#e7c88f"/>
      <ellipse cx="548" cy="270" rx="33" ry="32" fill="#8a5a32"/><ellipse cx="548" cy="332" rx="44" ry="44" fill="#8a5a32"/>
      <ellipse cx="548" cy="270" rx="30" ry="29" fill="#e0a466"/><ellipse cx="548" cy="332" rx="41" ry="41" fill="#e0a466"/>
      <circle cx="548" cy="298" r="12" fill="#4b2e1f"/>
      <rect x="533" y="342" width="30" height="7" rx="2" fill="#6f4528"/>
      ${star4(574, 352, 6, "#f8b0bf")}
      <line class="string" x1="548" y1="92" x2="548" y2="344" stroke="#fbf7ec" stroke-width="1.8"/>
    </g>
  </svg>`;

  const ROOM = HOBBIES.filter(h => h.room);
  // things in the attic that aren't hobbies: the lantern finds them too, but they don't count toward the five
  const SPOTS = [
    { id: "bed", name: "Lumi's bed", room: [186, 290, 170, 46], tag: [271, 352, .5],
      note: "a matchbox, a cotton-ball pillow and a sock for a blanket. Lumi only sleeps after a lullaby.", lullaby: true },
  ];
  const PLACES = ROOM.concat(SPOTS);
  const room = $("#room"), roomHits = $("#room-hits"), roomCard = $("#hobby-card"), foundCount = $("#found-count"), pips = $("#found-pips"), roomSwitch = $("#room-switch");
  $("#room-scene").innerHTML = SCENE;
  roomHits.innerHTML = PLACES.map(h => {
    const [x, y, w, hh] = h.room, [tx, ty, ax] = h.tag;
    return `<button class="hit" data-hobby="${h.id}" data-sfx="none" aria-label="${h.name}"
        style="left:${x / VB_W * 100}%;top:${y / VB_H * 100}%;width:${w / VB_W * 100}%;height:${hh / VB_H * 100}%"></button>
      <span class="hit-tag${h.lullaby ? " spot" : ""}" data-tag="${h.id}" style="left:${tx / VB_W * 100}%;top:${ty / VB_H * 100}%;translate:${-ax * 100}% -50%">${h.name.replace(/ \(.*\)/, "")}</span>`;
  }).join("");
  const found = new Set();
  let lightsOn = false;
  const showFound = () => {
    foundCount.textContent = found.size;
    pips.innerHTML = ROOM.map((_, i) => `<i class="${i < found.size ? "on" : ""}"></i>`).join("");
  };
  showFound();

  // lantern position as fractions of the room; it glides toward the target
  const lamp = { x: .47, y: .55, tx: .47, ty: .55, ease: .3, moving: false, arrive: null };
  const radius = () => Math.max(70, Math.min(150, room.clientWidth * .19));
  const sizeRoom = () => room.style.setProperty("--r", Math.round(radius()) + "px");
  const drawLamp = () => {
    room.style.setProperty("--x", (lamp.x * 100).toFixed(2) + "%");
    room.style.setProperty("--y", (lamp.y * 100).toFixed(2) + "%");
  };
  function stepLamp() {
    lamp.x += (lamp.tx - lamp.x) * lamp.ease;
    lamp.y += (lamp.ty - lamp.y) * lamp.ease;
    if (Math.abs(lamp.tx - lamp.x) < .001 && Math.abs(lamp.ty - lamp.y) < .001) { lamp.x = lamp.tx; lamp.y = lamp.ty; lamp.moving = false; }
    drawLamp();
    checkReveal();
    if (lamp.moving) requestAnimationFrame(stepLamp);
    else if (lamp.arrive) { const done = lamp.arrive; lamp.arrive = null; done(); }
  }
  function aimLamp(fx, fy, ease) {
    lamp.tx = Math.max(0, Math.min(1, fx));
    lamp.ty = Math.max(0, Math.min(1, fy));
    lamp.ease = reduceMotion ? 1 : ease;
    if (!lamp.moving) { lamp.moving = true; requestAnimationFrame(stepLamp); }
  }
  // a hobby is found once the lantern's bright middle touches it
  function checkReveal() {
    if (lightsOn || bedtime || !room.clientWidth) return;
    const lx = lamp.x * VB_W, ly = lamp.y * VB_H, reach = radius() / room.clientWidth * VB_W * .3;
    PLACES.forEach(h => {
      if (found.has(h.id) || seen.has(h.id)) return;
      const [x, y, w, hh] = h.room;
      const dx = Math.max(x - lx, 0, lx - (x + w)), dy = Math.max(y - ly, 0, ly - (y + hh));
      if (Math.hypot(dx, dy) < reach) (SPOTS.includes(h) ? spot(h) : discover(h));
    });
  }
  // a spot just gets its tag; it isn't a hobby
  const seen = new Set();
  function spot(h, quiet = false) {
    if (seen.has(h.id)) return;
    seen.add(h.id);
    $(`.hit-tag[data-tag="${h.id}"]`).classList.add("found");
    if (!quiet) { restart($(`.hit-tag[data-tag="${h.id}"]`), "just"); sfx.play.pop(); }
  }
  function discover(h, quiet = false) {
    if (found.has(h.id)) return;
    found.add(h.id);
    $(`.hit-tag[data-tag="${h.id}"]`).classList.add("found");
    showFound();
    if (quiet) return;
    restart($(`.hit-tag[data-tag="${h.id}"]`), "just");
    sfx.play.shiny();
    showRoomCard(h, found.size === ROOM.length ? "you found all five!! (finished: none of them. that's the tradition.)" : "ooh, shiny. new hobby!");
    if (found.size === ROOM.length) app.toast("🏆 all 5 hobbies found! 0 finished.");
    app.lumi.react("starry", `ooh, shiny. new hobby: ${h.name}!`);
  }
  function showRoomCard(h, line) {
    roomCard.hidden = false;
    roomCard.innerHTML = `<h3>${h.name}</h3>
      <p>${line ? `<b>Lumi:</b> ${line} ` : ""}${h.note}</p>
      ${h.progress === undefined ? "" : `<div class="progress"><span>progress</span><span class="progress-bar"><i style="--p:${h.progress}%"></i></span><span>${h.progress}%</span></div>`}
      ${h.id === "moons" ? `<button class="btn btn-gold small" data-paint data-sfx="none">🎨 paint with Lumi</button>` : ""}
      ${h.id === "beads" ? `<button class="btn btn-gold small" data-beads data-sfx="none">📿 string a necklace</button>` : ""}
      ${h.lullaby ? `<button class="btn btn-lilac small" data-lullaby data-sfx="none">${asleep ? "☀️ wake Lumi up" : "♪ play the lullaby"}</button>` : ""}
      ${h.pluck ? `<button class="btn btn-gold small" data-pluck data-sfx="none">🎸 pluck the string</button>` : ""}
      ${h.link ? `<a class="btn btn-lilac small" href="${h.link[0]}">${h.link[1]}</a>` : ""}`;
  }

  // pointer: the lantern follows a mouse and glides to wherever a finger taps
  const roomPoint = (e) => {
    const r = room.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  room.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch" && !bedtime) aimLamp(...roomPoint(e), .3); });
  room.addEventListener("pointerdown", (e) => {
    if (asleep) { wakeUp(); return; }
    if (!bedtime) aimLamp(...roomPoint(e), e.pointerType === "touch" ? .14 : .3);
  });
  roomHits.addEventListener("click", (e) => {
    const btn = e.target.closest(".hit");
    if (!btn) return;
    const h = PLACES.find(x => x.id === btn.dataset.hobby);
    if (SPOTS.includes(h)) { spot(h, true); showRoomCard(h); sfx.play.pop(); }
    else if (!found.has(h.id)) discover(h);
    else { showRoomCard(h); sfx.play.pop(); }
    if (h.pluck) pluckString();
  });
  // keyboard: tabbing onto a hobby carries the lantern to it
  roomHits.addEventListener("focusin", (e) => {
    const btn = e.target.closest(".hit");
    if (!btn || !btn.matches(":focus-visible")) return;
    if (bedtime) return;
    const [x, y, w, hh] = PLACES.find(h => h.id === btn.dataset.hobby).room;
    aimLamp((x + w / 2) / VB_W, (y + hh / 2) / VB_H, .2);
  });

  app.setRoomLights = (on) => {
    lightsOn = on;
    room.classList.toggle("lit", on || document.body.classList.contains("lit"));
    roomSwitch.textContent = on ? "🌙 lights off" : "💡 lights on";
    if (on) { ROOM.forEach(h => discover(h, true)); SPOTS.forEach(h => spot(h, true)); }
  };
  roomSwitch.addEventListener("click", () => {
    app.setRoomLights(!lightsOn);
    if (lightsOn) app.toast("hey! that's cheating. …okay, it is kind of nice in here.");
  });
  // ---------- bedtime: a music-box lullaby, and Lumi carries the lantern to bed as a night light ----------
  // Brahms' Lullaby (traditional, public domain), up an octave so it sounds like a music box
  const N = { D: 587.3, E: 659.3, F: 698.5, G: 784, A: 880, B: 987.8, C: 1046.5 };
  const LULLABY = [["E", .5], ["E", .5], ["G", 2], ["E", .5], ["E", .5], ["G", 2], ["E", .5], ["G", .5], ["C", 1], ["B", 1.5], ["A", .5],
    ["A", 1], ["G", 1], ["D", .5], ["E", .5], ["F", 1], ["D", 1], ["D", .5], ["E", .5], ["F", 2], ["D", .5], ["F", .5],
    ["B", .5], ["A", .5], ["G", 1], ["B", 1], ["C", 3]].map(([n, b]) => [N[n], b]);
  const BED = [203 / VB_W, 318 / VB_H];          // the lantern sits on the matchbox sleeve, Lumi on the pillow
  const roomLumi = $("#room-lumi");
  let bedtime = false, asleep = false, tune = null, tuneEnd = 0;
  const lullabyBtn = () => $("[data-lullaby]", roomCard);
  const lumiPicture = (mood) => { roomLumi.innerHTML = `<img src="${app.artURL(mood, true)}" alt="">`; };
  lumiPicture("curious");

  function lullaby() {
    if (bedtime) { wakeUp(); return; }
    bedtime = true;
    room.classList.add("bedtime");
    tune = sfx.music(LULLABY, .5);
    clearTimeout(tuneEnd);
    tuneEnd = setTimeout(() => { tune = null; }, ((tune && tune.seconds) || 0) * 1000 + 500);
    if (lullabyBtn()) lullabyBtn().textContent = "■ stop the lullaby";
    app.toast(tune ? "♪ Brahms' Lullaby, music-box edition" : "♪ (the sound is off, so Lumi hums it quietly)");
    // Lumi flies the lantern over to the matchbox, then curls up next to it
    lamp.arrive = () => { if (bedtime) fallAsleep(); };
    aimLamp(BED[0], BED[1], reduceMotion ? 1 : .06);
  }
  function fallAsleep() {
    asleep = true;
    lumiPicture("sleepy");
    room.classList.add("asleep");
    if (!lullabyBtn()) return;
    roomCard.querySelector("p").textContent = "zzz… Lumi fell asleep. the lantern stays on as a night light. (tap the attic to wake it.)";
    lullabyBtn().textContent = "☀️ wake Lumi up";
  }
  function wakeUp(quiet = false) {
    if (!bedtime) return;
    bedtime = asleep = false;
    lamp.arrive = null;
    if (tune) { tune.stop(); tune = null; }
    clearTimeout(tuneEnd);
    room.classList.remove("bedtime", "asleep");
    lumiPicture("curious");
    if (quiet) return;
    sfx.play.pop();
    if (lullabyBtn()) lullabyBtn().textContent = "♪ play the lullaby";
    app.toast("Lumi: *yawn* …i wasn't asleep. (i was asleep.)");
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-lullaby]")) lullaby(); });

  // ---------- the bead tray: string a necklace and Lumi wears it all over the site ----------
  const BEADS = [["#f6a9bd", "pink"], ["#e1707f", "berry"], ["#f4b68a", "peach"], ["#f6cf6a", "gold"],
    ["#a8d8a0", "mint"], ["#8fc3e8", "dew-drop blue"], ["#c9a7ea", "lilac"], ["#fffaf4", "pearl"]];
  let strung = [];
  function beadTray() {
    strung = (app.necklace() || []).slice();
    roomCard.hidden = false;
    roomCard.innerHTML = `<h3>string a necklace</h3>
      <p>tap the beads to string up to nine. Lumi wears it all over the site.</p>
      <div class="bead-maker">
        <div class="bead-lumi" id="bead-lumi"></div>
        <div>
          <div class="bead-colors" role="group" aria-label="Beads">${BEADS.map(([c, n]) =>
            `<button class="bead" data-bead="${c}" style="--c:${c}" aria-label="add a ${n} bead" data-sfx="none"></button>`).join("")}</div>
          <p class="bead-count" id="bead-count" aria-live="polite"></p>
          <div class="bead-actions">
            <button class="btn btn-outline small" data-bead-undo>↶ undo</button>
            <button class="btn btn-gold small" data-bead-wear data-sfx="none">✓ put it on Lumi</button>
            <button class="btn btn-outline small" data-bead-off>take it off</button>
          </div>
        </div>
      </div>`;
    showStrung();
  }
  function showStrung() {
    const lumi = $("#bead-lumi");
    if (!lumi) return;
    lumi.innerHTML = app.art("excited", false, strung);
    const worn = app.necklace(), same = worn && worn.join() === strung.join();
    $("#bead-count").textContent = same ? `Lumi is wearing this one (${strung.length} beads)` : strung.length ? `${strung.length} of 9 beads` : "no beads yet";
    $("[data-bead-undo]", roomCard).disabled = !strung.length;
    $("[data-bead-wear]", roomCard).disabled = !strung.length || same;
    $("[data-bead-off]", roomCard).hidden = !worn;
    app.look();
  }
  roomCard.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-beads]")) { beadTray(); return; }
    const bead = t.closest("[data-bead]");
    if (bead) {
      if (strung.length >= 9) { app.toast("nine beads is the limit. (Lumi's neck is very small.)"); return; }
      strung.push(bead.dataset.bead);
      sfx.play.plip();
      showStrung();
    } else if (t.closest("[data-bead-undo]")) {
      strung.pop();
      showStrung();
    } else if (t.closest("[data-bead-wear]")) {
      app.wear(strung);
      sfx.play.shiny();
      app.toast("📿 Lumi is wearing your necklace! (go and see it on the home screen)");
      app.lumi.react("love", "is this… for me?? i'm never taking it off. (finished hobby count: still 1.)", 4000);
      showStrung();
    } else if (t.closest("[data-bead-off]")) {
      app.wear(null);
      strung = [];
      app.toast("Lumi took the necklace off and put it back in the bead tray.");
      showStrung();
    }
  });
  addEventListener("lumi:wear", () => lumiPicture(asleep ? "sleepy" : "curious"));

  // ---------- the easel: paint with Lumi, and the painting goes up on the attic wall ----------
  // Each stroke is drawn solid on a "wet" layer shown see-through, then laid onto the paper at the same
  // strength when you lift the brush, so overlapping strokes darken like watercolour.
  const PAPER = "#fffdf6";
  const PAINTS = [["#f6cf6a", "moon gold"], ["#ee8196", "pink"], ["#8fc3e8", "sky blue"], ["#a993d6", "lilac"],
    ["#8fcf9a", "mint"], ["#4b3b7c", "midnight"], [PAPER, "eraser"]];
  const brush = { color: PAINTS[0][0], size: 7, at: null };
  const showArt = (url) => {
    if (!url) return;
    $("#rm-art-img").setAttribute("href", url);
    $("#rm-art").removeAttribute("display");
  };
  showArt(store.get("painting", null));
  function easel() {
    roomCard.hidden = false;
    roomCard.innerHTML = `<h3>paint with Lumi</h3>
      <p>paint anything. it goes up on the attic wall. (it doesn't have to be finished. nothing up here is.)</p>
      <div class="paint-wrap">
        <canvas class="paint-paper" id="paint-paper" role="img" aria-label="Painting paper: paint with your mouse or finger"></canvas>
        <canvas class="paint-wet" id="paint-wet" aria-hidden="true"></canvas>
      </div>
      <div class="paint-pots" role="group" aria-label="Paints">${PAINTS.map(([c, n]) =>
        `<button class="paint-pot${c === PAPER ? " eraser" : ""}" data-paint-color="${c}" style="--c:${c}" aria-label="${n}" aria-pressed="${c === brush.color}" data-sfx="none"></button>`).join("")}</div>
      <div class="bead-actions">
        <button class="btn btn-outline small" data-paint-size aria-pressed="${brush.size > 10}">big brush</button>
        <button class="btn btn-outline small" data-paint-clear>clear</button>
        <button class="btn btn-gold small" data-paint-hang data-sfx="none">🖼 hang it up</button>
      </div>`;
    const paper = $("#paint-paper"), wet = $("#paint-wet"), dpr = Math.min(2, devicePixelRatio || 1);
    const w = paper.clientWidth, h = Math.round(w * .75);
    for (const cv of [paper, wet]) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.getContext("2d").scale(dpr, dpr);
    }
    const pg = paper.getContext("2d"), wg = wet.getContext("2d");
    pg.fillStyle = PAPER;
    pg.fillRect(0, 0, w, h);
    const saved = store.get("painting", null);
    if (saved) { const im = new Image(); im.onload = () => pg.drawImage(im, 0, 0, w, h); im.src = saved; }
    const point = (e) => { const r = paper.getBoundingClientRect(); return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]; };
    const stroke = (a, b) => {
      wg.strokeStyle = brush.color;
      wg.lineWidth = brush.size;
      wg.lineCap = wg.lineJoin = "round";
      wg.beginPath();
      wg.moveTo(...a);
      wg.lineTo(...b);
      wg.stroke();
    };
    const dry = () => {
      if (!brush.at) return;
      brush.at = null;
      pg.globalAlpha = brush.color === PAPER ? 1 : .6;
      pg.drawImage(wet, 0, 0, w, h);
      pg.globalAlpha = 1;
      wg.clearRect(0, 0, w, h);
    };
    paper.addEventListener("pointerdown", (e) => {
      try { paper.setPointerCapture(e.pointerId); } catch { /* a pointer that is already gone */ }
      brush.at = point(e);
      stroke(brush.at, brush.at);
    });
    paper.addEventListener("pointermove", (e) => {
      if (!brush.at) return;
      const p = point(e);
      stroke(brush.at, p);
      brush.at = p;
    });
    paper.addEventListener("pointerup", dry);
    paper.addEventListener("pointercancel", dry);
    wet.style.opacity = brush.color === PAPER ? 1 : .6;
  }
  roomCard.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-paint]")) { easel(); sfx.play.pop(); return; }
    const pot = t.closest("[data-paint-color]");
    if (pot) {
      brush.color = pot.dataset.paintColor;
      roomCard.querySelectorAll("[data-paint-color]").forEach(b => b.setAttribute("aria-pressed", String(b === pot)));
      $("#paint-wet").style.opacity = brush.color === PAPER ? 1 : .6;
      sfx.play.plip();
    } else if (t.closest("[data-paint-size]")) {
      brush.size = brush.size > 10 ? 7 : 16;
      t.closest("[data-paint-size]").setAttribute("aria-pressed", String(brush.size > 10));
    } else if (t.closest("[data-paint-clear]")) {
      const paper = $("#paint-paper"), g = paper.getContext("2d");
      g.fillStyle = PAPER;
      g.fillRect(0, 0, paper.width, paper.height);
    } else if (t.closest("[data-paint-hang]")) {
      // a small copy is kept (and framed on the wall), so it fits in the browser's storage
      const small = document.createElement("canvas");
      small.width = 320;
      small.height = 240;
      small.getContext("2d").drawImage($("#paint-paper"), 0, 0, 320, 240);
      const url = small.toDataURL("image/jpeg", .85);
      store.set("painting", url);
      showArt(url);
      sfx.play.chime();
      app.toast("🖼 your painting is on the attic wall now. Lumi is very proud of you.");
      app.lumi.react("proud", "it's going on the wall. next to my unfinished things. it fits right in.", 4000);
    }
  });

  // ---------- dozing: leave the attic quiet for half a minute and Lumi falls asleep mid-hobby ----------
  let quietSince = Date.now();
  ["pointerdown", "pointermove", "keydown"].forEach(t => addEventListener(t, () => { quietSince = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (app.view() !== "room" || document.hidden || bedtime || Date.now() - quietSince < 30000) return;
    bedtime = asleep = true;
    lumiPicture("sleepy");
    room.classList.add("bedtime", "asleep");
    app.toast("zzz… Lumi fell asleep while working. classic. (tap the attic to wake it)", 5000);
  }, 3000);

  app.onView("room", () => { sizeRoom(); drawLamp(); }, () => wakeUp(true));
  addEventListener("resize", sizeRoom);
})();
