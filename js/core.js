// Shared pieces for every screen: storage, sound, toasts, counters, Lumi's art, eye-follow and the router.
// sticker(), blob() and C come from lumi.js. Everything else hangs off window.app.
(() => {
  "use strict";

  const app = (window.app = {});
  const $ = (app.$ = (s, el = document) => el.querySelector(s));
  const $$ = (app.$$ = (s, el = document) => [...el.querySelectorAll(s)]);
  app.pick = (list) => list[Math.floor(Math.random() * list.length)];
  app.reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  app.restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // ---------- memory: localStorage can throw (private windows, blocked storage), so every access is guarded ----------
  app.store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("lumi." + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem("lumi." + key, JSON.stringify(value)); } catch { /* Lumi forgets, that's all */ } },
  };
  const store = app.store;

  // ---------- Lumi's art ----------
  // The bead necklace you can string in the attic. It goes in just after the fluff, so the face, paws
  // and lantern stay in front of it, and turns with the head; only the sitting poses have a neck for it.
  const NECK_MOODS = ["curious", "happy", "excited", "shy", "proud", "love", "surprised", "confused", "sad", "hurt", "fed", "thinking", "starry"];
  // The necklace follows the neckline (a squashed ellipse where the head's fluff meets the body's). How many beads
  // fit is worked out from the length of that curve and the smallest bead that still reads as a bead, and
  // the beads shrink to stay side by side as more are added, so no number is written in by hand.
  const NECK = { rx: 56, ry: 27, cy: 159.5, half: 56, rMax: 5.4, rMin: 3.8, tip: 4.5 };
  const neckAt = (deg, k = 1) => [120 + NECK.rx * k * Math.cos(deg * Math.PI / 180), NECK.cy + NECK.ry * k * Math.sin(deg * Math.PI / 180)];
  const neckLength = (() => {
    let len = 0, prev = neckAt(90 - NECK.half);
    for (let i = 1; i <= 64; i++) { const p = neckAt(90 - NECK.half + 2 * NECK.half * i / 64); len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; }
    return len;
  })();
  // the most beads that fit, and the bead size (touching, at most rMax) for a necklace of n beads
  app.NECK_MAX = Math.floor(neckLength / (2 * NECK.rMin)) + 1;
  const beadSize = (n) => n > 1 ? Math.min(NECK.rMax, neckLength / (n - 1) / 2 * .98) : NECK.rMax;
  app.necklaceSvg = (beads) => {
    const n = beads.length, r = beadSize(n), half = NECK.half;
    const [x0, y0] = neckAt(90 + half + 7), [x1, y1] = neckAt(90 - half - 7), [cx, cy] = neckAt(90, 1.1);
    const out = [`<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q${cx.toFixed(1)} ${(cy + 6).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="#cdb6ec" stroke-width="1.8"/>`];
    // the dew-drop pendant hangs from the middle
    const py = NECK.cy + NECK.ry - 2;
    out.push(`<path d="M120 ${py} Q126.5 ${py + 9} 120 ${py + 15} Q113.5 ${py + 9} 120 ${py}Z" fill="#cfeafa" stroke="#8fc3e8" stroke-width="1.6"/><ellipse cx="118" cy="${py + 8}" rx="1.4" ry="2.4" fill="#fff"/>`);
    beads.forEach((color, i) => {
      const [x, y] = neckAt(n === 1 ? 90 : 90 + half - 2 * half * i / (n - 1));
      out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" stroke="rgba(90, 60, 110, .35)" stroke-width="1.1"/><circle cx="${(x - r * .33).toFixed(1)}" cy="${(y - r * .33).toFixed(1)}" r="${(r * .29).toFixed(2)}" fill="#fff" opacity=".85"/>`);
    });
    return out.join("");
  };
  let necklace = store.get("necklace", null);
  // The head and the body are placed separately in each pose (a turned head sits a little off the body's middle),
  // so the necklace is slid sideways until it is centred on the body, and stays just under the chin.
  // These read the SVG transforms the art uses (translate, scale, rotate) as [a, b, c, d, e, f].
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const matrix = (list) => [...(list || "").matchAll(/(translate|scale|rotate)\(([^)]*)\)/g)].reduce((m, [, fn, args]) => {
    const v = args.trim().split(/[\s,]+/).map(Number);
    if (fn === "translate") return mul(m, [1, 0, 0, 1, v[0], v[1] || 0]);
    if (fn === "scale") return mul(m, [v[0], 0, 0, v[1] ?? v[0], 0, 0]);
    const t = v[0] * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), [cx = 0, cy = 0] = v.slice(1);
    return mul(mul(m, [1, 0, 0, 1, cx, cy]), mul([c, s, -s, c, 0, 0], [1, 0, 0, 1, -cx, -cy]));
  }, [1, 0, 0, 1, 0, 0]);
  const at = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const wear = (svg, mood, beads) => {
    if (!Array.isArray(beads) || !beads.length || !NECK_MOODS.includes(mood)) return svg;
    const head = svg.match(/<g transform="([^"]*)"><g transform="rotate\((-?[\d.]+) 120 123\)">/);
    const body = svg.match(/<g transform="([^"]*)"><clipPath id="[^"]*bc">/);
    const fig = svg.match(/<g transform="([^"]*)">\s*<g transform="[^"]*"><g class="wl">/);
    const halo = svg.search(/<circle cx="[\d.]+" cy="[\d.]+" r="[\d.]+" fill="#ffe7a0"/);
    if (!head || halo < 0) return svg;
    // where the neckline's middle lands (in the figure's space) when it rides on the head, and on the body
    const mHead = matrix(`${head[1]} rotate(${head[2]} 120 123)`), mBody = body ? matrix(body[1]) : mHead;
    const onHead = at(mHead, 120, NECK.cy + NECK.ry), onBody = at(mBody, 119, NECK.cy + NECK.ry);
    const slide = +(onBody[0] - onHead[0]).toFixed(1);
    // a tilted head would tilt the necklace with it (its right end rides up); level it to the body instead,
    // then tip it a little clockwise so its right side drops onto the neck
    const angle = (m) => Math.atan2(m[1], m[0]) * 180 / Math.PI;
    const level = +(angle(mBody) - angle(mHead) + NECK.tip).toFixed(1);
    const worn = `<g transform="${fig ? fig[1] : ""}"><g transform="translate(${slide} 0)"><g transform="${head[1]}"><g transform="rotate(${head[2]} 120 123)"><g transform="rotate(${level} 120 ${NECK.cy + NECK.ry})">${app.necklaceSvg(beads)}</g></g></g></g></g>`;
    return svg.slice(0, halo) + worn + svg.slice(halo);
  };
  // sticker() draws Lumi on a sticker card with a label underneath; the site only wants Lumi itself.
  // The cream ground shadows (and the flop's) suit the cream panels; on the night sky (sky = true) they glow, so they go.
  // beads: try a necklace on without wearing it (the bead table's preview)
  app.art = (mood, sky = false, beads = necklace) => {
    const svg = wear(sticker(mood)
      .replace(/<rect x="-23\.2"[^>]*\/>/, "")
      .replace(/<text x="117" y="259"[\s\S]*?<\/text>/, ""), mood, beads);
    return sky ? svg.replace(/<ellipse [^>]*fill="#(faeadb|f6e3cc)"[^>]*\/>/g, "") : svg;
  };
  // A still picture of a mood (an <img> source). Pictures are drawn once and are cheap to move around,
  // so they're used for thumbnails and the game; the live SVG is kept where the eyes follow you.
  let pictures = {};
  app.artURL = (mood, sky = false) => (pictures[mood + (sky ? ".sky" : "")] ||= URL.createObjectURL(new Blob([app.art(mood, sky)], { type: "image/svg+xml" })));
  // putting on (or taking off) the necklace redraws every picture; screens listening for "lumi:wear" redraw theirs
  app.necklace = () => necklace;
  app.wear = (beads) => {
    necklace = beads && beads.length ? beads.slice(0, app.NECK_MAX) : null;
    store.set("necklace", necklace);
    Object.values(pictures).forEach(u => URL.revokeObjectURL(u));
    pictures = {};
    dispatchEvent(new Event("lumi:wear"));
  };

  app.COOKIE = `<svg viewBox="103 181 34 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="${blob(120, 198, 15, 14.5, 13, .05)}" fill="#d9a066" stroke="#c08a55" stroke-width="2"/>
    <circle cx="114" cy="193" r="2.6" fill="${C.nose}"/><circle cx="124" cy="196" r="2.6" fill="${C.nose}"/>
    <circle cx="117" cy="204" r="2.6" fill="${C.nose}"/><circle cx="127" cy="205" r="1.8" fill="${C.nose}"/></svg>`;

  // ---------- sound: tiny synth notes made with Web Audio, no files ----------
  // The AudioContext is only created inside a real tap or key press, so browsers never block it.
  let gestured = false;
  const activated = () => (navigator.userActivation ? navigator.userActivation.hasBeenActive : gestured);
  app.sfx = (() => {
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
    // a music box: soft bell notes (a sine plus two quiet overtones) on their own volume knob,
    // so a tune can be stopped at once. notes: [frequency or 0 for a rest, beats]
    const bell = (c, out, f, t, len) => {
      [[1, .5, 1], [2, .1, .45], [3.01, .04, .3]].forEach(([m, vol, decay]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.frequency.value = f * m;
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + .012);
        g.gain.exponentialRampToValueAtTime(.0001, t + len * decay);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + len * decay + .05);
      });
    };
    const music = (notes, beat) => {
      const c = ready();
      if (!c) return null;
      const bus = c.createGain();
      bus.connect(master);
      const t0 = c.currentTime + .05;
      let at = 0;
      for (const [f, beats] of notes) {
        if (f) bell(c, bus, f, t0 + at, Math.min(2.6, beats * beat + 1.1));
        at += beats * beat;
      }
      return {
        seconds: at,
        stop() {
          const t = c.currentTime;
          bus.gain.setValueAtTime(bus.gain.value, t);
          bus.gain.linearRampToValueAtTime(0, t + .15);
          setTimeout(() => bus.disconnect(), 400);
        },
      };
    };
    const play = {
      click: () => tone("sine", 880, 660, .07, 0, .45),
      pop: () => tone("sine", 600, 900, .08, 0, .4),
      giggle: () => [900, 1000, 1100].forEach((f, i) => tone("sine", f, f * 1.35, .07, i * .09, .45)),
      sad: () => tone("sine", 520, 300, .5, 0, .5),
      flop: () => { tone("triangle", 300, 90, .35, 0, .8); crunch(.12, .3, 180, .8); },
      munch: () => [0, .14, .28].forEach((at, i) => crunch(.07, at, 1500 + i * 150, .6)),
      shiny: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone("sine", f, f, .25, i * .07, .35)),
      chime: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone("sine", f, f, .9, i * .11, .3)),
      yawn: () => tone("sine", 420, 260, .7, 0, .3),
      catch: () => { tone("sine", 1319, 1319, .12, 0, .3); tone("sine", 1760, 1760, .18, .06, .3); },
      plip: () => tone("sine", 900, 380, .22, 0, .5),
      pluck: (f = 196, at = 0) => pluck(f, at),
    };
    return {
      play,
      music,
      // start (or wake) the audio inside a real tap or key press; iPhones only allow it there
      unlock() { const c = ready(); return !!c && c.state === "running"; },
      get muted() { return muted; },
      setMuted(m) { muted = m; store.set("muted", m); if (m && ctx) ctx.suspend(); },
    };
  })();
  const sfx = app.sfx;

  const GESTURES = ["pointerdown", "touchend", "click", "keydown"];
  const unlockAudio = (e) => {
    // a finger touching down doesn't count as a gesture yet; lifting it does
    if (e.type !== "pointerdown" || e.pointerType === "mouse") gestured = true;
    if (sfx.unlock()) GESTURES.forEach(t => removeEventListener(t, unlockAudio, true));
  };
  GESTURES.forEach(t => addEventListener(t, unlockAudio, { capture: true, passive: true }));

  // every button and link clicks softly unless it makes its own sound
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button, a[href]");
    if (b && !b.dataset.sfx) sfx.play.click();
  });

  const muteBtn = $("#mute"), muteLabel = $("#mute-label");
  const showMute = () => {
    muteBtn.setAttribute("aria-pressed", String(sfx.muted));
    muteBtn.setAttribute("aria-label", sfx.muted ? "Sound is off. Turn sound on" : "Sound is on. Mute");
    muteLabel.textContent = sfx.muted ? "sound off" : "sound on";
  };
  muteBtn.addEventListener("click", () => {
    sfx.setMuted(!sfx.muted);
    showMute();
    if (!sfx.muted) sfx.play.pop();
  });
  showMute();

  // ---------- toast ----------
  const toastEl = $("#toast");
  let toastTimer = 0;
  app.toast = (msg, ms = 3400) => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    app.restart(toastEl, "show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  };

  // ---------- odometers and the visit memory ----------
  app.odometer = (el, n) => {
    if (!el) return;
    const s = String(Math.min(n, 999999)).padStart(6, "0");
    if (!el.children.length) {
      el.innerHTML = [...s].map(d => `<span class="digit"><span>${d}</span></span>`).join("");
    } else {
      [...el.children].forEach((dg, i) => {
        if (dg.textContent === s[i]) return;
        dg.innerHTML = `<span>${s[i]}</span>`;
        app.restart(dg, "roll");
      });
    }
    el.setAttribute("aria-label", String(n));
  };
  app.visits = store.get("visits", 0) + 1;
  app.lastVisit = store.get("last", 0);
  store.set("visits", app.visits);
  store.set("last", Date.now());
  app.odometer($("#odo-visits"), app.visits);
  app.odometer($("#odo-visits-2"), app.visits);

  app.timeStr = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  app.isNight = () => { const h = new Date().getHours(); return h >= 21 || h < 5; };

  // ---------- secrets ----------
  const secrets = new Set(store.get("secrets", []));
  const showSecrets = () => { $("#secret-count").textContent = secrets.size; };
  app.secret = (id) => { secrets.add(id); store.set("secrets", [...secrets]); showSecrets(); };
  showSecrets();

  // ---------- every visible Lumi's eyes follow the pointer (mouse, pen or touch), once per frame ----------
  let px = innerWidth / 2, py = innerHeight / 3, lookQueued = false;
  app.look = () => {
    lookQueued = false;
    $$(".view:not([hidden]) .pupil, .menu[open] .pupil").forEach(p => {
      const r = p.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy) || 1, m = Math.min(3, len / 40);
      p.setAttribute("transform", `translate(${((dx / len) * m).toFixed(2)} ${((dy / len) * m).toFixed(2)})`);
    });
  };
  const queueLook = (e) => {
    px = e.clientX; py = e.clientY;
    if (!lookQueued) { lookQueued = true; requestAnimationFrame(app.look); }
  };
  addEventListener("pointermove", queueLook, { passive: true });
  addEventListener("pointerdown", queueLook, { passive: true });

  // ---------- router: one screen at a time, picked by the URL hash ----------
  const TITLES = { home: "", about: "About Lumi", hobbies: "Hobbies", room: "Lumi's Attic", attic2: "Lumi's Attic 2", sheet: "Character Sheet", dress: "Dress up Lumi", play: "Star Catch", story: "Story", guestbook: "Guestbook", chat: "Talk to Lumi", facts: "Useless Facts", credits: "Credits" };
  const TAB_OF = { room: "hobbies", attic2: "hobbies", sheet: "home", dress: "hobbies" };
  const hooks = {};
  let current = null;
  app.onView = (name, enter, leave) => { hooks[name] = { enter, leave }; };
  app.view = () => current;
  function show() {
    let name = decodeURIComponent(location.hash.slice(1)) || "home";
    if (!(name in TITLES)) name = "home";
    if (name === current) return;
    const first = current === null;
    if (current) hooks[current]?.leave?.();
    $$(".view").forEach(v => { v.hidden = v.dataset.view !== name; });
    document.body.dataset.view = name;
    const mark = (a, on) => (on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    $$(".tabs a").forEach(a => mark(a, a.dataset.tab === (TAB_OF[name] || name)));
    $$(".menu-list a").forEach(a => mark(a, a.hash === "#" + name));
    document.title = TITLES[name] ? `${TITLES[name]} · Lumi's Night Shift` : "Lumi's Night Shift";
    scrollTo({ top: 0, behavior: "instant" });
    // a page that can be reached from several places (the museum) sends its back arrow to the page you came from
    $$(".back[data-back]").forEach(a => a.setAttribute("href", "#" + (current && current !== name ? current : a.dataset.back)));
    current = name;
    // move focus to the new screen's heading so keyboard and screen-reader users land in the right place
    if (!first) $(`.view[data-view="${name}"] h1`)?.focus({ preventScroll: true });
    hooks[name]?.enter?.();
    requestAnimationFrame(app.look);
  }
  app.start = () => {
    addEventListener("hashchange", show);
    show();
  };
})();
