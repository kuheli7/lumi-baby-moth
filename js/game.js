// Star Catch: Lumi catches falling stars for its lantern. Five short levels. The space level is not one of them:
// it is a quest that only opens from the window in Lumi's attic (stars are lost space critters, raindrops are space rocks).
// The game logic (update) and the drawing (draw) are kept apart; the loop only runs while a level is being played.
(() => {
  "use strict";
  const { $, sfx, store } = app;

  // speeds are in pixels per second for a 480px-tall play area, and scale with its real height
  const LEVELS = [
    { name: "First Light", goal: 8, speed: 115, every: 950, rain: 0, cookie: 0, wind: 0,
      intro: "Catch 8 falling stars for Lumi's lantern." },
    { name: "Drizzle", goal: 10, speed: 135, every: 820, rain: .25, cookie: 0, wind: 0,
      intro: "Raindrops now! Dodge them. Three drops and Lumi flops." },
    { name: "Cookie Clouds", goal: 12, speed: 150, every: 740, rain: .3, cookie: .08, wind: 0,
      intro: "Cookies are falling too. Catch one to heal a heart." },
    { name: "Windy Night", goal: 14, speed: 158, every: 700, rain: .3, cookie: .08, wind: 70,
      intro: "The wind pushes everything sideways. Hold on to your antennae!" },
    { name: "Starstorm", goal: 18, speed: 185, every: 590, rain: .36, cookie: .1, wind: 40,
      intro: "The big one. Fill the lantern with 18 stars!" },
    { name: "Space Critters", space: true, goal: 10, speed: 125, every: 860, rain: .3, cookie: .08, wind: 0,
      intro: "Out of the window and up, up, up! Little space critters are lost in the dark. Catch them in the lantern light to guide them home, and dodge the space rocks." },
  ];
  const LANTERN = 4;   // clearing Starstorm fills the lantern: the end of the game
  const SKY = LEVELS.findIndex(L => L.space);   // the levels before this one are the game; the space level is the attic's quest

  const game = $("#game"), canvas = $("#game-canvas"), g = canvas.getContext("2d"), sprite = $("#game-lumi");
  const hud = $("#hud"), hudLevel = $("#hud-level"), hudStars = $("#hud-stars"), hudHearts = $("#hud-hearts"), pauseBtn = $("#game-pause");
  const card = $("#game-card"), cardArt = $("#game-card-art"), cardTitle = $("#game-card-title"), cardText = $("#game-card-text"), goBtn = $("#game-go");
  const levelsEl = $("#levels"), helpCatch = $("#help-catch"), helpDodge = $("#help-dodge"), playSub = $("#play-sub");

  let unlocked = Math.max(1, Math.min(SKY, store.get("game.unlocked", 1)));
  const isOpen = (i) => i < unlocked;
  let spaceFrom = "#room";   // where the space level goes back to: the attic it was entered from
  let arriving = false;      // true only when the attic window has just sent Lumi here
  const cleared = new Set(store.get("game.cleared", []));
  const S = {
    level: unlocked - 1, state: "menu", items: [], sparks: [],
    x: .5, tx: .5, caught: 0, hearts: 3, spawn: 0, t: 0, flash: 0, flashMood: "", shake: 0, raf: 0, last: 0,
    keys: { left: false, right: false }, dragging: false,
  };
  let W = 0, H = 0, dpr = 1;

  // a few background stars, placed once
  const sky = Array.from({ length: 34 }, (_, i) => ({ x: (i * 97 % 101) / 101, y: (i * 61 % 89) / 89 * .8, r: .6 + (i % 3) * .45, p: i }));

  // ---------- the sprite: a still picture of Lumi, swapped per mood ----------
  let spriteMood = "";
  const setSprite = (m) => { if (m !== spriteMood) { spriteMood = m; sprite.src = app.artURL(m, true); } };
  addEventListener("lumi:wear", () => { const m = spriteMood; spriteMood = ""; if (m) setSprite(m); });
  const spriteW = () => Math.min(W * .26, 132);
  const placeSprite = () => {
    const w = spriteW(), shake = S.shake > 0 ? Math.sin(S.t * 60) * 4 : 0;
    sprite.style.width = w + "px";
    sprite.style.transform = `translateX(${(S.x * W - w / 2 + shake).toFixed(1)}px)`;
  };

  // ---------- HUD, level buttons and the message card ----------
  function renderLevels() {
    levelsEl.innerHTML = LEVELS.slice(0, SKY).map((L, i) => {
      const locked = !isOpen(i);
      return `<button class="level-btn" data-level="${i}" aria-pressed="${i === S.level}" ${locked ? "disabled" : ""}
        aria-label="Level ${i + 1}: ${L.name}${locked ? " (locked)" : cleared.has(i) ? " (cleared)" : ""}">
        ${locked ? "🔒" : i + 1}${cleared.has(i) ? `<span class="done" aria-hidden="true">★</span>` : ""}<small>${L.name}</small></button>`;
    }).join("");
  }
  function renderHud() {
    const L = LEVELS[S.level];
    hudLevel.textContent = L.space ? "space" : `level ${S.level + 1}`;
    hudStars.textContent = `${L.space ? "🛸" : "★"} ${S.caught}/${L.goal}`;
    hudHearts.textContent = "♥".repeat(S.hearts) + "♡".repeat(3 - S.hearts);
    hudHearts.setAttribute("aria-label", `${S.hearts} hearts left`);
  }
  function showCard(mood, title, text, button) {
    card.hidden = false;
    cardArt.src = app.artURL(mood);
    cardTitle.textContent = title;
    cardText.textContent = text;
    goBtn.textContent = button;
    hud.hidden = S.state === "menu";
    if (app.view() === "play") goBtn.focus({ preventScroll: true });
  }

  // ---------- states ----------
  function toMenu(i = S.level) {
    stop();
    S.level = i;
    S.state = "menu";
    S.items = []; S.sparks = []; S.x = S.tx = .5;
    renderLevels();
    setSprite("curious");
    placeSprite();
    const L = LEVELS[i];
    game.classList.toggle("space", !!L.space);
    levelsEl.style.display = L.space ? "none" : "";   // the space level is a quest from the attic, not a level in the list
    helpCatch.textContent = L.space ? "space critters" : "★";
    helpDodge.textContent = L.space ? "space rocks" : "raindrops";
    playSub.textContent = L.space ? "guide the lost space critters home" : "help Lumi catch falling stars for its lantern";
    draw();
    showCard("curious", L.space ? L.name : `Level ${i + 1}: ${L.name}`, L.intro, "start ▸");
  }
  function startLevel() {
    S.state = "playing";
    S.items = []; S.sparks = [];
    S.caught = 0; S.hearts = 3; S.spawn = 0; S.flash = 0; S.shake = 0;
    card.hidden = true;
    hud.hidden = false;
    renderHud();
    setSprite("determined");
    // make sure the whole play area (and Lumi at the bottom of it) is on screen, clear of the tab bar
    game.scrollIntoView({ block: "nearest", behavior: app.reduceMotion ? "auto" : "smooth" });
    run();
  }
  function pause() {
    if (S.state !== "playing") return;
    S.state = "paused";
    stop();
    showCard("thinking", "Paused", "Lumi is waiting very patiently. (Lumi is not patient.)", "keep going ▸");
  }
  function resume() {
    S.state = "playing";
    card.hidden = true;
    run();
  }
  function win() {
    S.state = "won";
    stop();
    cleared.add(S.level);
    store.set("game.cleared", [...cleared]);
    const L = LEVELS[S.level];
    if (S.level < SKY - 1 && unlocked < S.level + 2) { unlocked = S.level + 2; store.set("game.unlocked", unlocked); }
    renderLevels();
    setSprite("proud");
    sfx.play.chime();
    if (L.space) {
      app.lumi.react("starry", "i guided ten space critters home!! they said 'blorp'. i think it means thank you.", 4000);
      showCard("starry", "Every critter got home! 🛸", "The space critters waved all of their antennae goodbye. Lumi saved the night (very gently).", "back to the attic");
    } else if (S.level === LANTERN) {
      app.lumi.react("proud", "i FINISHED a game!! all five levels. that counts as finishing something.", 4000);
      showCard("happy", "The lantern is full!", "You caught the whole sky. Lumi finished something!!", "play again from level 1");
    } else {
      showCard("proud", "Level complete! ✨", `Lumi caught ${S.caught} stars. Level ${S.level + 2} is open.`, "next level ▸");
    }
  }
  function lose() {
    S.state = "lost";
    stop();
    setSprite("flop");
    sfx.play.flop();
    showCard("flop", "Lumi flopped x_x", `Too many ${LEVELS[S.level].space ? "space rocks" : "raindrops"}. A cookie will fix it.`, "🍪 give a cookie & try again");
  }

  goBtn.addEventListener("click", () => {
    if (S.state === "menu") startLevel();
    else if (S.state === "paused") resume();
    else if (S.state === "won") {
      if (LEVELS[S.level].space) { toMenu(0); location.hash = spaceFrom; }
      else toMenu(S.level < LANTERN ? S.level + 1 : 0);
    }
    else if (S.state === "lost") { sfx.play.munch(); startLevel(); }
  });
  pauseBtn.addEventListener("click", pause);
  levelsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".level-btn");
    if (b && !b.disabled) toMenu(+b.dataset.level);
  });

  // ---------- the loop ----------
  function run() {
    S.last = performance.now();
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(S.raf); S.raf = 0; }
  function frame(now) {
    // cap the step so a slow frame (or a tab coming back) can't jump the game ahead
    const dt = Math.min(.05, (now - S.last) / 1000);
    S.last = now;
    update(dt);
    draw();
    if (S.state === "playing") S.raf = requestAnimationFrame(frame);
  }

  const scale = () => H / 480;
  function spawn(L) {
    const r = Math.random();
    const type = r < L.rain ? "rain" : r < L.rain + L.cookie ? "cookie" : "star";
    S.items.push({
      type, x: W * (.08 + Math.random() * .84), y: -20,
      vy: L.speed * scale() * (.85 + Math.random() * .3) * (type === "rain" ? 1.15 : 1),
      p: Math.random() * 6.28, size: (type === "star" ? 13 : 11) * Math.max(.8, Math.min(1.3, scale())), c: Math.floor(Math.random() * CRITTERS.length),
    });
  }
  function update(dt) {
    const L = LEVELS[S.level];
    S.t += dt;
    // move: keys push the target, pointers set it; Lumi glides after it
    const dir = (S.keys.right ? 1 : 0) - (S.keys.left ? 1 : 0);
    if (dir) S.tx = Math.max(.06, Math.min(.94, S.tx + dir * 1.15 * dt));
    S.x += (S.tx - S.x) * Math.min(1, dt * 14);

    S.spawn -= dt * 1000;
    if (S.spawn <= 0) { spawn(L); S.spawn = L.every * (.8 + Math.random() * .4); }

    const w = spriteW(), cx = S.x * W, top = H * .96 - w;
    const gust = L.wind * scale() * Math.sin(S.t * .9);
    for (const it of S.items) {
      it.y += it.vy * dt;
      if (L.wind) it.x = Math.max(12, Math.min(W - 12, it.x + (gust + Math.sin(S.t * 2 + it.p) * 12) * dt));
      // caught when it reaches Lumi's head-to-lantern zone, close enough to the middle
      if (!it.done && it.y > top + w * .12 && it.y < top + w * .74 && Math.abs(it.x - cx) < w * .36) {
        it.done = true;
        hit(it);
      }
    }
    S.items = S.items.filter(it => !it.done && it.y < H + 30);
    for (const s of S.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt; s.life -= dt * 1.8; }
    S.sparks = S.sparks.filter(s => s.life > 0);

    if (S.flash > 0 && (S.flash -= dt) <= 0) setSprite(S.state === "playing" ? "determined" : spriteMood);
    if (S.shake > 0) S.shake -= dt;
    placeSprite();
  }
  function burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = 60 + Math.random() * 90;
      S.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 1, color });
    }
  }
  function flash(mood, s) { S.flash = s; setSprite(mood); }
  function hit(it) {
    const L = LEVELS[S.level];
    if (it.type === "star") {
      S.caught++;
      sfx.play.catch();
      burst(it.x, it.y, LEVELS[S.level].space ? CRITTERS[it.c] : "#f6cf6a");
      flash("excited", .35);
      renderHud();
      if (S.caught >= L.goal) win();
    } else if (it.type === "cookie") {
      S.hearts = Math.min(3, S.hearts + 1);
      sfx.play.munch();
      burst(it.x, it.y, "#e8b07a", 8);
      flash("fed", .6);
      renderHud();
    } else {
      S.hearts--;
      sfx.play.plip();
      burst(it.x, it.y, "#9fd0f5", 8);
      S.shake = .35;
      flash("hurt", .7);
      renderHud();
      if (S.hearts <= 0) lose();
    }
  }

  // ---------- drawing ----------
  function star(x, y, s, rot) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.beginPath();
    g.moveTo(0, -s);
    g.quadraticCurveTo(s * .18, -s * .18, s, 0);
    g.quadraticCurveTo(s * .18, s * .18, 0, s);
    g.quadraticCurveTo(-s * .18, s * .18, -s, 0);
    g.quadraticCurveTo(-s * .18, -s * .18, 0, -s);
    g.fill();
    g.restore();
  }
  // a soft golden glow behind each star, drawn once and stamped
  const GLOW = (() => {
    const c = document.createElement("canvas"), x = c.getContext("2d");
    c.width = c.height = 64;
    const grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 236, 160, .7)");
    grad.addColorStop(.4, "rgba(255, 214, 110, .28)");
    grad.addColorStop(1, "rgba(255, 214, 110, 0)");
    x.fillStyle = grad;
    x.fillRect(0, 0, 64, 64);
    return c;
  })();
  // the space level: friendly round critters with antennae, and lumpy space rocks with a warm tail
  const CRITTERS = ["#a8e0b0", "#c9b2f0", "#f8b0c4", "#9fd3f0"];
  function critter(it) {
    const s = it.size * 1.05, x = it.x, y = it.y + Math.sin(S.t * 5 + it.p) * 2, c = CRITTERS[it.c];
    const r = s * 2.3;
    g.globalAlpha = .55;
    g.drawImage(GLOW, x - r, y - r, r * 2, r * 2);
    g.globalAlpha = 1;
    g.strokeStyle = c;
    g.lineWidth = 2.2;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - s * .35, y - s * .7); g.lineTo(x - s * .62, y - s * 1.3);
    g.moveTo(x + s * .35, y - s * .7); g.lineTo(x + s * .62, y - s * 1.3);
    g.stroke();
    g.fillStyle = "#fde7a8";
    for (const k of [-1, 1]) { g.beginPath(); g.arc(x + k * s * .62, y - s * 1.3, s * .2, 0, 6.29); g.fill(); }
    g.fillStyle = c;
    g.beginPath(); g.ellipse(x, y, s, s * .88, 0, 0, 6.29); g.fill();
    for (const k of [-1, 1]) {
      g.fillStyle = "#2b1f3f";
      g.beginPath(); g.arc(x + k * s * .36, y - s * .08, s * .19, 0, 6.29); g.fill();
      g.fillStyle = "#fff";
      g.beginPath(); g.arc(x + k * s * .36 - s * .06, y - s * .15, s * .07, 0, 6.29); g.fill();
      g.fillStyle = "rgba(238, 129, 150, .55)";
      g.beginPath(); g.ellipse(x + k * s * .62, y + s * .22, s * .14, s * .09, 0, 0, 6.29); g.fill();
    }
    g.strokeStyle = "#2b1f3f";
    g.lineWidth = 1.6;
    g.beginPath(); g.arc(x, y + s * .14, s * .2, .15 * Math.PI, .85 * Math.PI); g.stroke();
  }
  function rock(it) {
    const s = it.size, x = it.x, y = it.y;
    g.fillStyle = "rgba(255, 190, 140, .28)";
    g.beginPath(); g.moveTo(x - s * .7, y - s * .2); g.lineTo(x, y - s * 3.2); g.lineTo(x + s * .7, y - s * .2); g.fill();
    g.fillStyle = "#8d82a8";
    g.beginPath(); g.ellipse(x, y, s * 1.05, s * .92, it.p, 0, 6.29); g.fill();
    g.fillStyle = "#6c6288";
    g.beginPath(); g.arc(x - s * .3, y - s * .2, s * .24, 0, 6.29); g.fill();
    g.beginPath(); g.arc(x + s * .35, y + s * .25, s * .17, 0, 6.29); g.fill();
  }
  function draw() {
    if (!W) return;
    const space = LEVELS[S.level].space;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    // sky: twinkling dots and a crescent moon
    for (const s of sky) {
      g.globalAlpha = .35 + .3 * Math.sin(S.t * 1.5 + s.p);
      g.fillStyle = "#fff3c4";
      g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 6.29); g.fill();
    }
    g.globalAlpha = 1;
    const mx = W * .86, my = H * .1, mr = Math.max(14, W * .04);
    if (space) {
      // a ringed planet instead of the moon, and a little lilac planet to stand on
      g.fillStyle = "#f4b68a";
      g.beginPath(); g.arc(mx, my, mr, 0, 6.29); g.fill();
      g.strokeStyle = "#c9b2f0";
      g.lineWidth = 3;
      g.beginPath(); g.ellipse(mx, my, mr * 1.8, mr * .45, -.35, 0, 6.29); g.stroke();
      g.fillStyle = "rgba(201, 178, 240, .22)";
    } else {
      g.fillStyle = "#fde7a8";
      g.beginPath(); g.arc(mx, my, mr, 0, 6.29); g.fill();
      g.fillStyle = "#2c2254";
      g.beginPath(); g.arc(mx - mr * .45, my - mr * .2, mr * .9, 0, 6.29); g.fill();
      // a soft cloud for Lumi to stand on
      g.fillStyle = "rgba(251, 243, 233, .14)";
    }
    g.beginPath(); g.ellipse(W / 2, H * 1.02, W * .7, H * .09, 0, 0, 6.29); g.fill();
    // falling things
    for (const it of S.items) {
      if (space && it.type !== "cookie") {
        (it.type === "star" ? critter : rock)(it);
      } else if (it.type === "star") {
        const r = it.size * 2.2;
        g.drawImage(GLOW, it.x - r, it.y - r, r * 2, r * 2);
        g.fillStyle = "#f8d46a";
        star(it.x, it.y, it.size, Math.sin(S.t * 2 + it.p) * .3);
      } else if (it.type === "rain") {
        const s = it.size;
        g.fillStyle = "#8ec5ef";
        g.beginPath();
        g.moveTo(it.x, it.y - s * 1.3);
        g.quadraticCurveTo(it.x + s, it.y, it.x, it.y + s * .8);
        g.quadraticCurveTo(it.x - s, it.y, it.x, it.y - s * 1.3);
        g.fill();
        g.fillStyle = "rgba(255, 255, 255, .7)";
        g.beginPath(); g.ellipse(it.x - s * .28, it.y, s * .16, s * .3, 0, 0, 6.29); g.fill();
      } else {
        const s = it.size;
        g.fillStyle = "#d9a066";
        g.beginPath(); g.arc(it.x, it.y, s, 0, 6.29); g.fill();
        g.fillStyle = "#4f3026";
        for (const [dx, dy] of [[-.35, -.3], [.3, -.1], [-.1, .4]]) { g.beginPath(); g.arc(it.x + dx * s, it.y + dy * s, s * .17, 0, 6.29); g.fill(); }
      }
    }
    for (const s of S.sparks) {
      g.globalAlpha = Math.max(0, s.life);
      g.fillStyle = s.color;
      g.beginPath(); g.arc(s.x, s.y, 2.6, 0, 6.29); g.fill();
    }
    g.globalAlpha = 1;
  }

  // ---------- input ----------
  const pointerX = (e) => {
    const r = game.getBoundingClientRect();
    return Math.max(.06, Math.min(.94, (e.clientX - r.left) / r.width));
  };
  game.addEventListener("pointerdown", (e) => {
    if (S.state !== "playing" || e.target.closest("button")) return;
    S.dragging = true;
    S.tx = pointerX(e);
    game.setPointerCapture(e.pointerId);
  });
  game.addEventListener("pointermove", (e) => {
    if (S.state === "playing" && (S.dragging || e.pointerType === "mouse")) S.tx = pointerX(e);
  });
  const endDrag = () => { S.dragging = false; };
  game.addEventListener("pointerup", endDrag);
  game.addEventListener("pointercancel", endDrag);

  const KEY = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  addEventListener("keydown", (e) => {
    if (app.view() !== "play") return;
    if (KEY[e.key] && S.state === "playing") {
      S.keys[KEY[e.key]] = true;
      e.preventDefault();
    } else if ((e.key === " " || e.key === "p" || e.key === "P") && (S.state === "playing" || S.state === "paused") && !e.target.closest?.("button")) {
      e.preventDefault();
      S.state === "playing" ? pause() : resume();
    }
  });
  addEventListener("keyup", (e) => { if (KEY[e.key]) S.keys[KEY[e.key]] = false; });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

  // ---------- size ----------
  function resize() {
    const r = game.getBoundingClientRect();
    if (!r.width) return;
    W = r.width; H = r.height;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    placeSprite();
    draw();
  }
  new ResizeObserver(resize).observe(game);

  app.onView("play", () => {
    // decode every picture the game uses up front, so swapping moods never flickers
    ["curious", "determined", "excited", "hurt", "fed", "flop", "proud", "happy", "thinking"].forEach(m => { const i = new Image(); i.src = app.artURL(m, true); });
    resize();
    // the space level is only for visitors the attic window sent here; anyone else lands on the game's own levels
    if (LEVELS[S.level].space && !arriving) { S.state = "menu"; S.level = unlocked - 1; }
    arriving = false;
    if (S.state === "paused") showCard("thinking", "Paused", "Lumi is waiting very patiently. (Lumi is not patient.)", "keep going ▸");
    else if (S.state !== "playing") toMenu(S.level);
  }, pause);

  // the attic window: Lumi flies out to the space level
  const toSpace = () => {
    spaceFrom = "#" + (app.view() || "room");
    arriving = true;
    if (S.state === "playing" || S.state === "paused") { S.state = "menu"; stop(); }
    S.level = SKY;
    renderLevels();
  };

  // read-only peek for the automated tests (and the window's way in)
  app.game = { toSpace, state: () => ({ state: S.state, level: S.level, caught: S.caught, hearts: S.hearts, x: S.x, w: W, items: S.items.map(i => ({ type: i.type, x: i.x / W, y: i.y / H })) }) };
  renderLevels();
})();
