// Lumi's Attic 2: the same attic as a little diorama. The room is cut into flat layers at different depths;
// tilting the whole stage makes the near layers slide over the far ones. The lantern attic stays as it is.
(() => {
  "use strict";
  const { $, $$, sfx, store, restart, reduceMotion } = app;

  const VB_W = 600, VB_H = 520, PERSPECTIVE = 900;
  const star = (cx, cy, r, fill = "#f6cf6a", stroke = "#d9a93a") => {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * .45 : r;
      p.push((cx + Math.cos(a) * d).toFixed(1) + " " + (cy + Math.sin(a) * d).toFixed(1));
    }
    return `<path d="M${p.join("L")}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"/>`;
  };
  const leaf = (x, y, rot, s = 1) =>
    `<ellipse cx="0" cy="-9" rx="6" ry="11" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="#5f8a5a" stroke="#3f6a40" stroke-width="1.4"/>`;
  const svg = (inner) => `<svg style="overflow:visible" viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${inner}</svg>`;
  const glint = (list) => list.map(([x, y, r]) => star(x, y, r, "#fde9a6", "#fde9a6")).join("");

  // ---------- the layers, far to near ----------
  const wall = svg(`
    <defs>
      <linearGradient id="a2-wall" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="520"><stop offset="0" stop-color="#2d2250"/><stop offset=".55" stop-color="#5a3f55"/><stop offset="1" stop-color="#7a5348"/></linearGradient>
      <linearGradient id="a2-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1850"/><stop offset="1" stop-color="#3f3086"/></linearGradient>
      <radialGradient id="a2-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".85"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
    </defs>
    <rect x="-140" y="-140" width="880" height="800" fill="url(#a2-wall)"/>
    <g stroke="#2a1830" stroke-opacity=".28" stroke-width="2">${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 55 + 20} 0V440"/>`).join("")}</g>
    <path d="M-140 448H740V660H-140Z" fill="#5b3b3f"/>
    <rect x="-140" y="434" width="880" height="14" fill="#6b4528"/><path d="M-140 434H740" stroke="#8a5a32" stroke-width="3"/>
    <path d="M0 0H255L0 200Z" fill="#7a5538" stroke="#4a3020" stroke-width="3"/>
    <path d="M600 0H345L600 185Z" fill="#7a5538" stroke="#4a3020" stroke-width="3"/>
    <rect width="600" height="26" fill="#6b4528" stroke="#4a3020" stroke-width="3"/>
    <rect x="44" y="118" width="212" height="216" rx="6" fill="#7a5538" stroke="#4a3020" stroke-width="3"/>
    <rect x="58" y="132" width="184" height="188" fill="url(#a2-sky)"/>
    <path d="M170 160a32 32 0 1 0 22 54a26 26 0 1 1 -22 -54Z" fill="#fde9a6" stroke="#e8c76a" stroke-width="2"/>
    <g class="a2-twinkle">${glint([[92, 168, 7], [104, 262, 6], [212, 276, 5], [222, 184, 4]])}</g>
    <path d="M150 132V320M58 226H242" stroke="#7a5538" stroke-width="9"/>
    <rect x="40" y="326" width="220" height="14" rx="4" fill="#8a5a32" stroke="#4a3020" stroke-width="3"/>`);

  const curtains = svg(`
    <path d="M26 100C60 112 70 200 52 300C46 330 30 350 14 360C-6 300 -2 160 26 100Z" fill="#9a82d6" stroke="#6f58ae" stroke-width="3"/>
    <path d="M26 112C40 180 38 270 24 340" fill="none" stroke="#c1aef0" stroke-width="3" opacity=".6"/>
    <path d="M276 104C250 130 244 210 256 290C260 322 270 340 282 352C298 280 300 170 276 104Z" fill="#9a82d6" stroke="#6f58ae" stroke-width="3"/>
    <path d="M30 258C42 250 56 256 60 268" fill="none" stroke="#f6cf6a" stroke-width="5" stroke-linecap="round"/>
    <path d="M24 60C14 100 26 130 12 210" fill="none" stroke="#3f6a40" stroke-width="3"/>
    ${leaf(18, 90, -20, 1.1)}${leaf(34, 70, 20)}${leaf(8, 130, -40)}${leaf(20, 160, -10, .9)}${leaf(10, 196, -30, .8)}`);

  const shelf = svg(`
    <g transform="rotate(-7 300 109)"><rect x="258" y="78" width="84" height="62" fill="#f4e4cc" stroke="#c9a67a" stroke-width="2"/>
      <g id="a2-planet"><ellipse cx="300" cy="109" rx="20" ry="7.5" fill="none" stroke="#9a82d6" stroke-width="3" transform="rotate(-20 300 109)"/><circle cx="300" cy="109" r="12" fill="#c9a7ea" stroke="#9a82d6" stroke-width="2"/></g>
      <image id="a2-art" x="262" y="82" width="76" height="54" display="none" preserveAspectRatio="xMidYMid slice"/></g>
    <g transform="rotate(6 338 150)"><rect x="318" y="128" width="40" height="44" fill="#f6a9bd" stroke="#d27792" stroke-width="2"/>${star(338, 150, 11, "#fff6dc", "#e8c76a")}</g>
    <path d="M392 196H586" stroke="#6d4425" stroke-width="16" stroke-linecap="round"/><path d="M392 196H586" stroke="#a97a4c" stroke-width="10" stroke-linecap="round"/>
    <path d="M420 204V234M560 204V234" stroke="#6d4425" stroke-width="6"/>
    <rect x="506" y="108" width="64" height="15" rx="3" fill="#f2d488" stroke="#8a6a2a" stroke-width="2"/><text x="538" y="119" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="9" letter-spacing="1.5" fill="#4a3510">MUSEUM</text>
    <rect x="522" y="176" width="32" height="18" rx="2" fill="#fffdf6" stroke="#c9b49b" stroke-width="1.5"/><text x="538" y="189" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="12" fill="#a34063">?!</text>
    <path d="M506 196V168Q506 140 538 140Q570 140 570 168V196Z" fill="#e8f4fb" fill-opacity=".45" stroke="#9db7cf" stroke-width="3"/><circle cx="538" cy="136" r="4" fill="#9db7cf"/><path d="M514 170Q515 154 526 148" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>
    <g transform="translate(26 66)"><!-- the bead rack hangs lower and to the right, clear of the curtain, the jar and the museum shelf -->
    <rect x="272" y="184" width="122" height="9" rx="3" fill="#8a5a32" stroke="#4a3020" stroke-width="2"/>
    <rect x="286" y="192" width="8" height="12" rx="2" fill="#6d4425"/><rect x="372" y="192" width="8" height="12" rx="2" fill="#6d4425"/>
    <path d="M290 204Q333 286 376 204" fill="none" stroke="#c9a7ea" stroke-width="2"/>
    ${[.1, .21, .32, .43, .57, .68, .79, .9].map((t, i) => {
      const u = 1 - t, x = u * u * 290 + 2 * t * u * 333 + t * t * 376, y = u * u * 204 + 2 * t * u * 286 + t * t * 204;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="${["#f4a3b8", "#c9a7ea", "#8fc3e8", "#f6cf6a"][i % 4]}" stroke="#4a3020" stroke-opacity=".35" stroke-width="1.2"/><circle cx="${(x - 1.6).toFixed(1)}" cy="${(y - 1.8).toFixed(1)}" r="1.5" fill="#fff" opacity=".7"/>`;
    }).join("")}
    <path transform="translate(333 256) scale(2.1)" d="M0 -6 Q5 0 0 5 Q-5 0 0 -6Z" fill="#cfeafa" stroke="#8fc3e8" stroke-width="1.2"/></g>
    <rect x="418" y="104" width="62" height="90" rx="14" fill="#d8c6f3" fill-opacity=".55" stroke="#bda3e9" stroke-width="3"/>
    <rect x="426" y="90" width="46" height="16" rx="4" fill="#f4a3b8" stroke="#c97a92" stroke-width="2"/>
    <path d="M449 94c-18-18-34 2-6 8c-10 8 8 18 6-8c0 26 16 16 6 8c28-6 12-26-6-8Z" fill="#f48fae" stroke="#c97a92" stroke-width="2"/>
    <g class="a2-twinkle">${star(440, 160, 10)}${star(458, 134, 8)}${star(462, 172, 6)}${star(436, 126, 5)}</g>`);

  // things standing on the desk and its lower shelf; the desk itself is real 3D boxes (see desk below).
  // This layer stands at the middle of the desk top's depth (the slab runs from z 45 back to -45), so things sit on it, not in it
  const props = svg(`
    <rect x="30" y="414" width="64" height="12" rx="2" fill="#b79be8" stroke="#8068c0" stroke-width="2"/><rect x="34" y="402" width="58" height="12" rx="2" fill="#f4a3b8" stroke="#c97a92" stroke-width="2"/>
    <g transform="rotate(-10 62 342)"><rect x="18" y="326" width="84" height="30" rx="6" fill="#f7efe3" stroke="#c9b496" stroke-width="2"/>
      <circle cx="36" cy="338" r="6" fill="#c9a7ea"/><circle cx="54" cy="336" r="6" fill="#f4a3b8"/><circle cx="72" cy="338" r="6" fill="#f6cf6a"/><circle cx="88" cy="342" r="5" fill="#8fc3e8"/><circle cx="46" cy="349" r="5" fill="#a8d8a0"/></g>
    <rect x="130" y="320" width="30" height="36" rx="6" fill="#d8ecf3" fill-opacity=".7" stroke="#9cc3d1" stroke-width="2"/>
    <path d="M138 322L132 286M146 322L146 282M154 322L160 288" stroke="#8a5a32" stroke-width="5" stroke-linecap="round"/><path d="M132 290L130 280M146 286L146 276M160 292L162 282" stroke="#e1707f" stroke-width="5" stroke-linecap="round"/>
    <circle class="a2-pulse" cx="206" cy="326" r="52" fill="url(#a2-lamp)"/>
    ${star(206, 326, 24, "#fff1b8", "#e8c76a")}`);

  const stuff = svg(`
    <g transform="translate(-16 16) rotate(14 520 380)">
      <rect x="513" y="206" width="14" height="124" fill="#8a5a32"/><rect x="507" y="184" width="26" height="30" rx="6" fill="#6f4528"/>
      <ellipse cx="520" cy="352" rx="38" ry="36" fill="#8a5a32"/><ellipse cx="520" cy="408" rx="50" ry="48" fill="#8a5a32"/>
      <ellipse cx="520" cy="352" rx="34" ry="32" fill="#e0a466"/><ellipse cx="520" cy="408" rx="46" ry="44" fill="#e0a466"/>
      <circle cx="520" cy="372" r="13" fill="#4b2e1f"/>${star(498, 424, 6, "#f8b0bf", "#d27792")}
      <path d="M516 190V396M520 190V396M524 190V396" stroke="#fbf7ec" stroke-width="1.3"/>
    </g>
    <g transform="translate(111 -8)">
      <path d="M404 470q40 8 88 0v10q-44 10-88 0Z" fill="#c9a7ea" stroke="#9a82d6" stroke-width="2"/>
      <circle cx="440" cy="448" r="36" fill="#f48fae" stroke="#c4577b" stroke-width="3"/>
      <path d="M411 440q29 12 58-6M408 454q32 12 64-4M418 424q22 10 46 5M422 472q22 6 40-6" fill="none" stroke="#fbc0d0" stroke-width="3" stroke-linecap="round"/>
      <path d="M404 468q-26 10 -52 2" fill="none" stroke="#f48fae" stroke-width="4" stroke-linecap="round"/>
    </g>`);

  // The floor is a real plane lying down (rotated 90 degrees, running from the back wall toward you), and the rug
  // lies on it, so tilting the room moves them together. Its top edge is the foot of the wall.
  const ground = `<div class="a2-plane" style="transform:translateZ(-130px) rotateX(90deg)"><div class="a2-rug"></div></div>`;

  const lights = svg(`
    <path d="M-10 36Q150 92 300 48T610 70" fill="none" stroke="#4a3020" stroke-width="2.5"/>
    <g class="a2-twinkle">${[[60, 66], [150, 80], [240, 70], [330, 56], [420, 58], [500, 68], [570, 76]].map(([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="7" fill="${i % 2 ? "#ffd7e2" : "#fff1b8"}" stroke="#e8c76a" stroke-width="1.5"/>`).join("")}</g>
    <path d="M390 58V108" stroke="#4a3020" stroke-width="2"/>${star(390, 126, 18, "#fff1b8", "#e8c76a")}
    <path d="M598 150C566 200 590 250 572 330" fill="none" stroke="#3f6a40" stroke-width="3"/>
    ${leaf(590, 168, 30, 1.1)}${leaf(574, 204, -30)}${leaf(588, 244, 30, .9)}${leaf(572, 290, -20)}${leaf(580, 320, 20, .8)}`);

  // The desk is built, not drawn: boxes with a front, sides and a top, so tilting the room shows its depth.
  // x, y, w, h are % of the stage; z is the front face's depth and d how far the box runs back (px)
  const box = ({ x, y, w, h, z, d, cls = "" }) =>
    `<div class="a2-box ${cls}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;transform:translateZ(${z}px)"><i class="f fr"></i><i class="f bk" style="transform:translateZ(${-d}px)"></i><i class="f lf" style="width:${d}px"></i><i class="f rt" style="width:${d}px"></i><i class="f tp" style="height:${d}px"></i></div>`;
  const desk = [
    box({ x: 2.2, y: 71.7, w: 2.2, h: 20.4, z: -32, d: 10, cls: "leg" }),
    box({ x: 39.8, y: 71.7, w: 2.2, h: 20.4, z: -32, d: 10, cls: "leg" }),
    box({ x: 4.4, y: 71.7, w: 35.4, h: 20.4, z: -40, d: 2, cls: "gap" }),
    box({ x: 3, y: 81.9, w: 39, h: 1.8, z: 38, d: 78, cls: "shelf" }),
    box({ x: 21, y: 72, w: 18, h: 8, z: 36, d: 70, cls: "drawer" }),
    box({ x: 2.2, y: 71.7, w: 2.2, h: 20.4, z: 38, d: 10, cls: "leg" }),
    box({ x: 39.8, y: 71.7, w: 2.2, h: 20.4, z: 38, d: 10, cls: "leg" }),
    box({ x: -3, y: 68.5, w: 46.6, h: 3.2, z: 45, d: 90, cls: "slab" }),
  ].join("");

  // z in px (negative is farther away); hits are [id, name, left%, top%, width%, height%]
  const LAYERS = [
    { z: -130, html: wall, cls: "a2-wall", hits: [["window", "the window", 7, 23, 35, 40]] },
    { z: -105, html: curtains, cls: "a2-curtains" },
    { z: -70, html: shelf, cls: "a2-shelf", hits: [["jar", "resin jar of stars", 68, 16, 14, 24], ["museum", "museum of useless facts", 83.5, 20, 12.5, 18], ["beads", "dew-drop beads", 49.3, 47.7, 21, 17]] },
    { z: -57, html: desk, cls: "a2-desk" },
    { z: -10, html: props, cls: "a2-props", hits: [["moons", "watercolor moons", 2, 60, 24, 12]] },
    { z: -25, html: stuff, cls: "a2-stuff", hits: [["guitar", "the guitar", 73.5, 55, 22, 30]] },
    { z: 0, html: ground, cls: "a2-ground" },
    { z: 60, html: lights, cls: "a2-front" },
  ];
  const LUMI_Z = 25;
  const zoom = (z) => ((PERSPECTIVE - z) / PERSPECTIVE).toFixed(4);

  // Lumi's five hobbies (the same ones as in the lantern attic, written out here so Attic 2 stands on its own);
  // the window is a bonus spot and doesn't count. The guitar's text grows with its strings (see attic2-quests.js).
  const HOBBY_IDS = ["moons", "jar", "beads", "guitar", "museum"];
  const HOBBIES = {
    moons: { name: "watercolor moons", progress: 40, note: "painted three moons. two came out looking like lemons. the third is still a pencil circle." },
    jar: { name: "resin jar of stars", progress: 30, note: "poured the resin. forgot the stars. added the stars. the resin had already set. one star lives on the lid now." },
    beads: { name: "dew-drop bead jewellery", progress: 15, note: "strung three dew drops. they evaporated by morning. switched to glass beads, then lost the needle." },
    guitar: { name: "the guitar (one string)", progress: 5, note: "learned one string. it is a very good string. the other five are 'coming soon'." },
    museum: { name: "museum of useless facts", progress: 99, note: "the only hobby that grows by itself. it can never be finished, because new facts keep happening." },
  };
  const FACTS = [
    "The very first website is still online, at info.cern.ch. It went up in 1991.",
    "The first webcam watched a coffee pot at the University of Cambridge, so people could check if there was any coffee left.",
    "Adult luna moths have no working mouths, so they never eat. Lumi finds this horrifying.",
    "Moth “dust” is really tiny scales. Lepidoptera, the name for moths and butterflies, means “scale wing”.",
    "Some tiger moths can jam a bat's sonar with clicks of their own.",
    "Moths smell with their antennae. Lumi's antennae mostly glow.",
    "Octopuses have three hearts.",
    "A day on Venus is longer than a year on Venus.",
    "Wombats make cube-shaped poop.",
    "The dot over a lowercase i or j is called a tittle.",
    "Bananas are berries. Strawberries are not.",
    "Sea otters sometimes hold paws while they sleep, so they don't drift apart.",
    "Watercolor paint is held together by gum arabic, a sap from acacia trees.",
    "A group of owls is called a parliament. A group of night owls is called a hackathon. (Lumi made that one up.)",
  ];
  const WINDOW = ["the window", "out there: the whole night sky, and (Lumi is sure of it) a few space critters who can't find their way home."];
  const ACTIONS = {
    moons: `<button class="btn btn-gold small" data-a2-paint data-sfx="none">🎨 paint with Lumi</button>`,
    beads: `<a class="btn btn-gold small" href="#dress">📿 dress up Lumi ›</a>`,
    guitar: `<button class="btn btn-gold small" data-a2-pluck data-sfx="none">🎸 pluck the string</button><button class="btn btn-lilac small" data-a2-lesson-open data-sfx="none">🎶 guitar lesson</button>`,
    museum: `<button class="btn btn-lilac small" data-a2-fact data-sfx="none">another fact</button><a class="btn btn-lilac small" href="#facts">visit the museum ›</a>`,
    jar: `<button class="btn btn-gold small" data-a2-shake data-sfx="none">✨ shake the jar</button>`,
    window: `<button class="btn btn-gold small" data-a2-space data-sfx="none">🛸 fly out the window</button>`,
  };

  const stage = $("#a2-stage"), world = $("#a2-world"), tilt = $("#a2-tilt"), card = $("#a2-card"), count = $("#a2-found"), pips = $("#a2-pips");
  const saved = store.get("attic2", []);
  const found = new Set((Array.isArray(saved) ? saved : []).map(id => id === "paints" ? "moons" : id).filter(id => HOBBY_IDS.includes(id)));

  tilt.innerHTML = LAYERS.map(l => {
    const hits = (l.hits || []).map(([id, name, x, y, w, h]) =>
      `<button class="a2-hit" data-spot="${id}" data-sfx="none" aria-label="${name}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"><span class="a2-tag">${name}</span></button>`).join("");
    return `<div class="a2-layer ${l.cls}" style="transform:translateZ(${l.z}px) scale(${zoom(l.z)})">${l.html}${hits}</div>`;
  }).join("");
  const lumi = document.createElement("div");
  lumi.className = "a2-lumi";
  lumi.setAttribute("aria-hidden", "true");
  lumi.style.transform = `translateZ(${LUMI_Z}px) scale(${zoom(LUMI_Z)})`;
  lumi.innerHTML = `<span class="a2-roam"><span class="a2-glow" aria-hidden="true"></span><span class="a2-shade" aria-hidden="true"></span><span class="a2-hover"></span></span>`;
  tilt.insertBefore(lumi, tilt.querySelector(".a2-front"));
  const roam = lumi.firstChild, hover = roam.lastChild;

  // the painting from the easel goes up in the frame on the wall (the browser keeps one painting, so a painting
  // hung in the lantern attic shows up here too)
  const hang = (url) => {
    if (!url) return;
    $("#a2-art", tilt).setAttribute("href", url);
    $("#a2-art", tilt).removeAttribute("display");
    $("#a2-planet", tilt).setAttribute("display", "none");
  };

  // ---------- Lumi: she follows the pointer like the lantern does in the dark attic ----------
  // she is only a cursor: clicks go through her to whatever she is standing in front of
  const MOODS = { moons: "happy", jar: "surprised", beads: "love", guitar: "excited", museum: "curious", window: "starry" };
  let mood = "", lastMove = 0, wander = 0, calm = 0;
  const feel = (m) => { if (m !== mood) { mood = m; hover.innerHTML = app.art(m, true); } };
  const react = (id) => {
    feel(MOODS[id]);
    clearTimeout(calm);
    calm = setTimeout(() => feel("starry"), 4200);
  };
  feel("starry");
  // a necklace strung on the dress-up page shows up here too
  addEventListener("lumi:wear", () => { const m = mood; mood = ""; feel(m); });

  // where she is, as a pixel offset from her home spot; she eases toward where the pointer is
  const me = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
  const glide = () => {
    const k = reduceMotion ? 1 : .1;
    me.x += (me.tx - me.x) * k;
    me.y += (me.ty - me.y) * k;
    roam.style.translate = `${me.x.toFixed(1)}px ${me.y.toFixed(1)}px`;
    me.raf = Math.abs(me.tx - me.x) + Math.abs(me.ty - me.y) > .3 ? requestAnimationFrame(glide) : 0;
  };
  // fx, fy: where to go, as fractions of the world
  const follow = (fx, fy) => {
    const W = world.clientWidth, H = world.clientHeight, w = lumi.offsetWidth, h = lumi.offsetHeight;
    if (!w) return;
    const cx = Math.max(w * .35, Math.min(W - w * .35, fx * W));
    const cy = Math.max(h * .4, Math.min(H - h * .5, fy * H - h * .1));
    me.tx = cx - (lumi.offsetLeft + w / 2);
    me.ty = cy - (lumi.offsetTop + h / 2);
    if (!me.raf) me.raf = requestAnimationFrame(glide);
  };
  const frac = (e) => {
    const r = world.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  const render = () => {
    count.textContent = found.size;
    pips.innerHTML = HOBBY_IDS.map(id => `<i class="${found.has(id) ? "on" : ""}"></i>`).join("");
    $$(".a2-hit", tilt).forEach(b => b.classList.toggle("found", found.has(b.dataset.spot)));
  };
  let intro = false; // the welcome card goes away by itself on a phone, where it would cover the room
  const say = (title, text, extra = "") => {
    intro = false;
    card.hidden = false;
    card.innerHTML = `<h2>${title}</h2><p>${text}</p>${extra}`;
    restart(card, "pop");
  };
  const bar = (p) => `<div class="progress"><span>progress</span><span class="progress-bar"><i style="--p:${p}%"></i></span><span>${p}%</span></div>`;
  // the museum card shows a fact right here
  const newFact = () => { const el = $(".a2-fact", card); if (el) el.textContent = `“${FACTS[Math.floor(Math.random() * FACTS.length)]}”`; };
  const open = (id) => {
    const h = id === "guitar" ? { ...HOBBIES.guitar, ...app.a2guitar() } : HOBBIES[id], fresh = !!h && !found.has(id);
    if (h) {
      found.add(id);
      store.set("attic2", [...found]);
      render();
    }
    const [name, note] = h ? [h.name, h.note] : WINDOW;
    const all = fresh && found.size === HOBBY_IDS.length;
    react(id);
    say(name, note, (all ? `<p class="a2-all">⭐ you found all five!! (finished: none of them. that's the tradition.)</p>` : "")
      + (id === "museum" ? `<p class="a2-fact"></p>` : "")
      + (h ? bar(h.progress) : "") + (ACTIONS[id] ? `<div class="bead-actions">${ACTIONS[id]}</div>` : ""));
    if (id === "museum") newFact();
    sfx.play.plip();
    if (all) { sfx.play.shiny(); app.lumi.react("happy", "you found everything!! the attic has never been so seen.", 3200); }
  };

  // ---------- phones: the room is bigger than the screen; you drag to look around and tap to send Lumi ----------
  const phone = matchMedia("(max-width: 719px), (max-height: 520px)");
  const pan = { x: 0, y: 0 };
  let drag = null, dragged = false;
  const setPan = (x, y) => {
    const minX = stage.clientWidth - world.offsetWidth, minY = stage.clientHeight - world.offsetHeight;
    pan.x = Math.min(0, Math.max(minX, x));
    pan.y = Math.min(0, Math.max(minY, y));
    world.style.translate = `${pan.x.toFixed(1)}px ${pan.y.toFixed(1)}px`;
    // where you are looking leans the room, so dragging shows its depth the way the mouse does
    if (!reduceMotion) aim(((minX < 0 ? pan.x / minX : .5) - .5) * 14, -((minY < 0 ? pan.y / minY : .5) - .5) * 9);
  };
  // the camera starts on Lumi
  const recenter = () => {
    if (!phone.matches) { pan.x = pan.y = 0; world.style.translate = ""; return; }
    setPan(stage.clientWidth / 2 - (lumi.offsetLeft + lumi.offsetWidth / 2 + me.x), stage.clientHeight * .45 - (lumi.offsetTop + lumi.offsetHeight / 2 + me.y));
  };

  tilt.addEventListener("click", (e) => {
    if (dragged) { dragged = false; return; } // the end of a drag is not a tap
    const spot = e.target.closest("[data-spot]");
    if (spot) open(spot.dataset.spot);
  });
  // the paint easel and the guitar lessons open right here, in this card
  card.addEventListener("click", (e) => {
    if (e.target.closest("[data-a2-paint]")) {
      sfx.play.pop();
      app.a2quests.paint(hang);
    } else if (e.target.closest("[data-a2-lesson-open]")) {
      sfx.play.pop();
      app.a2quests.lesson();
    } else if (e.target.closest("[data-a2-pluck]")) {
      app.a2quests.pluck();
    } else if (e.target.closest("[data-a2-fact]")) {
      sfx.play.pop();
      newFact();
    } else if (e.target.closest("[data-a2-shake]")) {
      sfx.play.shiny();
      app.toast("✨ a star fell out. Lumi put it back. the thumbprint stays.");
      app.lumi.react("surprised", "did the jar just wink?", 2600);
    } else if (e.target.closest("[data-a2-space]")) {
      sfx.play.shiny();
      app.secret("space");
      app.game.toSpace();
      app.toast("🛸 Lumi flew out of the window!");
      location.hash = "#play";
    }
  });
  $("#a2-x").addEventListener("click", () => { card.hidden = true; });
  // keyboard: tabbing onto a thing brings Lumi to it
  tilt.addEventListener("focusin", (e) => {
    const b = e.target.closest(".a2-hit");
    if (!b || !b.matches(":focus-visible")) return;
    const s = world.getBoundingClientRect(), r = b.getBoundingClientRect();
    lastMove = Date.now();
    follow((r.left + r.width / 2 - s.left) / s.width, (r.top + r.height / 2 - s.top) / s.height);
  });

  // ---------- tilt: the pointer leans the room; with no pointer it sways slowly on its own ----------
  const LEAN = -5; // the room always leans a little, so you look down onto the desk and the rug
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const frame = () => {
    cx += (tx - cx) * .12;
    cy += (ty - cy) * .12;
    tilt.style.transform = `rotateX(${(cy + LEAN).toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg)`;
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .02 ? requestAnimationFrame(frame) : 0;
  };
  const aim = (x, y) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(frame); };
  stage.addEventListener("pointerdown", (e) => {
    lastMove = Date.now();
    dragged = false;
    if (phone.matches) drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    else follow(...frac(e));
  });
  stage.addEventListener("pointermove", (e) => {
    lastMove = Date.now();
    if (phone.matches) {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!dragged && Math.hypot(dx, dy) < 8) return;
      dragged = true;
      stage.classList.add("steered");
      setPan(drag.px + dx, drag.py + dy);
      return;
    }
    const [fx, fy] = frac(e);
    follow(fx, fy);
    if (reduceMotion) return;
    aim((fx - .5) * 14, -(fy - .5) * 9);
    stage.classList.add("steered");
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    if (!dragged && e.type === "pointerup") follow(...frac(e)); // a tap sends Lumi there
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("pointerleave", () => { if (phone.matches) return; aim(0, 0); stage.classList.remove("steered"); });
  addEventListener("resize", () => { if (app.view() === "attic2") recenter(); });

  aim(0, 0); // sets the resting lean
  // with nobody steering she wanders the rug
  const RUG = [[.3, .8], [.5, .82], [.7, .8], [.4, .74], [.62, .76]];
  const stroll = () => {
    if (document.hidden || Date.now() - lastMove < 6000) return;
    follow(...RUG[Math.floor(Math.random() * RUG.length)]);
  };

  app.onView("attic2", () => {
    hang(store.get("painting", null));
    render();
    recenter();
    if (card.hidden || !card.innerHTML.trim()) say("look around", phone.matches
      ? "drag to look around. tap to send Lumi flying. tap the glowing things to find her five hobbies. (the window is a bonus.)"
      : "move around and Lumi follows. tap the glowing things to find her five hobbies. (the window is a bonus.)");
    if (card.querySelector("h2")?.textContent === "look around") {
      intro = true;
      if (phone.matches) setTimeout(() => { if (intro) card.hidden = true; }, 6000);
    }
    app.look();
    if (!reduceMotion && !wander) wander = setInterval(stroll, 5200);
  }, () => { aim(0, 0); stage.classList.remove("steered"); clearInterval(wander); wander = 0; app.a2quests.stop(); });
})();
