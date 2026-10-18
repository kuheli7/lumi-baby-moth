// Home: Lumi itself. It flies around its patch of sky; poke it, drop it cookies, tap lights for it
// to chase, pick its mood, let it doze off.
(() => {
  "use strict";
  const { $, pick, sfx, store, restart, reduceMotion } = app;

  const LABEL = {
    curious: "curious", happy: "happy", excited: "excited", shy: "shy", proud: "proud", love: "love", surprised: "surprised",
    confused: "confused", sad: "sad", hurt: "hurt", sleepy: "sleepy", flop: "flop x_x", fed: "fed! 🍪", thinking: "thinking",
    chase: "chasing shiny things", starry: "SHINY!!", determined: "determined",
  };
  const LINES = {
    idle: [
      "Ooh, shiny. New hobby!",
      "i have started 47 hobbies. i have finished 1. it's the lantern.",
      "do you have a cookie? asking for me.",
      "my hobby room is very dark. bring the lantern!",
      "is it 3 AM yet? that's when the best hobbies start.",
      "want to play? i'm very good at catching stars. (i'm okay at it.)",
      "tap the sky and i'll chase the light. i can't help it. moth.",
    ],
    light: ["ooh, shiny!!", "got it! (i don't know what to do with it.)", "SHINY. mine now.", "moth rule no. 1: go to the light."],
    poke: { happy: ["hehe! that tickles."], excited: ["boop received!!"], shy: ["eep! hehe…"] },
    hurt: ["…ow. my feelings are very soft. like my fluff.", "please. i am only marshmallow-sized.", "*sniff* that one was a bit much."],
    flop: ["*flops dramatically* x_x", "Lumi has played dead. only a cookie can fix this."],
    stillFlop: ["(still flopped. cookie-activated.)", "x_x … (a cookie would help)"],
    forgive: ["…okay. i'm okay now. gentle boops only.", "i forgive you. it's a moth thing."],
    fed: ["om nom nom! thank you!", "COOKIE!! best hobby: eating.", "crumbs in my fluff. worth it."],
    full: ["that's cookie number {n} tonight. i'm a professional.", "more?? you spoil me."],
    revive: ["*revives instantly* …was that chocolate chip?", "i'm alive!! the cookie brought me back!!"],
    wake: ["huh?! i'm awake! i was just resting my antennae.", "*yawn* oh hi. i wasn't asleep. (i was asleep.)"],
    sleep: ["zzz… five more hobbies…", "zzz… shiny… zzz"],
    pick: {
      curious: "ooh. what's that over there?", happy: "hehe! best night ever.", love: "i love you. and cookies. mostly you.",
      sleepy: "zzz… five more hobbies…", sad: "*sniff* i'm okay. (a cookie would help.)",
    },
  };
  const PICKER = ["curious", "happy", "love", "sleepy", "sad"];
  // the sky takes on Lumi's mood: warm when it's happy, pink in love, darker when sleepy, rainy when sad
  const TINT = { happy: "warm", excited: "warm", fed: "warm", proud: "warm", starry: "warm", love: "pink", shy: "pink",
    sleepy: "sleepy", sad: "blue", hurt: "blue", flop: "blue" };
  const POKE_MOODS = ["happy", "excited", "shy"];

  const stage = $("#stage"), bubble = $("#bubble"), moodLabel = $("#mood-label"), picker = $("#mood-picker");
  const pal = { mood: "", pokes: 0, timer: 0, calm: 0, lastSaid: Date.now(), lastActive: Date.now() };

  function setMood(m) {
    if (pal.mood === m) return;
    pal.mood = m;
    stage.innerHTML = app.art(m, true);
    moodLabel.textContent = LABEL[m] || m;
    document.body.dataset.tint = TINT[m] || "";
    stage.setAttribute("aria-label", m === "flop" ? "Lumi has flopped. Feed it a cookie." : m === "sleepy" ? "Wake Lumi up" : "Poke Lumi");
    picker.querySelectorAll(".mood-btn").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mood === m)));
    if (!fl.raf && fl.placed) still();
    app.look();
  }
  function say(text) {
    bubble.textContent = text;
    if (!reduceMotion) restart(bubble, "say");
    pal.lastSaid = Date.now();
  }
  // a mood that lasts a moment, then Lumi settles back to curious
  function moodFor(m, ms) {
    clearTimeout(pal.timer);
    setMood(m);
    pal.timer = setTimeout(() => setMood("curious"), ms);
  }
  // reactions from elsewhere on the site only interrupt a calm Lumi
  const calm = () => !["flop", "hurt", "fed"].includes(pal.mood);
  function react(m, line, ms = 2400) {
    pal.lastActive = Date.now();
    if (!calm()) return;
    moodFor(m, ms);
    if (line) say(line);
  }
  const bump = (cls) => { if (!reduceMotion) restart(stage, cls); };

  function wake() {
    if (pal.mood !== "sleepy") return false;
    clearTimeout(pal.timer);
    setMood("curious");
    say(pick(LINES.wake));
    sfx.play.pop();
    return true;
  }

  function poke() {
    pal.lastActive = Date.now();
    if (wake()) return;
    bump("squish");
    if (pal.mood === "flop") { sfx.play.pop(); say(pick(LINES.stillFlop)); return; }
    pal.pokes++;
    clearInterval(pal.calm);
    pal.calm = setInterval(calmDown, 3500);
    if (pal.pokes >= 6) {
      clearTimeout(pal.timer);
      setMood("flop");
      sfx.play.flop();
      say(pick(LINES.flop));
    } else if (pal.pokes >= 4) {
      clearTimeout(pal.timer);
      setMood("hurt");
      sfx.play.sad();
      say(pick(LINES.hurt));
    } else {
      const m = POKE_MOODS[(pal.pokes - 1) % POKE_MOODS.length];
      moodFor(m, 1600);
      sfx.play.giggle();
      say(pick(LINES.poke[m]));
    }
  }
  // pokes wear off slowly; a hurt Lumi cheers up on its own, a flopped one needs a cookie
  function calmDown() {
    if (pal.mood === "flop") { clearInterval(pal.calm); return; }
    pal.pokes = Math.max(0, pal.pokes - 1);
    if (pal.pokes <= 2 && pal.mood === "hurt") { setMood("curious"); say(pick(LINES.forgive)); }
    if (!pal.pokes) clearInterval(pal.calm);
  }

  // ---------- cookies ----------
  const today = () => new Date().toDateString();
  let tonight = store.get("today", { date: today(), n: 0 });
  if (tonight.date !== today()) tonight = { date: today(), n: 0 };
  let eaten = store.get("cookies", 0);
  const slots = $("#slots"), feedLabel = $("#feed-label");
  function showCookies(fresh = false) {
    const n = tonight.n;
    slots.innerHTML = [0, 1, 2].map(i => i < n ? `<span class="slot full">${app.COOKIE}</span>` : `<span class="slot"></span>`).join("")
      + (n > 3 ? `<span class="more">+${n - 3}</span>` : "");
    if (!fresh) slots.querySelectorAll(".slot.full").forEach(s => s.style.animation = "none");
    slots.setAttribute("aria-label", `${n} cookie${n === 1 ? "" : "s"} today`);
    feedLabel.textContent = n ? "give another cookie" : "feed a cookie";
    app.odometer($("#odo-cookies"), eaten);
  }

  function feed() {
    pal.lastActive = Date.now();
    const wasFlopped = pal.mood === "flop";
    clearTimeout(pal.timer);
    clearInterval(pal.calm);
    pal.pokes = 0;
    setMood("fed");
    bump("yum");
    sfx.play.munch();
    tonight.n++;
    eaten++;
    store.set("today", tonight);
    store.set("cookies", eaten);
    showCookies(true);
    say(wasFlopped ? pick(LINES.revive) : tonight.n > 3 ? pick(LINES.full).replace("{n}", tonight.n) : pick(LINES.fed));
    pal.timer = setTimeout(() => {
      setMood("happy");
      pal.timer = setTimeout(() => setMood("curious"), 2200);
    }, 2600);
  }

  $("#feed").addEventListener("click", () => dropCookie());
  stage.addEventListener("click", poke);

  // ---------- flying: Lumi drifts around its patch of sky ----------
  // It lands on the cloud when it's sleepy, sad, hurt or flopped, holds still under the mouse so
  // pokes land, zooms after lights you tap and cookies you drop, and stops off the home screen.
  const flight = $("#flight"), shadow = $("#lumi-shadow"), cloud = $("#cloud");
  const LANDED = ["sleepy", "flop", "sad", "hurt"];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const fl = { x: 0, y: 0, vx: 0, vy: 0, t: Math.random() * 20, placed: false, hold: false, ptr: null, light: null, cookies: [], raf: 0, last: 0 };

  // the space Lumi can move in, measured each frame because the screen and the bubble change
  function box() {
    const W = flight.clientWidth, H = flight.clientHeight, w = stage.offsetWidth;
    const c = cloud.getBoundingClientRect(), ground = c.top - flight.getBoundingClientRect().top + c.height * .42;
    const rest = ground - w * .86;                                   // feet on the cloud
    const top = Math.min(rest, bubble.offsetHeight + 4);              // just under the bubble
    return { W, H, w, ground, rest, top, home: top + (rest - top) * .42, cx: (W - w) / 2 };
  }
  function place(b) {
    stage.style.translate = `${fl.x.toFixed(1)}px ${fl.y.toFixed(1)}px`;
    stage.style.rotate = `${clamp(fl.vx * .035, -12, 12).toFixed(2)}deg`;
    // the shadow on the cloud shrinks and fades as Lumi flies higher
    const lift = b.rest > b.top ? clamp((b.rest - fl.y) / (b.rest - b.top), 0, 1) : 0;
    shadow.style.width = `${(b.w * .6).toFixed(1)}px`;
    shadow.style.translate = `${(fl.x + b.w * .2).toFixed(1)}px ${b.ground.toFixed(1)}px`;
    shadow.style.scale = (1 - lift * .5).toFixed(3);
    shadow.style.opacity = (.9 - lift * .6).toFixed(3);
    // the bubble's tail points at Lumi
    const bw = bubble.offsetWidth;
    bubble.style.setProperty("--tail", `${clamp(fl.x + b.w / 2 - (b.W - bw) / 2, 26, bw - 26).toFixed(0)}px`);
  }
  // reduced motion (or before the first frame): sit still in the middle, or on the cloud
  function still() {
    const b = box();
    if (!b.W) return;
    fl.x = b.cx;
    fl.y = LANDED.includes(pal.mood) ? b.rest : b.home;
    fl.vx = fl.vy = 0;
    fl.placed = true;
    place(b);
  }

  function frame(now) {
    fl.raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, fl.last ? (now - fl.last) / 1000 : 0);
    fl.last = now;
    const b = box();
    if (!b.W) return;
    if (!fl.placed) still();
    const cookie = fl.cookies.reduce((low, c) => (!low || c.y > low.y ? c : low), null);
    let tx, ty, k;
    if (LANDED.includes(pal.mood)) { tx = b.cx; ty = b.rest; k = 10; }
    else if (cookie) { tx = cookie.x - b.w / 2; ty = b.home + (b.rest - b.home) * .5; k = 40; }
    else if (fl.light) { tx = fl.light.x - b.w / 2; ty = fl.light.y - b.w * .55; k = 20; }
    else if (fl.hold || pal.mood === "fed") { tx = fl.x; ty = fl.y; k = 8; }
    else {
      // a slow loop around the sky, leaning toward the mouse when it's nearby
      fl.t += dt;
      tx = b.cx + Math.sin(fl.t * .41) * (b.W - b.w) * .4;
      ty = b.home + Math.sin(fl.t * .67 + 1.3) * (b.rest - b.top) * .32;
      if (fl.ptr) { tx += (fl.ptr.x - b.w / 2 - tx) * .3; ty += (fl.ptr.y - b.w / 2 - ty) * .2; }
      k = 5;
    }
    tx = clamp(tx, 0, b.W - b.w);
    ty = clamp(ty, b.top, b.rest);
    const damp = 1.8 * Math.sqrt(k);
    fl.vx += (k * (tx - fl.x) - damp * fl.vx) * dt;
    fl.vy += (k * (ty - fl.y) - damp * fl.vy) * dt;
    fl.x += fl.vx * dt;
    fl.y += fl.vy * dt;
    stage.classList.toggle("zoom", Math.hypot(fl.vx, fl.vy) > 140);
    place(b);
    app.look();

    // reached the light? (or as close as the sky allows, for a light tapped right at the edge)
    const there = Math.hypot(tx - fl.x, ty - fl.y) < 6 && Math.hypot(fl.vx, fl.vy) < 30;
    if (fl.light && (there || Math.hypot(fl.x + b.w / 2 - fl.light.x, fl.y + b.w * .55 - fl.light.y) < b.w * .2)) gotLight();
    else if (fl.light && now - fl.light.born > 5000) dropLight();

    // cookies fall until they land in Lumi's paws (they never miss: one that falls past is caught anyway)
    const pawX = fl.x + b.w / 2, pawY = fl.y + b.w * .62;
    for (const c of [...fl.cookies]) {
      c.vy += 1400 * dt;
      c.y += c.vy * dt;
      c.r += c.vr * dt;
      c.el.style.translate = `${c.x.toFixed(1)}px ${c.y.toFixed(1)}px`;
      c.el.style.rotate = `${c.r.toFixed(0)}deg`;
      if ((c.y >= pawY - 12 && Math.abs(c.x - pawX) < b.w * .34) || c.y > b.H + 40) catchCookie(c, pawX, pawY);
    }
  }
  const canFly = () => !reduceMotion && app.view() === "home" && !document.hidden;
  function startFlying() {
    if (fl.raf) return;
    if (!canFly()) { still(); return; }
    fl.last = 0;
    fl.raf = requestAnimationFrame(frame);
  }
  function stopFlying() {
    cancelAnimationFrame(fl.raf);
    fl.raf = 0;
    stage.classList.remove("zoom");
    fl.cookies.slice().forEach(c => catchCookie(c));   // cookies still in the air are eaten, not lost
    dropLight();
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stopFlying() : startFlying()));
  addEventListener("resize", () => { if (!fl.raf && app.view() === "home") still(); });

  // the mouse: Lumi holds still under it (so pokes land) and leans toward it otherwise
  stage.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") fl.hold = true; });
  stage.addEventListener("pointerleave", () => { fl.hold = false; });
  flight.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = flight.getBoundingClientRect();
    fl.ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  flight.addEventListener("pointerleave", () => { fl.ptr = null; });

  // ---------- lights: tap the sky and Lumi goes to the light (it's a moth) ----------
  flight.addEventListener("click", (e) => {
    if (e.target.closest("#stage, .bubble")) return;
    pal.lastActive = Date.now();
    if (pal.mood === "flop") { say("x_x (too flopped to chase lights. a cookie might help.)"); return; }
    if (pal.mood === "hurt") { say("*sniff* not now, shiny thing."); return; }
    const r = flight.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    dropLight();
    const el = document.createElement("span");
    el.className = "spark";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    flight.append(el);
    fl.light = { el, x, y, born: performance.now() };
    sfx.play.plip();
    clearTimeout(pal.timer);
    setMood("starry");                             // even a sad moth perks up for a light
    if (!fl.raf) gotLight();
  });
  function dropLight() {
    if (!fl.light) return;
    const { el } = fl.light;
    fl.light = null;
    el.classList.add("gone");
    setTimeout(() => el.remove(), 400);
  }
  function gotLight() {
    dropLight();
    sfx.play.shiny();
    moodFor("happy", 1600);
    say(pick(LINES.light));
  }

  // ---------- cookies fall from the sky and Lumi swoops to catch them ----------
  function dropCookie() {
    pal.lastActive = Date.now();
    wake();
    if (!fl.raf) { feed(); return; }
    const b = box(), lumiX = fl.x + b.w / 2, landed = LANDED.includes(pal.mood);
    const x = landed ? lumiX : clamp(lumiX + (Math.random() < .5 ? -1 : 1) * (50 + Math.random() * 110), b.w * .4, b.W - b.w * .4);
    const el = document.createElement("div");
    el.className = "drop-cookie";
    el.innerHTML = app.COOKIE;
    flight.append(el);
    // it starts just above the top of the screen
    const c = { el, x, y: Math.min(-60, -flight.getBoundingClientRect().top - 40), vy: 0, r: 0, vr: (Math.random() - .5) * 500 };
    el.style.translate = `${c.x}px ${c.y}px`;
    fl.cookies.push(c);
    sfx.play.pop();
    if (!landed && pal.mood !== "fed") { clearTimeout(pal.timer); setMood("excited"); say("COOKIE?! incoming!!"); }
  }
  function catchCookie(c, x, y) {
    fl.cookies.splice(fl.cookies.indexOf(c), 1);
    c.el.remove();
    if (x !== undefined && !reduceMotion) {
      for (let i = 0; i < 5; i++) {
        const k = document.createElement("span");
        k.className = "crumb";
        k.style.left = `${x}px`;
        k.style.top = `${y}px`;
        k.style.setProperty("--dx", `${Math.round((Math.random() - .5) * 70)}px`);
        k.style.setProperty("--dy", `${Math.round(Math.random() * 40 + 10)}px`);
        k.addEventListener("animationend", () => k.remove());
        flight.append(k);
      }
    }
    // a little buzz you can feel, on phones that can (not when muted: muted means quiet). Browsers only
    // allow it after a real tap, and complain in the console otherwise, so check first.
    if (x !== undefined && !sfx.muted && navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(30);
    feed();
  }

  // ---------- mood picker ----------
  picker.innerHTML = PICKER.map(m => `<button class="mood-btn" data-mood="${m}" aria-pressed="false">
    <img src="${app.artURL(m)}" alt="" width="58" height="58"><span>${m}</span></button>`).join("");
  picker.addEventListener("click", (e) => {
    const b = e.target.closest(".mood-btn");
    if (!b) return;
    pal.lastActive = Date.now();
    if (pal.mood === "flop") { say("x_x (a mood won't fix this. only a cookie will.)"); return; }
    clearTimeout(pal.timer);
    clearInterval(pal.calm);
    pal.pokes = 0;
    setMood(b.dataset.mood);
    say(LINES.pick[b.dataset.mood]);
  });

  // ---------- dozing off: 40 quiet seconds on the home screen ----------
  addEventListener("pointerdown", (e) => {
    if (pal.mood === "sleepy" && !stage.contains(e.target) && !e.target.closest("#feed, .mood-btn")) wake();
    pal.lastActive = Date.now();
  });
  addEventListener("keydown", () => { pal.lastActive = Date.now(); });
  setInterval(() => {
    const now = Date.now();
    if (pal.mood !== "curious" || document.hidden || app.view() !== "home") return;
    if (now - pal.lastActive > 40000) {
      setMood("sleepy");
      sfx.play.yawn();
      say(pick(LINES.sleep));
    } else if (now - pal.lastSaid > 16000) {
      say(pick(LINES.idle));
    }
  }, 4000);

  // ---------- responsive chaos: Lumi notices when the window changes shape ----------
  // The address bar sliding away on a phone changes only the height, so only a new width or a turn counts.
  const bestWH = $("#best-wh");
  const showWH = () => { bestWH.textContent = `${innerWidth} × ${innerHeight}`; };
  let lastW = innerWidth, wasPortrait = innerHeight > innerWidth, settle = 0, lastToast = 0;
  addEventListener("resize", () => {
    showWH();
    const portrait = innerHeight > innerWidth, turned = portrait !== wasPortrait;
    if (innerWidth === lastW && !turned) return;
    const wider = innerWidth > lastW;
    lastW = innerWidth;
    wasPortrait = portrait;
    if (!settle && app.view() === "home" && calm() && pal.mood !== "sleepy") {
      clearTimeout(pal.timer);
      setMood(turned ? "surprised" : "confused");
      say(turned ? "whoa!! the whole world tipped over!" : wider ? "ooh, the sky is getting bigger!" : "hey! it's getting squishy in here!");
      bump("dizzy");
      restart(bestWH.parentNode, "bump");
    }
    clearTimeout(settle);
    settle = setTimeout(settled, 600);
  });
  function settled() {
    settle = 0;
    const w = innerWidth;
    const line = w < 400 ? "pocket-sized! i fit. barely." : w < 720 ? "phone-sized. cozy." : w < 1100 ? "tablet-sized. so roomy!" : "SO much sky. i could fly for days.";
    if (app.view() === "home") {
      if (calm() && pal.mood !== "sleepy") { moodFor("happy", 2000); say(line); }
    } else if (Date.now() - lastToast > 8000) {
      lastToast = Date.now();
      app.toast(`🦋 Lumi: ${line}`);
    }
  }
  showWH();

  // ---------- Lumi remembers you ----------
  const daysAway = app.lastVisit ? Math.floor((Date.now() - app.lastVisit) / 864e5) : 0;
  const hello = app.visits === 1
    ? (app.isNight() ? `oh! a visitor at ${app.timeStr()}?? a fellow night owl. hi, i'm Lumi!` : "Ooh, shiny. A visitor! hi, i'm Lumi.")
    : daysAway >= 1
      ? `you came back!! i started ${Math.min(daysAway, 9) + 1} new hobbies since. finished: 0.`
      : `welcome back! visit no. ${app.visits}. i remember you.`;
  setMood("curious");
  say(hello);
  showCookies();

  app.onView("home", () => { pal.lastActive = Date.now(); startFlying(); }, stopFlying);
  app.lumi = { react, feed, say, setMood, mood: () => pal.mood };
})();
