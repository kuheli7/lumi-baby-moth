// Home: Lumi itself. Poke it, feed it, pick its mood, let it doze off.
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
    ],
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
  const POKE_MOODS = ["happy", "excited", "shy"];

  const stage = $("#stage"), bubble = $("#bubble"), moodLabel = $("#mood-label"), picker = $("#mood-picker");
  const pal = { mood: "", pokes: 0, timer: 0, calm: 0, lastSaid: Date.now(), lastActive: Date.now() };

  function setMood(m) {
    if (pal.mood === m) return;
    pal.mood = m;
    stage.innerHTML = app.art(m);
    moodLabel.textContent = LABEL[m] || m;
    stage.setAttribute("aria-label", m === "flop" ? "Lumi has flopped. Feed it a cookie." : m === "sleepy" ? "Wake Lumi up" : "Poke Lumi");
    picker.querySelectorAll(".mood-btn").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mood === m)));
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

  // the cookie flies from the button into Lumi's paws
  function flyCookie(from) {
    const a = from.getBoundingClientRect(), b = stage.getBoundingClientRect();
    if (reduceMotion || !b.width) { feed(); return; }
    const g = document.createElement("div");
    g.className = "flying-cookie";
    g.innerHTML = app.COOKIE;
    document.body.append(g);
    const x0 = a.left + 18, y0 = a.top + a.height / 2 - 23;
    const x1 = b.left + b.width / 2 - 23, y1 = b.top + b.height * .62 - 23;
    g.animate([
      { transform: `translate(${x0}px, ${y0}px)` },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) rotate(180deg)` },
      { transform: `translate(${x1}px, ${y1}px) rotate(360deg) scale(.6)` },
    ], { duration: 560, easing: "ease-in-out" }).onfinish = () => { g.remove(); feed(); };
  }
  const feedBtn = $("#feed");
  feedBtn.addEventListener("click", () => {
    if (pal.mood === "sleepy") wake();
    flyCookie(feedBtn);
  });
  stage.addEventListener("click", poke);

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

  app.onView("home", () => { pal.lastActive = Date.now(); });
  app.lumi = { react, feed, say, setMood, mood: () => pal.mood };
})();
