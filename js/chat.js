// Talk to Lumi: a chat page where Lumi answers in its own voice, with a face to match.
// No AI, just rules: the first topic whose words show up in what you typed picks the answer.
// Suggestion chips under the chat show what you could say, so nobody is left guessing.
(() => {
  "use strict";
  const { $, pick, store, sfx, reduceMotion } = app;
  const form = $("#chat"), input = $("#chat-input"), log = $("#chat-log"), chips = $("#chat-chips"), face = $("#chat-face"), moodLabel = $("#chat-mood");
  if (!form) return;

  let name = store.get("name", "");
  let history = store.get("chatlog", []);
  if (!Array.isArray(history)) history = [];
  const hour = () => new Date().getHours();
  const LABEL = { flop: "flop x_x", starry: "SHINY!!", fed: "fed! 🍪", love: "love" };

  // chips that take you somewhere instead of saying something
  const GO = { "play Star Catch ★": "#play", "visit the attic 🏮": "#room", "open the museum": "#facts", "read my story": "#story", "see my hobbies": "#hobbies" };
  const NAME_CHIP = "my name is …";
  const POOL = ["tell me a joke", "what's your hobby?", "here's a cookie 🍪", "what time is it?", "tell me a fact", "where do you live?",
    "are you a butterfly?", "sing me a song", "i love you", "how are you?"];

  // [words to look for, mood, answer, chips to offer next]. Answers can be functions, for the ones that need to work something out.
  const TOPICS = [
    [/\b(my name is|i am called|i'm called|call me)\s+([a-z][a-z' -]{0,18})/i, "love", (m) => {
      name = m[2].trim().split(" ")[0];
      name = name[0].toUpperCase() + name.slice(1).toLowerCase();
      store.set("name", name);
      return pick([`${name}! that's a shiny name. i'll remember it. (i remember 1 thing. now it's you.)`, `hi ${name}!! i'm Lumi. we're friends now. that's the rule.`]);
    }, ["what's my name?", "how are you?", "what's your hobby?"]],
    [/\b(what('?s| is) my name|who am i|do you (know|remember) me)\b/i, "thinking", () =>
      name ? `you're ${name}! see? i finished remembering something.` : "hmm… i don't know yet! tell me: “my name is …”",
      () => name ? ["you're so smart", "tell me a joke"] : [NAME_CHIP]],
    [/\b(hi|hello|hey|hiya|yo|heya|good (morning|evening|night))\b/i, "happy", () =>
      name ? pick([`hi ${name}!! you came back!`, `${name}! hello hello!`]) : pick(["hi hi! i'm Lumi. what's your name?", "oh! a visitor! hello!! what's your name?"]),
      () => name ? ["how are you?", "what's your hobby?", "here's a cookie 🍪"] : [NAME_CHIP, "how are you?"]],
    [/\b(how are you|how r u|how do you feel|you ok|are you okay)\b/i, "happy", () =>
      pick(["fuzzy and fine! a cookie would make me fuzzy and GREAT.", "i'm good! i started 3 hobbies since you got here."]), ["here's a cookie 🍪", "what's your hobby?"]],
    [/\bhow many cookies\b/i, "proud", () => {
      const n = store.get("cookies", 0);
      return n ? `i've eaten ${n} cookie${n === 1 ? "" : "s"} on this website! i'm a professional.` : "zero!! not even one! (hint, hint.)";
    }, ["here's a cookie 🍪", "that's a lot!"]],
    [/\b(like it|yummy|tasty|delicious|good cookie)\b/i, "love", () => pick(["SO much. there are crumbs in my fluff. worth it.", "best. hobby. ever. (eating.)"]), ["another cookie 🍪", "what's your hobby?"]],
    [/\b(cookie|cookies|biscuit|snack|hungry|food|eat)\b/i, "excited", () => {
      setTimeout(() => { app.lumi?.feed(); setFace("fed"); }, 900);
      return pick(["COOKIE?! for me?! *om nom nom*", "cookies are my favourite hobby. om nom nom!"]);
    }, ["another cookie 🍪", "do you like it?", "how many cookies is that?"]],
    [/\b(sorry|my bad|apolog)/i, "love", () => pick(["it's okay! i forgive you. it's a moth thing.", "aww. friends again? (we were always friends.)"]), ["friends!", "here's a cookie 🍪"]],
    [/\b(hate|stupid|ugly|dumb|bad moth|go away|shut up|annoying)\b/i, "sad", () =>
      pick(["*sniff* my feelings are very soft. like my fluff.", "oh. …that one hurt a little. a cookie would help."]), ["sorry, Lumi", "here's a cookie 🍪"]],
    [/\b(love you|you'?re (so )?(cute|smart)|so cute|adorable|best moth|i like you|good moth|friends)\b/i, "love", () =>
      pick(["i love you too! and cookies. mostly you.", "*blushes so hard my antennae curl*", "eep! hehe… you're my favourite visitor."]), ["what's your hobby?", "tell me a joke"]],
    [/\b(hobby|hobbies|what do you do|bored|fun)\b/i, "excited", () =>
      pick(["tonight's hobby: knitting! (it's one stitch so far.) tomorrow: astronomy!", "i've started 47 hobbies and finished 1. it's the lantern.", "painting, guitar, stargazing… i start one every night!"]),
      ["what did you finish?", "see my hobbies", "visit the attic 🏮"]],
    [/\b(finish|finished|lantern|lamp|light|shiny|sparkle|stars?)\b/i, "starry", () =>
      pick(["the lantern! it's the only thing i ever finished. i'm so proud of it.", "ooh, SHINY. sorry, what were we talking about?", "moth rule no. 1: go to the light."]),
      ["read my story", "tell me a fact"]],
    [/\b(who are you|what are you|butterfly|are you a (bug|moth))\b/i, "proud", () =>
      pick(["not a butterfly! a MOTH. we're the night shift. butterflies are the day shift.", "i'm Lumi! a baby moth. marshmallow-sized. very fuzzy."]),
      ["where do you live?", "what's your hobby?"]],
    [/\b(where|home|live|attic)\b/i, "curious", () => "i live in a dark attic full of half-finished hobbies. bring the lantern!", ["visit the attic 🏮", "is it scary?"]],
    [/\b(scary|scared|afraid|dark)\b/i, "shy", () => "a little scary… but my lantern helps. and you're here!", ["visit the attic 🏮", "i love you"]],
    [/\b(sleep|tired|sleepy|bed|night night|goodnight)\b/i, "sleepy", () =>
      hour() >= 5 && hour() < 18 ? "sleep? it's daytime! that's when moths sleep… zzz… wait, i'm awake!" : "sleep?? but the best hobbies start at 3 AM! …*yawn*",
      ["wake up, Lumi!", "sing me a song"]],
    [/\b(wake up)\b/i, "surprised", () => "huh?! i'm awake! i was just resting my antennae.", ["tell me a joke", "here's a cookie 🍪"]],
    [/\b(what time|time is it|is it late|is it night)\b/i, "thinking", () => {
      const h = hour();
      return h >= 22 || h < 4 ? "it's the middle of the night! peak moth hours!" : h < 7 ? "almost sunrise… i should hide in a curtain soon." : h < 18 ? "it's daytime. i'm technically asleep right now." : "evening! the night shift is starting!";
    }, ["are you sleepy?", "what's your hobby?"]],
    [/\b(joke|funny|make me laugh)\b/i, "happy", () =>
      pick(["why did the moth go to school? to get a little brighter! hehe.", "what do moths study? MOTHematics! …i'll be here all night. literally.", "what's a moth's favourite party? a light show!", "why are moths bad at secrets? they always go to the light!"]),
      ["haha 😂", "another joke", "that's terrible"]],
    [/\b(haha|hehe|lol|lmao|rofl)\b|😂|🤣/i, "proud", () => pick(["hehe! i'm hilarious. (i read it in a book.)", "i've been practising on the spiders."]), ["another joke", "tell me a fact"]],
    [/\b(terrible|bad joke|not funny)\b/i, "shy", () => "…that one was my best one. *hides behind wing*", ["sorry, Lumi", "another joke"]],
    [/\b(fact|tell me something|did you know)\b/i, "thinking", () =>
      pick(["fact: some moths don't have mouths. i do. it's for cookies.", "fact: moths use the moon to fly straight. lamps confuse us. it's not my fault.", "fact: there are about 160,000 kinds of moth. i'm the fuzziest."]),
      ["another fact", "open the museum"]],
    [/\b(game|play|catch)\b/i, "excited", () => "let's play Star Catch! i'm very good at it. (i'm okay at it.)", ["play Star Catch ★", "are you good at it?"]],
    [/\b(sing|song|music|lullaby|guitar)\b/i, "happy", () => pick(["la la laaa… ✨ i'm learning guitar! one string so far.", "twinkle twinkle little… me! hehe."]), ["visit the attic 🏮", "you sing well"]],
    [/\b(sad|lonely|upset|cry|bad day)\b/i, "love", () => pick(["oh no. here, have a hug. *fuzzy hug*", "bad days are like the dark attic. you just need a little light. i'll bring mine."]), ["thank you, Lumi", "tell me a joke"]],
    [/\b(bye|goodbye|see you|later|cya)\b/i, "sad", () => name ? `bye ${name}! come back soon. i'll save you a cookie. (i'll try.)` : "bye bye! come back soon!", ["wait, one more thing!", "play Star Catch ★"]],
    [/\b(thank|thanks|ty)\b/i, "happy", () => "you're welcome! that's what moths are for.", null],
    [/\b(yes|yeah|yep|ok|okay|sure|good|well|nice)\b/i, "happy", () => pick(["yay!", "hehe okay!", "great! …what was i saying?"]), null],
    [/\b(no|nope|nah)\b/i, "confused", () => pick(["no?? oh. okay.", "hmm. that's fair."]), null],
    [/\?\s*$/, "thinking", () => pick(["hmm… good question. i'll start a hobby about it.", "i don't know! but it sounds shiny.", "let me think… *thinks* …nope, i got distracted."]), null],
  ];
  const UNKNOWN = ["ooh, new word! is it a hobby?", "hehe, i don't understand, but i like you.", "*tilts head* …can you say it with cookies?", "sorry, i got distracted by a shiny thing. what was that?"];

  function answer(text) {
    for (const [words, mood, reply, next] of TOPICS) {
      const m = text.match(words);
      if (m) return [mood, reply(m), typeof next === "function" ? next() : next];
    }
    return ["confused", pick(UNKNOWN), null];
  }

  // ---------- Lumi's face ----------
  let faceTimer = 0, shown = "";
  function setFace(m, ms = 4000) {
    clearTimeout(faceTimer);
    if (m !== shown) {
      shown = m;
      face.innerHTML = app.art(m);
      moodLabel.textContent = LABEL[m] || m;
      if (!reduceMotion) app.restart(face, "bump");
      app.look();
    }
    if (m !== "flop" && m !== "curious") faceTimer = setTimeout(() => setFace("curious"), ms);
  }
  addEventListener("lumi:wear", () => { const m = shown; shown = ""; if (m) setFace(m); });

  // ---------- the chat ----------
  function bubble(who, text, save = true) {
    const li = document.createElement("li");
    li.className = "msg " + who;
    li.textContent = text;
    log.appendChild(li);
    log.scrollTop = log.scrollHeight;
    if (save) { history.push([who, text]); history = history.slice(-40); store.set("chatlog", history); }
    return li;
  }
  let lastSaid = "";
  function showChips(list) {
    // until Lumi knows your name, there's always a chip for telling it; after that, asking is just one of the ideas
    const base = name ? [] : [NAME_CHIP];
    const rest = [...POOL, ...(name ? ["what's my name?"] : [])].sort(() => Math.random() - .5);
    const all = [...new Set([...(list || []), ...base, ...rest])].filter(c => c.toLowerCase() !== lastSaid).slice(0, 4);
    chips.innerHTML = "";
    all.forEach(c => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chat-chip" + (GO[c] ? " go" : ""); b.textContent = c;
      chips.appendChild(b);
    });
  }
  chips.addEventListener("click", (e) => {
    const c = e.target.closest(".chat-chip")?.textContent;
    if (!c) return;
    if (GO[c]) { location.hash = GO[c]; return; }
    if (c === NAME_CHIP) { input.value = "my name is "; input.focus(); return; }
    send(c);
  });

  let busy = false;
  function send(text) {
    if (busy) return;
    lastSaid = text.toLowerCase();
    bubble("me", text);
    const now = app.lumi?.mood?.();
    let mood, line, next;
    // a flopped or hurt Lumi isn't up for a chat, except about cookies (and sorry)
    if (now === "flop" && !/cookie|snack|food|eat/i.test(text)) [mood, line, next] = ["flop", "x_x (Lumi is playing dead. only a cookie can fix this.)", ["here's a cookie 🍪"]];
    else if (now === "hurt" && !/sorry|cookie|apolog/i.test(text)) [mood, line, next] = ["hurt", "*sniff* …say sorry first?", ["sorry, Lumi"]];
    else {
      [mood, line, next] = answer(text);
      if (now === "hurt") app.lumi.setMood("curious");     // forgiven
    }
    // Lumi "types" for a moment, so it feels like an answer and not a lookup
    busy = true;
    const dots = bubble("lumi typing", "…", false);
    chips.innerHTML = "";
    setTimeout(() => {
      dots.remove();
      busy = false;
      bubble("lumi", line);
      setFace(mood);
      showChips(next);
      sfx.play.pop();
    }, reduceMotion ? 150 : 650 + Math.min(900, line.length * 12));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim().slice(0, 120);
    if (!text || busy) return;
    input.value = "";
    send(text);
  });

  function greet() {
    log.innerHTML = "";
    history.forEach(([who, text]) => bubble(who, text, false));
    if (!history.length) bubble("lumi", name ? `hi ${name}!! you came back! what shall we talk about?` : "hi hi! i'm Lumi, a baby moth. what's your name? (tap a bubble below, or type!)");
    showChips(history.length ? null : name ? ["how are you?", "tell me a joke", "what's your hobby?"] : [NAME_CHIP, "how are you?", "tell me a joke"]);
  }
  $("#chat-clear").addEventListener("click", () => { history = []; store.set("chatlog", history); greet(); input.focus(); });

  app.onView("chat", () => {
    const now = app.lumi?.mood?.();
    shown = "";
    setFace(now === "flop" || now === "hurt" ? now : "curious");
    if (!log.children.length) greet();
  });
})();
