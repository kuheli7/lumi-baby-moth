// The quieter screens: story (with the lantern finale), guestbook, useless facts, about, credits and the menu.
// Also the moth-dust trail and the cookie secret. Loaded last, so it starts the router.
(() => {
  "use strict";
  const { $, $$, sfx, store, restart, reduceMotion, toast, pick } = app;

  // ======================================================================
  //  Story: six scenes, ending with the lantern lighting up the whole site
  // ======================================================================
  const STORY = [
    { mood: "sleepy", text: "Once, in a paint box under a desk lamp, something small and fuzzy hatched. It was mostly fluff, and a little bit paint." },
    { mood: "surprised", text: "The first thing it ever saw was the lamp. “Ooh,” said Lumi. “Shiny.”" },
    { mood: "chase", text: "Every night since, Lumi chases a new light and starts a new hobby. Moons. Stars. Dew drops. One (1) guitar string." },
    { mood: "sad", text: "It has never finished a single one. Sometimes that makes Lumi droopy. (Cookies help.)" },
    { mood: "proud", text: "Except one thing: the very first thing Lumi ever made. A little lantern, to carry the shiny everywhere." },
    { mood: "love", text: "And tonight, Lumi wants to light it for you.", finale: true },
  ];
  const storyArt = $("#story-art"), storyText = $("#story-text"), storyPrev = $("#story-prev"), storyNext = $("#story-next"), pager = $("#story-pager");
  let page = 0;
  const isLit = () => document.body.classList.contains("lit");
  const storyBox = $(".story");
  function renderStory(turn = 0) {
    const p = STORY[page];
    storyArt.innerHTML = app.art(p.finale && isLit() ? "happy" : p.mood);
    // turn: 1 flips the page forward, -1 back
    if (turn && !reduceMotion) { storyBox.classList.remove("flip-next", "flip-prev"); restart(storyBox, turn > 0 ? "flip-next" : "flip-prev"); }
    storyText.textContent = p.finale && isLit() ? "…and the whole night lit up. The end (for now). ✨" : p.text;
    storyPrev.disabled = page === 0;
    storyNext.classList.toggle("lantern-btn", !!p.finale);
    if (p.finale) {
      storyNext.textContent = isLit() ? "🌙 lights off" : "🏮 light the lantern";
      storyNext.dataset.sfx = "none";
    } else {
      storyNext.textContent = "next ›";
      delete storyNext.dataset.sfx;
    }
    pager.innerHTML = STORY.map((_, i) => `<i class="${i === page ? "on" : ""}"></i>`).join("");
    app.look();
  }
  // turning by swipe, wheel or arrow key stops at the last page; only the button lights the lantern
  const turnPage = (d) => {
    const to = page + d;
    if (to < 0 || to >= STORY.length) return false;
    page = to;
    renderStory(d);
    sfx.play.click();
    return true;
  };
  storyPrev.addEventListener("click", () => { if (page > 0) { page--; renderStory(-1); } });
  storyNext.addEventListener("click", () => {
    if (STORY[page].finale) setLit(!isLit(), storyNext);
    else { page++; renderStory(1); }
  });
  app.onView("story", () => renderStory(0));

  addEventListener("keydown", (e) => {
    if (app.view() !== "story" || e.target.closest?.("input, textarea") || $("#menu").open) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); turnPage(e.key === "ArrowRight" ? 1 : -1); }
  });
  // a sideways swipe on the page (up and down still scrolls)
  let swipe = null;
  storyBox.addEventListener("pointerdown", (e) => { swipe = { x: e.clientX, y: e.clientY }; });
  storyBox.addEventListener("pointerup", (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) turnPage(dx < 0 ? 1 : -1);
  });
  storyBox.addEventListener("pointercancel", () => { swipe = null; });
  // the scroll wheel turns pages once the screen itself has nowhere left to scroll
  let wheelAt = 0, wheelSum = 0;
  addEventListener("wheel", (e) => {
    if (app.view() !== "story" || $("#menu").open) return;
    const down = e.deltaY > 0, el = document.scrollingElement;
    const canScroll = down ? el.scrollTop + innerHeight < el.scrollHeight - 2 : el.scrollTop > 0;
    if (canScroll) { wheelSum = 0; return; }
    wheelSum += e.deltaY;
    const now = Date.now();
    if (now - wheelAt < 700 || Math.abs(wheelSum) < 40) return;
    wheelAt = now;
    wheelSum = 0;
    turnPage(down ? 1 : -1);
  }, { passive: true });

  // the finale: light bursts out of the lantern and the whole sky turns warm
  const lightsItem = $("#menu-lights");
  function setLit(on, from) {
    if (on === isLit()) return;
    document.body.classList.toggle("lit", on);
    app.setRoomLights(false);
    lightsItem.textContent = on ? "🌙 lights off" : "🏮 light the lantern";
    if (on) {
      if (!reduceMotion && from && from.isConnected && from.offsetParent) {
        const r = from.getBoundingClientRect(), b = document.createElement("div");
        b.className = "burst";
        b.style.left = r.left + r.width / 2 + "px";
        b.style.top = r.top + r.height / 2 + "px";
        b.addEventListener("animationend", () => b.remove());
        document.body.append(b);
      }
      sfx.play.chime();
      app.lumi.react("happy", "it worked!! i FINISHED something!! (the lantern. it was always the lantern.)", 5000);
      toast("🏮 the lantern lit up the whole night. the end (for now) ✨", 4200);
    } else {
      sfx.play.yawn();
      app.lumi.react("sleepy", "…back to the cozy dark. goodnight, lantern.", 2600);
    }
    if (app.view() === "story") renderStory(0);
  }

  // ======================================================================
  //  Guestbook: shared by every visitor, kept in a Supabase table. If that can't be
  //  reached, notes go in a jar on this device instead, so the page always works.
  // ======================================================================
  // The anon key is meant to be public: the table's rules only let visitors read and add notes
  // (never edit or delete), and the database itself rejects notes that are too long.
  const DB = {
    url: "https://oqzgvojbqhdvwduwuhkm.supabase.co/rest/v1/guestbook",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xemd2b2picWhkdndkdXd1aGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzM5NDUsImV4cCI6MjEwNzkwOTk0NX0.pA38_A7demCO-4vwTlgVfjxp2jfygP-_Jq5DAdcNZNQ",
  };
  const db = (query = "", opts = {}) => {
    const stop = new AbortController(), timer = setTimeout(() => stop.abort(), 6000);
    return fetch(DB.url + query, {
      ...opts, signal: stop.signal,
      headers: { apikey: DB.key, Authorization: "Bearer " + DB.key, "Content-Type": "application/json", ...opts.headers },
    }).then(r => { if (!r.ok) throw new Error("guestbook " + r.status); return r.text(); })
      .then(t => (t ? JSON.parse(t) : null))   // a saved note comes back with an empty body
      .finally(() => clearTimeout(timer));
  };
  const ago = (iso) => {
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const SEED = [
    { name: "a passing firefly", msg: "nice lantern!! we should glow together sometime", when: "2h ago", face: "love", mark: "★" },
    { name: "the desk lamp", msg: "please stop staring at me.", when: "1d ago", face: "surprised", mark: "♥" },
    { name: "the moon", msg: "your hobbies are valid, even if they're unfinished. 🌙", when: "every night", face: "sleepy", mark: "★" },
  ];
  const guestList = $("#guest-list"), guestForm = $("#guest-form");
  const finePrint = $(".view[data-view=guestbook] .fine-print");
  let notes = store.get("guestbook", []);   // this device's jar (used when the shared guestbook is out of reach)
  if (!Array.isArray(notes)) notes = [];
  let shared = null;                         // the shared notes, once they've loaded
  const FACES = ["happy", "excited", "shy", "love", "curious"];
  function renderGuests() {
    guestList.replaceChildren(...(shared || notes).concat(SEED).map(n => {
      const li = document.createElement("li");
      const av = document.createElement("span"), body = document.createElement("div"), mark = document.createElement("span");
      av.className = "avatar";
      av.innerHTML = `<img src="${app.artURL(FACES.includes(n.face) || SEED.includes(n) ? n.face : "happy")}" alt="">`;
      const who = document.createElement("span"), when = document.createElement("span"), msg = document.createElement("span");
      who.className = "g-name"; who.textContent = String(n.name).slice(0, 24);
      when.className = "g-when"; when.textContent = String(n.when).slice(0, 16);
      msg.className = "g-msg"; msg.textContent = String(n.msg).slice(0, 160);
      body.append(who, when, msg);
      mark.className = "g-mark" + (n.mark === "♥" ? " heart" : "");
      mark.textContent = n.mark || "★";
      mark.setAttribute("aria-hidden", "true");
      li.append(av, body, mark);
      return li;
    }));
  }
  addEventListener("lumi:wear", renderGuests);

  function loadGuests() {
    db("?select=name,msg,face,mark,created_at&order=created_at.desc&limit=30")
      .then(rows => {
        shared = rows.map(r => ({ ...r, when: ago(r.created_at) }));
        finePrint.textContent = "Everyone who visits can read these notes, so be kind! 🌙";
        renderGuests();
      })
      .catch(() => { if (!shared) finePrint.textContent = "Lumi keeps your notes in a jar on this device (the shared guestbook is napping)."; });
  }
  app.onView("guestbook", loadGuests);

  guestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = guestForm.elements.name.value.trim().slice(0, 24), msg = guestForm.elements.msg.value.trim().slice(0, 160);
    if (!name || !msg) return;
    // one note every 20 seconds, so nobody floods the wall
    const last = store.get("signedAt", 0);
    if (Date.now() - last < 20000) { toast("✋ Lumi is still framing your last note. try again in a moment!"); return; }
    store.set("signedAt", Date.now());
    const note = { name, msg, face: pick(FACES), mark: pick(["★", "♥"]) };
    const thanks = () => {
      guestForm.reset();
      sfx.play.shiny();
      app.lumi.react("happy", `${name} signed my guestbook!! i'm framing it.`, 2600);
    };
    if (shared) {
      shared.unshift({ ...note, when: "just now" });   // show it straight away
      renderGuests();
      thanks();
      db("", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(note) })
        .then(() => toast("✍️ signed! everyone can see it now."))
        .catch(() => {
          shared.shift();
          notes = [{ ...note, when: "just now" }, ...notes].slice(0, 20);
          store.set("guestbook", notes);
          shared = null;
          finePrint.textContent = "Lumi keeps your notes in a jar on this device (the shared guestbook is napping).";
          renderGuests();
          toast("📮 the shared guestbook is napping, so Lumi kept your note on this device.");
        });
    } else {
      notes = [{ ...note, when: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }) }, ...notes].slice(0, 20);
      store.set("guestbook", notes);
      renderGuests();
      thanks();
      toast("✍️ signed! Lumi is framing it.");
    }
  });
  renderGuests();
  loadGuests();

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
  app.onView("facts", () => { $("#fact-art").innerHTML = app.art("thinking"); });
  app.onView("about", () => { $("#about-art").innerHTML = app.art("curious"); });

  // ======================================================================
  //  Menu
  // ======================================================================
  const menu = $("#menu");
  $("#menu-open").addEventListener("click", () => {
    $("#menu-art").innerHTML = app.art("happy", true);
    menu.showModal();
    app.look();
  });
  $("#menu-close").addEventListener("click", () => menu.close());
  menu.addEventListener("click", (e) => {
    if (e.target.closest(".menu-list a")) menu.close();
  });
  // the back button (or any other way of changing screens) closes it too
  addEventListener("hashchange", () => { if (menu.open) menu.close(); });
  lightsItem.addEventListener("click", () => { menu.close(); setLit(!isLit(), null); });

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
      // no dust while playing Star Catch (it would hide the falling stars) or over the painting
      if (!on || app.view() === "play" || e.target.closest?.(".paint-wrap") || Math.hypot(e.clientX - lx, e.clientY - ly) < 7) return;
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
  //  Secret: type "cookie" anywhere (outside a text box) for a cookie storm
  // ======================================================================
  let typed = "";
  addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea") || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed !== "cookie") return;
    typed = "";
    app.secret("cookie");
    toast("🍪 COOKIE STORM! you found a secret.");
    if (!reduceMotion) {
      for (let i = 0; i < 26; i++) {
        const c = document.createElement("div");
        c.className = "rain";
        c.innerHTML = app.COOKIE;
        c.style.left = Math.random() * 100 + "vw";
        c.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
        c.style.animationDelay = Math.random() * 1.2 + "s";
        c.style.setProperty("--spin", Math.round(Math.random() * 720 - 360) + "deg");
        c.addEventListener("animationend", () => c.remove());
        document.body.append(c);
      }
    }
    setTimeout(app.lumi.feed, 500);
  });

  // cookie icons on buttons
  $$(".cookie-ico").forEach(el => { el.innerHTML = app.COOKIE; });

  app.start();
})();
