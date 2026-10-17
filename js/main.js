// Lumi's Night Shift: everything that moves. lumi(mood), blob(), star4(), star5() and C come from lumi.js.
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // ---------- memory: localStorage can throw (private windows, blocked storage), so every access is guarded ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("lumi." + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem("lumi." + key, JSON.stringify(value)); } catch { /* Lumi forgets, that's all */ } },
  };

  // ---------- sound: tiny synth notes made with Web Audio, no files ----------
  // The AudioContext is only created after the visitor has clicked or typed, so browsers never block it.
  let gestured = false;
  const activated = () => (navigator.userActivation ? navigator.userActivation.hasBeenActive : gestured);

  const sfx = (() => {
    let ctx = null, master = null, muted = store.get("muted", false);
    const ready = () => {
      if (muted || !activated()) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = .22;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    };
    // one soft note gliding from f0 to f1
    const tone = (type, f0, f1, len, at = 0, vol = 1) => {
      const c = ready();
      if (!c) return;
      const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + len);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t + len);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + len + .02);
    };
    // a short filtered noise burst (cookie crunches, the flop thud)
    const crunch = (len, at, freq, vol) => {
      const c = ready();
      if (!c) return;
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2; g.gain.value = vol;
      s.buffer = buf;
      s.connect(f).connect(g).connect(master);
      s.start(c.currentTime + at);
    };
    // Karplus-Strong: a burst of noise fed through a short averaging delay sounds like a plucked string
    const pluck = (freq, at = 0) => {
      const c = ready();
      if (!c) return;
      const sr = c.sampleRate, n = Math.round(sr / freq), len = Math.floor(sr * 1.4);
      const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      for (let i = n; i < len; i++) d[i] = .996 * .5 * (d[i - n] + d[i - n + 1]);
      const s = c.createBufferSource(), g = c.createGain();
      g.gain.value = .45;
      s.buffer = buf;
      s.connect(g).connect(master);
      s.start(c.currentTime + at);
    };
    const play = {
      click: () => tone("sine", 880, 660, .07, 0, .45),
      pop: () => tone("sine", 600, 900, .08, 0, .4),
      close: () => tone("sine", 700, 420, .1, 0, .4),
      giggle: () => [900, 1000, 1100].forEach((f, i) => tone("sine", f, f * 1.35, .07, i * .09, .45)),
      sad: () => tone("sine", 520, 300, .5, 0, .5),
      flop: () => { tone("triangle", 300, 90, .35, 0, .8); crunch(.12, .3, 180, .8); },
      munch: () => [0, .14, .28].forEach((at, i) => crunch(.07, at, 1500 + i * 150, .6)),
      shiny: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone("sine", f, f, .25, i * .07, .35)),
      chime: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone("sine", f, f, .9, i * .11, .3)),
      yawn: () => tone("sine", 420, 260, .7, 0, .3),
      pluck: (f = 196, at = 0) => pluck(f, at),
    };
    return {
      play,
      // start (or wake) the audio inside a real tap or key press; iPhones only allow it there
      unlock() {
        const c = ready();
        return !!c && c.state === "running";
      },
      get muted() { return muted; },
      setMuted(m) {
        muted = m;
        store.set("muted", m);
        if (m && ctx) ctx.suspend();
      },
    };
  })();

  const GESTURES = ["pointerdown", "touchend", "click", "keydown"];
  const unlockAudio = (e) => {
    // a finger touching down doesn't count as a gesture yet; lifting it does
    if (e.type !== "pointerdown" || e.pointerType === "mouse") gestured = true;
    if (sfx.unlock()) GESTURES.forEach(t => removeEventListener(t, unlockAudio, true));
  };
  GESTURES.forEach(t => addEventListener(t, unlockAudio, { capture: true, passive: true }));

  // every button clicks softly unless it makes its own sound
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b && !b.dataset.sfx) sfx.play.click();
  });

  const muteBtn = $("#mute");
  const showMute = () => {
    muteBtn.textContent = sfx.muted ? "🔇 sound off" : "🔊 sound on";
    muteBtn.setAttribute("aria-pressed", String(sfx.muted));
  };
  muteBtn.dataset.sfx = "none";
  muteBtn.addEventListener("click", () => {
    sfx.setMuted(!sfx.muted);
    showMute();
    if (!sfx.muted) sfx.play.pop();
  });
  showMute();

  // ---------- toast ----------
  const toastEl = $("#toast");
  let toastTimer = 0;
  function toast(msg, ms = 3400) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    restart(toastEl, "show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  }

  // ---------- odometers ----------
  function odometer(el, n) {
    const s = String(Math.min(n, 999999)).padStart(6, "0");
    if (!el.children.length) {
      el.innerHTML = [...s].map(d => `<span class="digit"><span>${d}</span></span>`).join("");
    } else {
      [...el.children].forEach((dg, i) => {
        if (dg.textContent === s[i]) return;
        dg.innerHTML = `<span>${s[i]}</span>`;
        restart(dg, "roll");
      });
    }
    const label = el.parentElement.getAttribute("aria-label").replace(/:.*$/, "");
    el.parentElement.setAttribute("aria-label", `${label}: ${n}`);
  }
  const visits = store.get("visits", 0) + 1;
  const lastVisit = store.get("last", 0);
  store.set("visits", visits);
  store.set("last", Date.now());
  let cookiesEaten = store.get("cookies", 0);
  odometer($("#odo-visits"), visits);
  odometer($("#odo-cookies"), cookiesEaten);

  // ---------- clock (Lumi is a night owl) ----------
  const clock = $("#clock");
  const timeStr = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const isNight = () => { const h = new Date().getHours(); return h >= 21 || h < 5; };
  const tick = () => {
    clock.textContent = `${isNight() ? "🌙" : "☀️"} ${timeStr()}`;
    clock.title = isNight() ? "prime moth hours" : "Lumi's nap time";
  };
  tick();
  setInterval(tick, 15000);

  // ---------- every Lumi's eyes follow the pointer (mouse, pen or touch), once per frame ----------
  let px = innerWidth / 2, py = innerHeight / 3, lookQueued = false;
  function look() {
    lookQueued = false;
    $$(".pupil").forEach(p => {
      const r = p.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy) || 1, m = Math.min(3, len / 40);
      p.setAttribute("transform", `translate(${((dx / len) * m).toFixed(2)} ${((dy / len) * m).toFixed(2)})`);
    });
  }
  const queueLook = (e) => {
    px = e.clientX; py = e.clientY;
    if (!lookQueued) { lookQueued = true; requestAnimationFrame(look); }
  };
  addEventListener("pointermove", queueLook, { passive: true });
  addEventListener("pointerdown", queueLook, { passive: true });

  // ======================================================================
  //  Lumi: poke, feed, sleep
  // ======================================================================
  const MOOD_LABEL = { curious: "curious", happy: "happy", wink: "wink", starry: "SHINY!!", fed: "fed! 🍪", sad: "hurt", sleepy: "sleepy", flop: "flop x_x" };
  const LINES = {
    idle: [
      "ooh, shiny. new hobby.",
      "i have started 47 hobbies. i have finished 1. it's the lantern.",
      "do you have a cookie? asking for me.",
      "the hobby room is very dark. bring the lantern!",
      "i know so many useless facts. visit my museum.",
      "is it 3 AM yet? that's when the best hobbies start.",
    ],
    giggle: ["hehe! that tickles.", "boop received.", "eep! hehe.", "again? okay. hehe."],
    hurt: ["…ow. my feelings are very soft. like my fluff.", "please. i am only marshmallow-sized.", "*sniff* that one was a bit much."],
    flop: ["*flops dramatically* x_x", "Lumi has played dead. only a cookie can fix this."],
    stillFlop: ["(still flopped. cookie-activated.)", "x_x … (a cookie would help)"],
    forgive: ["…okay. i'm okay now. gentle boops only.", "i forgive you. it's a moth thing."],
    fed: ["COOKIE!! 🍪 best hobby: eating.", "nom nom nom. crumbs in my fluff. worth it.", "a cookie! for me?! i'm going to cry (happy)."],
    revive: ["*revives instantly* …was that chocolate chip?", "i'm alive!! the cookie brought me back!!"],
    wake: ["huh?! i'm awake! i was just resting my antennae.", "*yawn* oh hi. i wasn't asleep. (i was asleep.)"],
    sleep: ["zzz… five more hobbies…", "zzz… shiny… zzz"],
    tempt: ["ooh… is that… a cookie?", "for me?? bring it closer!!"],
    miss: ["…oh. okay. maybe later.", "the cookie went back in the jar. *sniff*"],
  };

  const stage = $("#stage"), bubble = $("#bubble"), moodLabel = $("#mood-label");
  const pal = { mood: "", pokes: 0, timer: 0, calm: 0, lastSaid: Date.now(), lastActive: Date.now() };

  function setMood(m) {
    if (pal.mood === m) return;
    pal.mood = m;
    stage.innerHTML = lumi(m);
    moodLabel.textContent = MOOD_LABEL[m];
    stage.setAttribute("aria-label", m === "flop" ? "Lumi has flopped. Give it a cookie." : m === "sleepy" ? "Wake Lumi up" : "Poke Lumi");
    look();
  }
  function say(text) {
    bubble.textContent = text;
    restart(bubble, "say");
    pal.lastSaid = Date.now();
  }
  // a mood that lasts a moment, then Lumi settles back to curious
  function moodFor(m, ms) {
    clearTimeout(pal.timer);
    setMood(m);
    pal.timer = setTimeout(() => setMood("curious"), ms);
  }
  // reactions from elsewhere on the page (hobbies, guestbook) only interrupt a calm Lumi
  const calm = () => !["flop", "sad", "fed"].includes(pal.mood);
  function react(m, line, ms = 2400) {
    pal.lastActive = Date.now();
    if (!calm()) return;
    moodFor(m, ms);
    say(line);
  }
  const bump = (cls) => { if (!reduceMotion) restart(stage, cls); };

  function wake() {
    if (pal.mood !== "sleepy") return false;
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
      setMood("sad");
      bump("shiver");
      sfx.play.sad();
      say(pick(LINES.hurt));
    } else {
      moodFor(pal.pokes % 2 ? "happy" : "wink", 1600);
      sfx.play.giggle();
      say(pick(LINES.giggle));
    }
  }
  // pokes wear off slowly; a hurt Lumi cheers up on its own, a flopped one needs a cookie
  function calmDown() {
    if (pal.mood === "flop") { clearInterval(pal.calm); return; }
    pal.pokes = Math.max(0, pal.pokes - 1);
    if (pal.pokes <= 2 && pal.mood === "sad") { setMood("curious"); say(pick(LINES.forgive)); }
    if (!pal.pokes) clearInterval(pal.calm);
  }

  function feed() {
    pal.lastActive = Date.now();
    const wasFlopped = pal.mood === "flop";
    clearTimeout(pal.timer);
    clearInterval(pal.calm);
    pal.pokes = 0;
    setMood("fed");
    sfx.play.munch();
    say(pick(wasFlopped ? LINES.revive : LINES.fed));
    cookiesEaten++;
    store.set("cookies", cookiesEaten);
    odometer($("#odo-cookies"), cookiesEaten);
    pal.timer = setTimeout(() => {
      setMood("happy");
      pal.timer = setTimeout(() => setMood("curious"), 2200);
    }, 2600);
  }

  stage.addEventListener("click", poke);

  // any click or key anywhere counts as company; 40 quiet seconds and Lumi dozes off
  addEventListener("pointerdown", (e) => {
    if (pal.mood === "sleepy" && !stage.contains(e.target) && !e.target.closest(".cookie")) wake();
    pal.lastActive = Date.now();
  });
  addEventListener("keydown", () => { pal.lastActive = Date.now(); });
  setInterval(() => {
    const now = Date.now();
    if (pal.mood !== "curious" || document.hidden) return;
    if (now - pal.lastActive > 40000) {
      setMood("sleepy");
      sfx.play.yawn();
      say(pick(LINES.sleep));
    } else if (now - pal.lastSaid > 16000) {
      say(pick(LINES.idle));
    }
  }, 4000);

  // Lumi remembers you
  const daysAway = lastVisit ? Math.floor((Date.now() - lastVisit) / 864e5) : 0;
  const hello = visits === 1
    ? (isNight() ? `oh! a visitor! at ${timeStr()}?? a fellow night owl. hi, i'm Lumi!` : "oh! a visitor! hi, i'm Lumi. (it's daytime. i'm extra sleepy.)")
    : daysAway >= 1
      ? `you came back!! it's been ${daysAway} day${daysAway > 1 ? "s" : ""}. i started ${Math.min(daysAway, 9) + 1} new hobbies since. finished: 0.`
      : `welcome back! visit no. ${visits}. i remember you. (i remember everyone who brings cookies.)`;
  setMood("curious");
  say(hello);

  // ======================================================================
  //  Cookie jar: drag a cookie to Lumi, or just tap / press Enter on one
  // ======================================================================
  const COOKIE = `<svg viewBox="103 181 34 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="${blob(120, 198, 15, 14.5, 13, .05)}" fill="#d9a066" stroke="#c08a55" stroke-width="2"/>
    <circle cx="114" cy="193" r="2.6" fill="${C.nose}"/><circle cx="124" cy="196" r="2.6" fill="${C.nose}"/>
    <circle cx="117" cy="204" r="2.6" fill="${C.nose}"/><circle cx="127" cy="205" r="1.8" fill="${C.nose}"/></svg>`;
  const jar = $("#jar");
  jar.innerHTML = [0, 1, 2].map(i => `<button class="cookie" data-sfx="none" aria-label="Give Lumi a cookie" style="rotate:${i * 37 - 30}deg">${COOKIE}</button>`).join("");

  const overStage = (x, y) => {
    const r = stage.getBoundingClientRect();
    return x > r.left && x < r.right && y > r.top && y < r.bottom;
  };
  const ghostAt = (g, x, y) => { g.style.transform = `translate(${x - 32}px, ${y - 32}px)`; };
  function makeGhost(x, y) {
    const g = document.createElement("div");
    g.className = "cookie-ghost";
    g.innerHTML = COOKIE;
    ghostAt(g, x, y);
    document.body.append(g);
    return g;
  }
  function eat(btn) {
    btn.classList.add("gone");
    feed();
    // the jar refills itself (it is a magic jar)
    setTimeout(() => { btn.classList.remove("gone"); restart(btn, "fresh"); }, 2400);
  }
  // a tap or Enter sends the cookie flying over to Lumi
  function flyToLumi(btn) {
    if (btn.classList.contains("gone")) return;
    if (pal.mood === "sleepy") wake();
    const a = btn.getBoundingClientRect(), b = stage.getBoundingClientRect();
    if (reduceMotion || !b.width) { eat(btn); return; }
    const g = makeGhost(a.left + a.width / 2, a.top + a.height / 2);
    btn.classList.add("gone");
    const x0 = a.left + a.width / 2 - 32, y0 = a.top + a.height / 2 - 32;
    const x1 = b.left + b.width / 2 - 32, y1 = b.top + b.height * .62 - 32;
    g.animate([
      { transform: `translate(${x0}px, ${y0}px)` },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 70}px) rotate(180deg)` },
      { transform: `translate(${x1}px, ${y1}px) rotate(360deg) scale(.6)` },
    ], { duration: 520, easing: "ease-in-out" }).onfinish = () => { g.remove(); eat(btn); };
  }

  let drag = null;
  jar.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".cookie");
    if (!btn || btn.classList.contains("gone") || e.button > 0) return;
    btn.setPointerCapture(e.pointerId);
    drag = { btn, id: e.pointerId, x0: e.clientX, y0: e.clientY, ghost: null, over: false };
  });
  jar.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
      drag.ghost = makeGhost(e.clientX, e.clientY);
      drag.btn.classList.add("gone");
      if (pal.mood === "sleepy") wake();
      else if (calm()) { clearTimeout(pal.timer); setMood("starry"); say(pick(LINES.tempt)); }
    }
    ghostAt(drag.ghost, e.clientX, e.clientY);
    drag.over = overStage(e.clientX, e.clientY);
    stage.classList.toggle("drop-ready", drag.over);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { btn, ghost, over } = drag;
    drag = null;
    stage.classList.remove("drop-ready");
    if (!ghost) return; // a plain tap: the click handler feeds Lumi
    btn.dataset.dragged = "1";
    ghost.remove();
    if (over && e.type === "pointerup") { eat(btn); return; }
    btn.classList.remove("gone");
    if (pal.mood === "starry") { setMood("curious"); say(pick(LINES.miss)); }
  };
  jar.addEventListener("pointerup", endDrag);
  jar.addEventListener("pointercancel", endDrag);
  jar.addEventListener("click", (e) => {
    const btn = e.target.closest(".cookie");
    if (!btn) return;
    if (btn.dataset.dragged) { delete btn.dataset.dragged; return; }
    flyToLumi(btn);
  });

  // ======================================================================
  //  Windows: focus, drag (big screens), minimize, close, reopen
  // ======================================================================
  const wins = $$(".win"), tray = $("#tray-windows");
  const canDrag = matchMedia("(min-width: 1100px) and (hover: hover)");
  let zTop = 10;
  const titleOf = (w) => $(".bar-title", w).textContent.replace(/ \(.*\)$/, "");

  function front(w) {
    wins.forEach(x => x.classList.toggle("front", x === w));
    w.style.zIndex = ++zTop;
  }
  function refreshWindows() {
    tray.replaceChildren(...wins.filter(w => w.dataset.state === "min").map(w => {
      const b = document.createElement("button");
      b.textContent = "▢ " + titleOf(w);
      b.setAttribute("aria-label", `Restore ${titleOf(w)}`);
      b.addEventListener("click", () => openWin(w.id));
      return b;
    }));
    $$(".icon").forEach(i => i.classList.toggle("closed", document.getElementById(i.dataset.open).hidden));
  }
  function hideWin(w, state) {
    w.hidden = true;
    w.dataset.state = state;
    refreshWindows();
    sfx.play.close();
  }
  function openWin(id) {
    const w = document.getElementById(id);
    if (!w) return;
    if (w.hidden) {
      w.hidden = false;
      w.dataset.state = "";
      if (!reduceMotion) restart(w, "pop");
      refreshWindows();
    }
    front(w);
    w.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    w.focus({ preventScroll: true });
  }

  wins.forEach(w => {
    w.tabIndex = -1;
    w.addEventListener("pointerdown", () => front(w));
    $(".b-min", w).dataset.sfx = "none";
    $(".b-x", w).dataset.sfx = "none";
    $(".b-min", w).addEventListener("click", () => hideWin(w, "min"));
    $(".b-x", w).addEventListener("click", () => hideWin(w, "closed"));

    // drag by the title bar; the window keeps its spot in the layout and is only nudged with a translate
    const bar = $(".bar", w);
    let start = null;
    bar.addEventListener("pointerdown", (e) => {
      if (!canDrag.matches || e.button > 0 || e.target.closest("button")) return;
      const r = w.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, dx: +w.dataset.dx || 0, dy: +w.dataset.dy || 0, left: r.left, top: r.top, width: r.width };
      bar.setPointerCapture(e.pointerId);
      w.classList.add("dragging");
    });
    bar.addEventListener("pointermove", (e) => {
      if (!start) return;
      // keep at least a good piece of the title bar on screen
      let mx = e.clientX - start.x, my = e.clientY - start.y;
      mx = Math.max(-start.left - start.width + 140, Math.min(innerWidth - start.left - 140, mx));
      my = Math.max(-start.top + 4, Math.min(innerHeight - 110 - start.top, my));
      w.dataset.dx = start.dx + mx;
      w.dataset.dy = start.dy + my;
      w.style.setProperty("--dx", w.dataset.dx + "px");
      w.style.setProperty("--dy", w.dataset.dy + "px");
    });
    const stop = () => { start = null; w.classList.remove("dragging"); };
    bar.addEventListener("pointerup", stop);
    bar.addEventListener("pointercancel", stop);
    bar.addEventListener("dblclick", (e) => {
      if (e.target.closest("button")) return;
      w.dataset.dx = w.dataset.dy = 0;
      w.style.removeProperty("--dx");
      w.style.removeProperty("--dy");
    });
  });
  // on a small screen the windows simply stack, so any dragged offsets are dropped
  canDrag.addEventListener("change", () => {
    if (canDrag.matches) return;
    wins.forEach(w => { w.dataset.dx = w.dataset.dy = 0; w.style.removeProperty("--dx"); w.style.removeProperty("--dy"); });
  });
  front($("#w-lumi"));

  // desktop icons and start-menu entries open windows
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (!opener) return;
    openWin(opener.dataset.open);
    if (opener.closest(".start-menu")) toggleMenu(false);
  });

  // ---------- start menu ----------
  const startBtn = $("#start"), menu = $("#start-menu");
  function toggleMenu(open = menu.hidden) {
    menu.hidden = !open;
    startBtn.setAttribute("aria-expanded", String(open));
    if (open) $("button", menu).focus();
  }
  startBtn.addEventListener("click", () => toggleMenu());
  document.addEventListener("pointerdown", (e) => {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== startBtn) toggleMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { toggleMenu(false); startBtn.focus(); }
  });

  // ======================================================================
  //  The hobby room: dark, and the cursor is a lantern
  // ======================================================================
  const VB_W = 640, VB_H = 400;
  // rect = [x, y, w, h] in the scene's viewBox; tag = where the "under construction" label sits [x, y, anchor]
  const HOBBIES = [
    { id: "moons", name: "watercolor moons", tag: "🚧 moons", rect: [62, 196, 172, 80], at: [148, 290, .5], progress: 40, started: "1:47 AM",
      note: "painted three moons. two came out looking like lemons. the third is still a pencil circle.", status: "paused: ran out of blue" },
    { id: "jar", name: "resin jar of stars", tag: "🚧 jar of stars", rect: [400, 76, 82, 80], at: [440, 176, .5], progress: 30, started: "2:13 AM",
      note: "poured the resin. forgot the stars. added the stars. the resin had already set. one star lives on the lid now.", status: "abandoned: sticky paws" },
    { id: "beads", name: "dew-drop bead jewellery", tag: "🚧 dew beads", rect: [352, 222, 120, 54], at: [412, 290, .5], progress: 15, started: "4:02 AM",
      note: "strung three dew drops. they evaporated by morning. switched to glass beads, then lost the needle.", status: "paused: needle missing (send help)" },
    { id: "guitar", name: "the guitar (one string)", tag: "🚧 guitar", rect: [478, 82, 130, 314], at: [606, 244, 1], progress: 5, started: "3:30 AM",
      note: "learned one string. it is a very good string. go on, pluck it.", status: "on hold: the other five strings are 'coming soon'", pluck: true },
    { id: "museum", name: "museum of useless facts", tag: "🚧 useless facts", rect: [505, 52, 112, 104], at: [612, 40, 1], progress: 99, started: "every night",
      note: "the only hobby that grows by itself. it can never be finished, because new facts keep happening.", status: "open late. very late.", open: "w-facts" },
  ];

  const LANTERN = `<svg viewBox="102 166 36 57" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rl-glass" cx=".5" cy=".5" r=".62">
        <stop offset="0" stop-color="#fffdf6"/><stop offset=".3" stop-color="#fff0b8"/><stop offset=".62" stop-color="#fedd87"/><stop offset=".88" stop-color="#e3b25a"/><stop offset="1" stop-color="#ae8847"/></radialGradient>
      <linearGradient id="rl-frame" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#86603a"/><stop offset=".5" stop-color="${C.frame}"/><stop offset="1" stop-color="#583c22"/></linearGradient>
    </defs>
    <path d="M112 183.5 C110.5 166 129.5 166 128 183.5" fill="none" stroke="${C.frame}" stroke-width="3.6" stroke-linecap="round"/>
    <rect x="105" y="183" width="30" height="30" rx="7" fill="url(#rl-glass)" stroke="url(#rl-frame)" stroke-width="3.4"/>
    ${star5(120, 198, 7.2, 3.2, "#ffffff")}
    <path d="M109.5 216.8 Q120 219.6 130.5 216.8" fill="none" stroke="#45301e" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M109.5 215.9 L130.5 215.9" stroke="${C.frame}" stroke-width="3.4" stroke-linecap="round"/></svg>`;

  const drop = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -6 Q5 0 0 5 Q-5 0 0 -6Z" fill="#cfeafa" stroke="#8fc3e8" stroke-width="1.2"/>`;
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

    <!-- shelf -->
    <rect x="384" y="154" width="236" height="12" rx="3" fill="url(#rm-wood)"/>
    <path d="M404 166 v18 l14 -18 Z M600 166 v18 l-14 -18 Z" fill="#b9875a"/>

    <!-- desk -->
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

  const room = $("#room"), roomHits = $("#room-hits"), card = $("#hobby-card"), foundCount = $("#found-count"), roomSwitch = $("#room-switch");
  $("#room-scene").innerHTML = SCENE;
  $("#room-lantern").innerHTML = LANTERN;
  roomHits.innerHTML = HOBBIES.map(h => {
    const [x, y, w, hh] = h.rect, [tx, ty, ax] = h.at;
    return `<button class="hit" data-hobby="${h.id}" data-sfx="none" aria-label="${h.name}"
        style="left:${x / VB_W * 100}%;top:${y / VB_H * 100}%;width:${w / VB_W * 100}%;height:${hh / VB_H * 100}%"></button>
      <span class="hit-tag" data-tag="${h.id}" style="left:${tx / VB_W * 100}%;top:${ty / VB_H * 100}%;translate:${-ax * 100}% -50%">${h.tag}</span>`;
  }).join("");
  const found = new Set();
  let roomLightsOn = false;

  // lantern position as fractions of the room; it glides toward the target
  const lamp = { x: .47, y: .55, tx: .47, ty: .55, ease: .3, moving: false };
  function sizeRoom() {
    room.style.setProperty("--r", Math.round(Math.max(70, Math.min(150, room.clientWidth * .19))) + "px");
  }
  function drawLamp() {
    room.style.setProperty("--x", (lamp.x * 100).toFixed(2) + "%");
    room.style.setProperty("--y", (lamp.y * 100).toFixed(2) + "%");
  }
  function stepLamp() {
    lamp.x += (lamp.tx - lamp.x) * lamp.ease;
    lamp.y += (lamp.ty - lamp.y) * lamp.ease;
    if (Math.abs(lamp.tx - lamp.x) < .001 && Math.abs(lamp.ty - lamp.y) < .001) { lamp.x = lamp.tx; lamp.y = lamp.ty; lamp.moving = false; }
    drawLamp();
    checkReveal();
    if (lamp.moving) requestAnimationFrame(stepLamp);
  }
  function aimLamp(fx, fy, ease) {
    lamp.tx = Math.max(0, Math.min(1, fx));
    lamp.ty = Math.max(0, Math.min(1, fy));
    lamp.ease = reduceMotion ? 1 : ease;
    if (!lamp.moving) { lamp.moving = true; requestAnimationFrame(stepLamp); }
  }
  // a hobby is found once the lantern's bright middle touches it
  function checkReveal() {
    if (roomLightsOn) return;
    const lx = lamp.x * VB_W, ly = lamp.y * VB_H, reach = Math.max(70, Math.min(150, room.clientWidth * .19)) / room.clientWidth * VB_W * .3;
    HOBBIES.forEach(h => {
      if (found.has(h.id)) return;
      const [x, y, w, hh] = h.rect;
      const dx = Math.max(x - lx, 0, lx - (x + w)), dy = Math.max(y - ly, 0, ly - (y + hh));
      if (Math.hypot(dx, dy) < reach) discover(h);
    });
  }
  function markFound(h) {
    found.add(h.id);
    $(`.hit[data-hobby="${h.id}"]`).classList.add("found");
    $(`.hit-tag[data-tag="${h.id}"]`).classList.add("found");
    foundCount.textContent = found.size;
  }
  function discover(h, quiet = false) {
    if (found.has(h.id)) return;
    markFound(h);
    if (quiet) return;
    restart($(`.hit-tag[data-tag="${h.id}"]`), "just");
    sfx.play.shiny();
    showCard(h);
    if (found.size === HOBBIES.length) {
      react("happy", "you found all five!! (finished: none of them. that's the tradition.)", 3200);
      toast("🏆 all 5 hobbies found! 0 finished.");
    } else {
      react("starry", `ooh, shiny. new hobby: ${h.name}!`);
    }
  }
  function showCard(h) {
    card.innerHTML = `<h3>🚧 ${h.name}</h3>
      <p>${h.note}</p>
      <div class="progress"><span>progress</span><span class="progress-bar"><i style="--p:${h.progress}%"></i></span><span>${h.progress}%</span></div>
      <p class="card-status">started ${h.started} · ${h.status}</p>
      ${h.pluck ? `<div class="card-actions"><button data-act="pluck" data-sfx="none">🎸 pluck the string</button></div>` : ""}
      ${h.open ? `<div class="card-actions"><button data-act="open" data-open="${h.open}">🏛️ visit the museum</button></div>` : ""}`;
  }

  // the guitar: one string, one note. pluck it three times quickly for Lumi's greatest hit
  let plucks = [];
  function pluckString() {
    const s = $("#room-scene .string");
    if (!reduceMotion) restart(s, "twang");
    sfx.play.pluck(196);
    const now = Date.now();
    plucks = plucks.filter(t => now - t < 1800).concat(now);
    if (plucks.length >= 3) {
      plucks = [];
      [196, 196, 293.7, 293.7, 329.6, 329.6, 293.7].forEach((f, i) => sfx.play.pluck(f, .45 + i * .32));
      secret("song");
      react("starry", "i'm a musician now!! (new hobby.)", 3400);
      toast("🎸 Lumi's Greatest Hit: Twinkle Twinkle, one-string edition ♪");
    }
  }
  card.addEventListener("click", (e) => {
    if (e.target.closest('[data-act="pluck"]')) pluckString();
  });

  // pointer: the lantern follows a mouse and glides to wherever a finger taps
  const roomPoint = (e) => {
    const r = room.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  room.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch") aimLamp(...roomPoint(e), .3);
  });
  room.addEventListener("pointerdown", (e) => aimLamp(...roomPoint(e), e.pointerType === "touch" ? .14 : .3));
  roomHits.addEventListener("click", (e) => {
    const btn = e.target.closest(".hit");
    if (!btn) return;
    const h = HOBBIES.find(x => x.id === btn.dataset.hobby);
    if (!found.has(h.id)) discover(h);
    else showCard(h);
    if (h.pluck) pluckString();
    else if (found.has(h.id)) sfx.play.pop();
  });
  // keyboard: tabbing onto a hobby carries the lantern to it
  roomHits.addEventListener("focusin", (e) => {
    const btn = e.target.closest(".hit");
    if (!btn || !btn.matches(":focus-visible")) return;
    const [x, y, w, hh] = HOBBIES.find(h => h.id === btn.dataset.hobby).rect;
    aimLamp((x + w / 2) / VB_W, (y + hh / 2) / VB_H, .2);
  });

  function setRoomLights(on) {
    roomLightsOn = on;
    room.classList.toggle("lit", on || document.body.classList.contains("lit"));
    roomSwitch.textContent = on ? "🌙 lights off again" : "💡 flip the light switch";
    $("#t-room").textContent = on ? "hobby_room.exe (lights on)" : "hobby_room.exe (lights off)";
    if (on) HOBBIES.forEach(h => discover(h, true));
  }
  roomSwitch.addEventListener("click", () => {
    setRoomLights(!roomLightsOn);
    if (roomLightsOn) react("wink", "hey! that's cheating. …okay, it is kind of nice in here.");
  });
  sizeRoom();
  drawLamp();
  addEventListener("resize", sizeRoom);

  // ======================================================================
  //  Story: an interactive storybook that ends with the lantern lighting up the site
  // ======================================================================
  const STORY = [
    { mood: "sleepy", text: "Once, in a paint box under a desk lamp, something small and fuzzy hatched. It was mostly fluff, and a little bit paint." },
    { mood: "starry", text: "The first thing it ever saw was the lamp. “Ooh,” said Lumi. “Shiny.”" },
    { mood: "curious", text: "Every night since, Lumi chases a new light and starts a new hobby. Moons. Stars. Dew drops. One (1) guitar string." },
    { mood: "sad", text: "It has never finished a single one. Sometimes that makes Lumi droopy. (Cookies help.)" },
    { mood: "wink", text: "Except one thing: the very first thing Lumi ever made. A little lantern, to carry the shiny everywhere." },
    { mood: "happy", text: "And tonight, Lumi wants to light it for you.", finale: true },
  ];
  const storyArt = $("#story-art"), storyText = $("#story-text"), storyPrev = $("#story-prev"), storyNext = $("#story-next"), storyDots = $("#story-dots");
  let page = 0;
  const isLit = () => document.body.classList.contains("lit");
  function renderStory(turn = true) {
    const p = STORY[page];
    storyArt.innerHTML = lumi(p.mood);
    if (turn && !reduceMotion) restart(storyArt, "turn");
    storyText.textContent = p.finale && isLit() ? "…and the whole night lit up. The end (for now). ✨" : p.text;
    storyPrev.disabled = page === 0;
    if (p.finale) {
      storyNext.textContent = isLit() ? "🌙 lights off" : "🏮 light the lantern";
      storyNext.setAttribute("aria-label", isLit() ? "Turn the lights off" : "Light the lantern");
      storyNext.dataset.sfx = "none";
    } else {
      storyNext.textContent = "next ▸";
      storyNext.setAttribute("aria-label", "Next page");
      delete storyNext.dataset.sfx;
    }
    storyNext.classList.toggle("lantern-btn", !!p.finale);
    storyDots.innerHTML = STORY.map((_, i) => `<i class="${i === page ? "on" : ""}"></i>`).join("");
    look();
  }
  storyPrev.addEventListener("click", () => { if (page > 0) { page--; renderStory(); } });
  storyNext.addEventListener("click", () => {
    if (STORY[page].finale) setLit(!isLit(), storyNext);
    else { page++; renderStory(); }
  });
  renderStory(false);

  // the finale: light bursts out of the lantern and the whole site glows
  const lightsItem = $("#menu-lights");
  function setLit(on, from) {
    if (on === isLit()) return;
    document.body.classList.toggle("lit", on);
    setRoomLights(roomLightsOn);
    lightsItem.textContent = on ? "🌙 lights off" : "🏮 light the lantern";
    if (on) {
      if (!reduceMotion && from) {
        const r = from.getBoundingClientRect(), b = document.createElement("div");
        b.className = "burst";
        b.style.left = r.left + r.width / 2 + "px";
        b.style.top = r.top + r.height / 2 + "px";
        b.addEventListener("animationend", () => b.remove());
        document.body.append(b);
      }
      sfx.play.chime();
      clearTimeout(pal.timer);
      clearInterval(pal.calm);
      pal.pokes = 0;
      setMood("happy");
      say("it worked!! i FINISHED something!! (the lantern. it was always the lantern.)");
      pal.timer = setTimeout(() => setMood("curious"), 5000);
      toast("🏮 the lantern lit up the whole site. the end (for now) ✨", 4200);
    } else {
      sfx.play.close();
      react("sleepy", "…back to the cozy dark. goodnight, lantern.", 2600);
    }
    if (STORY[page].finale) renderStory(false);
  }
  lightsItem.addEventListener("click", () => {
    setLit(!isLit(), lightsItem);
    toggleMenu(false);
  });

  // ======================================================================
  //  Museum of useless facts
  // ======================================================================
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
  const factEl = $("#fact"), factNum = $("#fact-num");
  let factIdx = store.get("fact", 0) % FACTS.length;
  const showFact = () => {
    factEl.textContent = FACTS[factIdx];
    factNum.textContent = String(factIdx + 1).padStart(2, "0");
  };
  $("#fact-next").addEventListener("click", () => {
    factIdx = (factIdx + 1) % FACTS.length;
    store.set("fact", factIdx);
    showFact();
  });
  showFact();

  // ======================================================================
  //  Talk to Lumi: it chats back (keyword replies in Lumi's voice)
  // ======================================================================
  // [pattern, mood or "", replies]; the first match wins
  const CHAT = [
    [/\b(stupid|ugly|hate|dumb|boring|annoying|go away)\b/, "sad", ["…that hurt my feelings. *droops*", "*sniff* i'm only marshmallow-sized, you know."]],
    [/\b(cookies?|snacks?|food|hungry|eat)\b/, "starry", ["did someone say COOKIE?? the jar is right there. 🍪", "food is my second favourite hobby. the first is also food."]],
    [/\bfacts?\b/, "wink", null],
    [/\b(love|cute|adorable|sweet|pretty|best)\b/, "happy", ["*blushes so hard my fluff turns pink*", "stop it. (don't stop it.)"]],
    [/\b(sad|cry|lonely|tired of|bad day)\b/, "happy", ["here, have a tiny fluffy hug. *hug*", "you can borrow my lantern for a bit. it helps."]],
    [/\b(guitar|music|songs?|sing)\b/, "starry", ["i know one song. on one string. the guitar is in my hobby room…"]],
    [/\b(hobby|hobbies|art|paint|draw|craft)\b/, "curious", ["my newest hobby is talking to you. it's 2% finished.", "come see my hobby room! bring the lantern, it's dark."]],
    [/\b(finish|finished|done|complete)\b/, "wink", ["finishing things is not my hobby. starting things is.", "i finished ONE thing. ask the story about it."]],
    [/\b(moon|stars?|shiny|light|lamp|lantern|sparkle)\b/, "starry", ["OOH. shiny. tell me more.", "the lantern is the only thing i ever finished. isn't it pretty?"]],
    [/\b(sleep|sleepy|night|bed|nap)\b/, "curious", ["sleep? at night? i've heard of it. never tried it.", "nights are for hobbies. days are for naps."]],
    [/\b(who|what are you|your name|moth)\b/, "curious", ["i'm Lumi! a baby moth. marshmallow-sized. professional hobby starter."]],
    [/\b(bye|goodnight|good night|see you|cya)\b/, "happy", ["goodnight!! leave the lantern on for me. 🏮", "bye bye! come back soon, i'll have new hobbies."]],
    [/\b(hi|hii+|hello|hey|yo|hiya)\b/, "happy", ["hi!! you're my favourite visitor. (you're also my only visitor right now.)", "hello hello! want a cookie? i mean, can i have a cookie?"]],
  ];
  const SHRUG = ["ooh. i don't know what that means, but i love it.", "*nods wisely* (i did not understand)", "that sounds like a new hobby. writing it down… lost the pencil."];
  const chatForm = $("#chat"), chatInput = $("#chat-input");
  let chatTimer = 0;
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const said = chatInput.value.trim().toLowerCase();
    if (!said) return;
    chatInput.value = "";
    pal.lastActive = Date.now();
    if (pal.mood === "sleepy") wake();
    say("…");
    clearTimeout(chatTimer);
    chatTimer = setTimeout(() => {
      if (pal.mood === "flop") { say("x_x (Lumi can't talk right now. it's busy being flopped. try a cookie.)"); return; }
      const rule = CHAT.find(([re]) => re.test(said));
      const reply = rule ? (rule[2] ? pick(rule[2]) : `fact! ${pick(FACTS)}`) : pick(SHRUG);
      const mood = rule ? rule[1] : "curious";
      if (mood === "sad") {
        clearTimeout(pal.timer);
        setMood("sad");
        bump("shiver");
        sfx.play.sad();
        pal.pokes = Math.max(pal.pokes, 4);
        clearInterval(pal.calm);
        pal.calm = setInterval(calmDown, 3500);
        say(reply);
        return;
      }
      if (calm() || pal.mood === "fed") moodFor(mood, 2600);
      sfx.play.pop();
      say(reply);
    }, 450);
  });

  // ======================================================================
  //  Guestbook (kept in this browser)
  // ======================================================================
  const SEED = [
    { name: "a passing firefly", msg: "nice lantern!! we should glow together sometime", when: "Oct 17" },
    { name: "the desk lamp", msg: "please stop staring at me.", when: "Oct 17" },
    { name: "the moon", msg: "🌙", when: "every night" },
  ];
  const guestList = $("#guest-list"), guestForm = $("#guest-form");
  let notes = store.get("guestbook", []);
  if (!Array.isArray(notes)) notes = [];
  function renderGuests() {
    guestList.replaceChildren(...notes.map(n => ({ ...n, mine: true })).concat(SEED).map(n => {
      const li = document.createElement("li");
      if (n.mine) li.className = "mine";
      const who = document.createElement("span"), when = document.createElement("span"), msg = document.createElement("div");
      who.className = "who"; who.textContent = String(n.name).slice(0, 24);
      when.className = "when"; when.textContent = String(n.when).slice(0, 16);
      msg.textContent = String(n.msg).slice(0, 160);
      li.append(who, when, msg);
      return li;
    }));
  }
  guestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = guestForm.elements.name.value.trim(), msg = guestForm.elements.msg.value.trim();
    if (!name || !msg) return;
    notes.unshift({ name, msg, when: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
    notes = notes.slice(0, 20);
    store.set("guestbook", notes);
    renderGuests();
    guestForm.reset();
    sfx.play.shiny();
    react("happy", `${name.slice(0, 24)} signed my guestbook!! i'm framing it.`, 2600);
  });
  renderGuests();

  // webring: also under construction, naturally
  $$("[data-ring]").forEach(b => b.addEventListener("click", () => {
    toast("🌙 the night-moth webring is under construction too. (Lumi started it at 2 AM.)");
  }));

  // ======================================================================
  //  Secrets
  // ======================================================================
  const secrets = new Set(store.get("secrets", []));
  const secretCount = $("#secret-count");
  const showSecrets = () => { if (secretCount) secretCount.textContent = secrets.size; };
  function secret(id) {
    secrets.add(id);
    store.set("secrets", [...secrets]);
    showSecrets();
  }
  showSecrets();

  // type "cookie" anywhere (outside the guestbook) for a cookie storm
  let typed = "";
  addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea") || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed !== "cookie") return;
    typed = "";
    secret("cookie");
    toast("🍪 COOKIE STORM! you found a secret.");
    if (!reduceMotion) {
      for (let i = 0; i < 26; i++) {
        const c = document.createElement("div");
        c.className = "rain";
        c.innerHTML = COOKIE;
        c.style.left = Math.random() * 100 + "vw";
        c.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
        c.style.animationDelay = Math.random() * 1.2 + "s";
        c.style.setProperty("--spin", Math.round(Math.random() * 720 - 360) + "deg");
        c.addEventListener("animationend", () => c.remove());
        document.body.append(c);
      }
    }
    setTimeout(feed, 500);
  });

  // ======================================================================
  //  Moth dust: a sparkle trail that drifts down like scales off a wing
  // ======================================================================
  const dust = (() => {
    const cv = $("#dust"), g = cv.getContext("2d");
    const COLORS = ["#f6cf6a", "#fde7a8", "#f8b0bf", "#e8d6f7", "#fff3c4"];
    let on = !reduceMotion && store.get("trail", true), parts = [], running = false, dpr = 1, lx = -99, ly = -99;
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(innerWidth * dpr);
      cv.height = Math.round(innerHeight * dpr);
    };
    const frame = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(p => (p.life -= .016) > 0);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += .012;
        g.globalAlpha = Math.min(1, p.life * 1.6);
        g.fillStyle = p.c;
        g.beginPath();
        if (p.star) {
          const s = p.s * 1.8;
          g.moveTo(p.x, p.y - s);
          g.quadraticCurveTo(p.x, p.y, p.x + s, p.y);
          g.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
          g.quadraticCurveTo(p.x, p.y, p.x - s, p.y);
          g.quadraticCurveTo(p.x, p.y, p.x, p.y - s);
        } else {
          g.arc(p.x, p.y, p.s * .6, 0, Math.PI * 2);
        }
        g.fill();
      }
      g.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(frame);
      else running = false;
    };
    addEventListener("pointermove", (e) => {
      if (!on || Math.hypot(e.clientX - lx, e.clientY - ly) < 7) return;
      lx = e.clientX; ly = e.clientY;
      for (let i = 0; i < 2; i++) {
        parts.push({ x: lx + (Math.random() - .5) * 6, y: ly + (Math.random() - .5) * 6, vx: (Math.random() - .5) * .7, vy: Math.random() * .5 + .1,
          life: .8 + Math.random() * .5, s: 1.4 + Math.random() * 2.2, c: pick(COLORS), star: Math.random() < .35 });
      }
      if (parts.length > 180) parts.splice(0, parts.length - 180);
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
    addEventListener("resize", size);
    size();
    return {
      get on() { return on; },
      set on(v) { on = v; store.set("trail", v); if (!v) { parts = []; g.clearRect(0, 0, cv.width, cv.height); } },
    };
  })();
  const trailItem = $("#menu-trail");
  const showTrail = () => { trailItem.textContent = `✨ moth dust: ${dust.on ? "on" : "off"}`; };
  if (reduceMotion) trailItem.hidden = true;
  trailItem.addEventListener("click", () => { dust.on = !dust.on; showTrail(); });
  showTrail();

  // ======================================================================
  //  Chaos mode: every window tilts its own way (gentler on small screens)
  // ======================================================================
  const chaosItem = $("#menu-chaos");
  function setChaos(on) {
    document.body.classList.toggle("chaos", on);
    chaosItem.textContent = `🌀 chaos mode: ${on ? "on" : "off"}`;
    const spread = matchMedia("(max-width: 699px)").matches ? 1.6 : 3.4;
    wins.forEach(w => {
      if (on) w.style.setProperty("--tilt", ((Math.random() * 2 - 1) * spread).toFixed(2) + "deg");
      else w.style.removeProperty("--tilt");
    });
  }
  chaosItem.addEventListener("click", () => {
    const on = !document.body.classList.contains("chaos");
    setChaos(on);
    toggleMenu(false);
    if (on) { sfx.play.giggle(); react("starry", "CHAOS MODE!! this is my favourite hobby now.", 2600); toast("🌀 chaos mode on. everything is fine."); }
    else react("wink", "phew. tidy again. (for now.)");
  });
})();
