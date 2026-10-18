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
  function renderStory(turn = true) {
    const p = STORY[page];
    storyArt.innerHTML = app.art(p.finale && isLit() ? "happy" : p.mood);
    if (turn && !reduceMotion) restart(storyArt, "turn");
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
  storyPrev.addEventListener("click", () => { if (page > 0) { page--; renderStory(); } });
  storyNext.addEventListener("click", () => {
    if (STORY[page].finale) setLit(!isLit(), storyNext);
    else { page++; renderStory(); }
  });
  app.onView("story", () => renderStory(false));

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
    if (app.view() === "story") renderStory(false);
  }

  // ======================================================================
  //  Guestbook (kept in this browser)
  // ======================================================================
  const SEED = [
    { name: "a passing firefly", msg: "nice lantern!! we should glow together sometime", when: "2h ago", face: "love", mark: "★" },
    { name: "the desk lamp", msg: "please stop staring at me.", when: "1d ago", face: "surprised", mark: "♥" },
    { name: "the moon", msg: "your hobbies are valid, even if they're unfinished. 🌙", when: "every night", face: "sleepy", mark: "★" },
  ];
  const guestList = $("#guest-list"), guestForm = $("#guest-form");
  let notes = store.get("guestbook", []);
  if (!Array.isArray(notes)) notes = [];
  const FACES = ["happy", "excited", "shy", "love", "curious"];
  function renderGuests() {
    guestList.replaceChildren(...notes.concat(SEED).map(n => {
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
  guestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = guestForm.elements.name.value.trim(), msg = guestForm.elements.msg.value.trim();
    if (!name || !msg) return;
    notes.unshift({
      name, msg, face: pick(FACES), mark: pick(["★", "♥"]),
      when: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    });
    notes = notes.slice(0, 20);
    store.set("guestbook", notes);
    renderGuests();
    guestForm.reset();
    sfx.play.shiny();
    app.lumi.react("happy", `${name.slice(0, 24)} signed my guestbook!! i'm framing it.`, 2600);
    toast("✍️ signed! Lumi is framing it.");
  });
  renderGuests();

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
      // no dust while playing Star Catch: it would hide the falling stars
      if (!on || app.view() === "play" || Math.hypot(e.clientX - lx, e.clientY - ly) < 7) return;
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
