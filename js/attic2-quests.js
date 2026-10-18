// Lumi's Attic 2 quests: the paint easel, the guitar string and the guitar lessons, all in Attic 2's own card.
// This is Attic 2's own code. The lantern attic (hobbies.js) has its own copy and the two never touch each other;
// they only share what the browser has saved (the painting on the wall, and the stars earned on the guitar).
(() => {
  "use strict";
  const { $, $$, sfx, store, restart, reduceMotion } = app;
  const card = $("#a2-card");

  // ---------- the easel: paint with Lumi, and the painting goes up on the wall ----------
  // Each stroke is drawn solid on a "wet" layer shown see-through, then laid onto the paper at the same
  // strength when you lift the brush, so overlapping strokes darken like watercolour.
  const PAPER = "#fffdf6";
  const PAINTS = [["#f6cf6a", "moon gold"], ["#ee8196", "pink"], ["#8fc3e8", "sky blue"], ["#a993d6", "lilac"],
    ["#8fcf9a", "mint"], ["#4b3b7c", "midnight"], [PAPER, "eraser"]];
  const brush = { color: PAINTS[0][0], size: 7, at: null };
  let paintTools = null;   // undo, redo and clear for the easel that is open
  let onHang = () => {};   // what to do with a painting that was hung up
  function easel() {
    card.hidden = false;
    card.innerHTML = `<h3>paint with Lumi</h3>
      <p>paint anything. it goes up on the attic wall. (it doesn't have to be finished. nothing up here is.)</p>
      <div class="paint-wrap">
        <canvas class="paint-paper" id="a2-paper" role="img" aria-label="Painting paper: paint with your mouse or finger"></canvas>
        <canvas class="paint-wet" id="a2-wet" aria-hidden="true"></canvas>
      </div>
      <div class="paint-pots" role="group" aria-label="Paints">${PAINTS.map(([c, n]) =>
        `<button class="paint-pot${c === PAPER ? " eraser" : ""}" data-a2-color="${c}" style="--c:${c}" aria-label="${n}" aria-pressed="${c === brush.color}" data-sfx="none"></button>`).join("")}</div>
      <div class="bead-actions">
        <button class="btn btn-outline small" data-a2-undo aria-label="undo the last stroke" disabled>↶ undo</button>
        <button class="btn btn-outline small" data-a2-redo aria-label="redo the stroke you undid" disabled>↷ redo</button>
        <button class="btn btn-outline small" data-a2-size aria-pressed="${brush.size > 10}">big brush</button>
        <button class="btn btn-outline small" data-a2-clear>clear</button>
        <button class="btn btn-gold small" data-a2-hang data-sfx="none">🖼 hang it up</button>
      </div>`;
    const paper = $("#a2-paper"), wet = $("#a2-wet"), dpr = Math.min(2, devicePixelRatio || 1);
    const w = paper.clientWidth, h = Math.round(w * .75);
    for (const cv of [paper, wet]) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.getContext("2d").scale(dpr, dpr);
    }
    const pg = paper.getContext("2d"), wg = wet.getContext("2d");
    // Every stroke is remembered (as its points) so undo and redo can repaint the paper without it:
    // the painting already hanging is the base, strokes go on top, and "clear" is a step like any other.
    const strokes = [], undone = [];
    let base = null, now = null;
    const blank = () => { pg.fillStyle = PAPER; pg.fillRect(0, 0, w, h); };
    const seg = (color, size, a, b) => {
      wg.strokeStyle = color;
      wg.lineWidth = size;
      wg.lineCap = wg.lineJoin = "round";
      wg.beginPath();
      wg.moveTo(...a);
      wg.lineTo(...b);
      wg.stroke();
    };
    const lay = (color) => {
      pg.globalAlpha = color === PAPER ? 1 : .6;
      pg.drawImage(wet, 0, 0, w, h);
      pg.globalAlpha = 1;
      wg.clearRect(0, 0, w, h);
    };
    const redraw = () => {
      blank();
      if (base) pg.drawImage(base, 0, 0, w, h);
      for (const st of strokes) {
        if (st.clear) { blank(); continue; }
        st.pts.forEach((p, i) => seg(st.color, st.size, st.pts[Math.max(0, i - 1)], p));
        lay(st.color);
      }
    };
    const sync = () => {
      $("[data-a2-undo]", card).disabled = !strokes.length;
      $("[data-a2-redo]", card).disabled = !undone.length;
    };
    const record = (step) => { strokes.push(step); undone.length = 0; sync(); };
    blank();
    const saved = store.get("painting", null);
    if (saved) { const im = new Image(); im.onload = () => { base = im; redraw(); }; im.src = saved; }
    paintTools = {
      undo: () => { if (!brush.at && strokes.length) { undone.push(strokes.pop()); redraw(); sync(); } },
      redo: () => { if (!brush.at && undone.length) { strokes.push(undone.pop()); redraw(); sync(); } },
      clear: () => { if (!brush.at && (strokes.length || base) && !strokes.at(-1)?.clear) { blank(); record({ clear: true }); } },
    };
    const point = (e) => { const r = paper.getBoundingClientRect(); return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]; };
    const dry = () => {
      if (!brush.at) return;
      brush.at = null;
      lay(now.color);
      record(now);
      now = null;
    };
    paper.addEventListener("pointerdown", (e) => {
      try { paper.setPointerCapture(e.pointerId); } catch { /* a pointer that is already gone */ }
      brush.at = point(e);
      now = { color: brush.color, size: brush.size, pts: [brush.at] };
      seg(now.color, now.size, brush.at, brush.at);
    });
    paper.addEventListener("pointermove", (e) => {
      if (!brush.at) return;
      const p = point(e);
      seg(now.color, now.size, brush.at, p);
      now.pts.push(p);
      brush.at = p;
    });
    paper.addEventListener("pointerup", dry);
    paper.addEventListener("pointercancel", dry);
    wet.style.opacity = brush.color === PAPER ? 1 : .6;
  }

  // ---------- the guitar: one string, one note. pluck it three times quickly for Lumi's greatest hit ----------
  let plucks = [];
  function pluck() {
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

  // ---------- guitar lessons: Lumi plays a few notes, you play them back (strings come with each lesson) ----------
  // Twinkle, twinkle (traditional, public domain) in three bites. Nobody can fail: wrong notes only cost stars.
  const GT = { C: [261.6, "#ee8196"], D: [293.7, "#f4b68a"], E: [329.6, "#f6cf6a"], F: [349.2, "#8fcf9a"], G: [392, "#8fc3e8"], A: [440, "#a993d6"] };
  const LESSONS = [
    { name: "Twinkle, twinkle", notes: "CCGGAAG", strings: "CGA", words: "twin-kle twin-kle lit-tle star" },
    { name: "How I wonder", notes: "FFEEDDC", strings: "CDEFGA", words: "how I won-der what you are" },
    { name: "the whole song", notes: "CCGGAAGFFEEDDC", strings: "CDEFGA", words: "twinkle twinkle little star, how I wonder what you are" },
  ];
  // stars earned per lesson, kept in the browser (the lantern attic keeps the same ones)
  const stars = () => {
    const s = store.get("guitar", null);
    return Array.isArray(s) && s.length === 3 ? s.map(n => n | 0) : [0, 0, 0];
  };
  // what the guitar hobby says about itself, depending on how many strings it has grown
  app.a2guitar = () => {
    const s = stars(), n = 1 + (s[0] ? 2 : 0) + (s[1] ? 3 : 0);
    return {
      name: n === 1 ? "the guitar (one string)" : `the guitar (${n} strings)`,
      progress: s[2] ? 60 : n === 1 ? 5 : n < 6 ? 25 : 40,
      note: s[2] ? "can play one whole song. it is the same song. it is a very good song."
        : n === 1 ? "learned one string. it is a very good string. the other five are 'coming soon'."
        : `learned ${n} strings. the rest are coming soon (for real this time).`,
    };
  };
  let gt = null;   // the lesson that is open: { i, notes, phase: "listen" | "play" | "done", pos, mistakes, miss, timers, shown }
  const gtStop = () => { if (gt) { gt.timers.forEach(clearTimeout); gt.timers = []; } };
  const gtString = (note) => $(`#a2-strings [data-note="${note}"]`);
  function gtLight(note, hold = 320) {
    const b = gtString(note);
    if (!b) return;
    b.classList.add("lit");
    setTimeout(() => b.classList.remove("lit"), hold);
  }
  const gtSay = (text) => { const el = $("#a2-say"); if (el) el.textContent = text; };
  function gtDots() {
    $$("#a2-dots i").forEach((d, k) => {
      d.classList.toggle("done", k < gt.pos);
      d.textContent = gt.shown || k < gt.pos ? gt.notes[k] : "";
    });
  }
  function gtDemo() {
    gtStop();
    gt.phase = "listen";
    gt.pos = 0;
    gt.miss = 0;
    gtDots();
    $$("#a2-strings .hint").forEach(b => b.classList.remove("hint"));
    gtSay("listen… 👂");
    const gap = 560;
    [...gt.notes].forEach((n, k) => {
      sfx.play.pluck(GT[n][0], k * gap / 1000);
      gt.timers.push(setTimeout(() => gtLight(n), k * gap));
    });
    gt.timers.push(setTimeout(() => {
      if (app.view() !== "attic2" || !gtString(gt.notes[0])) return;
      gt.phase = "play";
      gtSay("your turn! tap the strings in the same order.");
    }, gt.notes.length * gap + 250));
  }
  function gtFinish() {
    const s = stars(), i = gt.i, got = gt.mistakes === 0 ? 3 : gt.mistakes <= 3 ? 2 : 1;
    gt.phase = "done";
    const first = !s[i];
    s[i] = Math.max(s[i], got);
    store.set("guitar", s);
    sfx.play.chime();
    gtSay(`${"⭐".repeat(got)} you played it!${gt.mistakes ? ` (${gt.mistakes} wrong note${gt.mistakes > 1 ? "s" : ""}. Lumi did not notice.)` : " (not one wrong note!)"}`);
    const next = $("[data-a2-next]", card);
    if (next && i < 2) next.hidden = false;
    $$("#a2-tabs [data-a2-lesson]").forEach((b, k) => { b.disabled = k > 0 && !s[k - 1]; b.querySelector("small").textContent = "★".repeat(s[k]) || "·"; });
    if (i === 2) {
      app.secret("song");
      app.toast("🎸 Lumi can play a whole song. Twinkle Twinkle, six strings!");
      app.lumi.react("starry", "i'm a musician now!! (new hobby. finished count: still 1.)", 4200);
    } else if (first) {
      app.lumi.react("proud", i === 0 ? "i have three strings now!!" : "six strings. the other five came!", 3600);
    } else {
      app.lumi.react("happy", "again! again!", 2600);
    }
  }
  function lesson(i) {
    gtStop();
    const s = stars();
    if (i === undefined) i = s[0] ? (s[1] ? 2 : 1) : 0; // pick up where you left off
    const L = LESSONS[i];
    gt = { i, notes: L.notes, phase: "listen", pos: 0, mistakes: 0, miss: 0, timers: [], shown: gt ? gt.shown : false };
    card.hidden = false;
    card.innerHTML = `<h3>🎶 guitar lesson</h3>
      <div class="gt-tabs" id="a2-tabs" role="group" aria-label="Lessons">${LESSONS.map((l, k) =>
        `<button class="btn ${k === i ? "btn-gold" : "btn-outline"} small" data-a2-lesson="${k}" aria-pressed="${k === i}" aria-label="lesson ${k + 1}: ${l.name}" data-sfx="none"${k > 0 && !s[k - 1] ? " disabled" : ""}>lesson ${k + 1} <small>${"★".repeat(s[k]) || "·"}</small></button>`).join("")}</div>
      <p class="gt-words"><b>${L.name}</b><br>“${L.words}”</p>
      <p class="gt-say" id="a2-say" role="status" aria-live="polite"></p>
      <div class="gt-dots" id="a2-dots" aria-hidden="true">${[...L.notes].map(() => "<i></i>").join("")}</div>
      <div class="gt-strings" id="a2-strings" role="group" aria-label="Guitar strings">${Object.keys(GT).map(n => {
        const on = L.strings.includes(n);
        return `<button class="gt-string${on ? "" : " locked"}" data-note="${n}" style="--c:${GT[n][1]}" aria-label="${n} string${on ? "" : " (coming soon)"}"${on ? "" : ' aria-disabled="true" tabindex="-1"'} data-sfx="none"><span>${n}</span>${on ? "" : "<small>soon</small>"}</button>`;
      }).join("")}</div>
      <div class="bead-actions">
        <button class="btn btn-outline small" data-a2-again>▶ listen again</button>
        <button class="btn btn-outline small" data-a2-show aria-pressed="${gt.shown}">show the notes</button>
        <button class="btn btn-gold small" data-a2-next data-sfx="none"${i < 2 && s[i] ? "" : " hidden"}>next lesson ›</button>
      </div>`;
    gtDots();
    $(".gt-string:not(.locked)", card).focus({ preventScroll: true });
    gtDemo();
  }
  function gtPlay(btn) {
    const n = btn.dataset.note;
    if (btn.classList.contains("locked")) { app.toast("that string is coming soon. (for real this time.)"); return; }
    sfx.play.pluck(GT[n][0]);
    gtLight(n, 260);
    if (!gt || gt.phase !== "play") return;
    if (n === gt.notes[gt.pos]) {
      gt.pos++;
      gt.miss = 0;
      $$("#a2-strings .hint").forEach(b => b.classList.remove("hint"));
      gtDots();
      if (gt.pos === gt.notes.length) gtFinish();
      else gtSay("yes!");
    } else {
      gt.mistakes++;
      gt.miss++;
      restart(btn, "oops");
      gtSay("hmm, not that one. try again.");
      if (gt.miss >= 2) { const t = gtString(gt.notes[gt.pos]); if (t) t.classList.add("hint"); gtSay("here, this one glows. (Lumi believes in you.)"); }
    }
  }

  // ---------- clicks inside the card ----------
  card.addEventListener("click", (e) => {
    const t = e.target;
    const pot = t.closest("[data-a2-color]");
    if (pot) {
      brush.color = pot.dataset.a2Color;
      card.querySelectorAll("[data-a2-color]").forEach(b => b.setAttribute("aria-pressed", String(b === pot)));
      $("#a2-wet").style.opacity = brush.color === PAPER ? 1 : .6;
      sfx.play.plip();
    } else if (t.closest("[data-a2-size]")) {
      brush.size = brush.size > 10 ? 7 : 16;
      t.closest("[data-a2-size]").setAttribute("aria-pressed", String(brush.size > 10));
    } else if (t.closest("[data-a2-undo]")) {
      paintTools?.undo();
    } else if (t.closest("[data-a2-redo]")) {
      paintTools?.redo();
    } else if (t.closest("[data-a2-clear]")) {
      paintTools?.clear();
    } else if (t.closest("[data-a2-hang]")) {
      // a small copy is kept (and framed on the wall), so it fits in the browser's storage
      const small = document.createElement("canvas");
      small.width = 320;
      small.height = 240;
      small.getContext("2d").drawImage($("#a2-paper"), 0, 0, 320, 240);
      const url = small.toDataURL("image/jpeg", .85);
      store.set("painting", url);
      onHang(url);
      sfx.play.chime();
      app.toast("🖼 your painting is on the attic wall now. Lumi is very proud of you.");
      app.lumi.react("proud", "it's going on the wall. next to my unfinished things. it fits right in.", 4000);
    } else if (t.closest(".gt-string")) {
      gtPlay(t.closest(".gt-string"));
    } else if (t.closest("[data-a2-lesson]")) {
      lesson(+t.closest("[data-a2-lesson]").dataset.a2Lesson);
      sfx.play.pop();
    } else if (t.closest("[data-a2-again]")) {
      gtDemo();
    } else if (t.closest("[data-a2-next]")) {
      lesson(gt.i + 1);
    } else if (t.closest("[data-a2-show]")) {
      gt.shown = !gt.shown;
      t.closest("[data-a2-show]").setAttribute("aria-pressed", String(gt.shown));
      gtDots();
    }
  });
  // Ctrl/Cmd+Z undoes a stroke, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redoes it (only while the easel is open)
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || !paintTools || app.view() !== "attic2" || !$("#a2-paper")) return;
    const k = e.key.toLowerCase();
    if (k === "z" || k === "y") {
      e.preventDefault();
      (k === "y" || e.shiftKey ? paintTools.redo : paintTools.undo)();
    }
  });

  app.a2quests = {
    paint: (hung) => { onHang = hung; easel(); $(".paint-pot", card).focus({ preventScroll: true }); },
    lesson: () => lesson(),
    pluck,
    stop: gtStop,
  };
})();
