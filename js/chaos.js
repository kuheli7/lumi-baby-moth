// Responsive chaos: the site changes personality with the shape of the screen, not just its size.
// Each shape is an "edition" with its own scenery (drawn behind everything), tagline and Lumi line.
// The scenery is decoration only: it never takes clicks and never covers the content.
(() => {
  "use strict";
  const { $ } = app;

  const EDITIONS = {
    pocket:   { name: "📟 pocket edition",     tag: "tiny moth. tiny screen. big hobbies.",            line: "i fit. barely. *squish*" },
    phone:    { name: "🌙 phone edition",      tag: "the tiny moth who starts a new hobby every night", line: "phone-sized. cozy. the fireflies came too!" },
    sideways: { name: "💤 nap mode",           tag: "the tiny moth, lying down for a quick nap",        line: "sideways?? perfect napping angle. zzz…" },
    tablet:   { name: "📖 storybook edition",  tag: "the tiny moth, now storybook-sized",               line: "storybook-sized! look, hills!" },
    wide:     { name: "🌌 widescreen sky",     tag: "the tiny moth with SO much sky tonight",           line: "SO much sky. is that a planet?!" },
    cinema:   { name: "🎬 CinemaScope",        tag: "now showing: Lumi, in glorious CinemaScope™",      line: "we're in a MOVIE?! i'm the star. (moths love stars.)" },
    tower:    { name: "🗼 tower edition",      tag: "the tiny moth in a very tall tower",               line: "so tall! i'll hang some lanterns." },
  };

  // the order matters: the most unusual shapes win
  function shapeOf() {
    const w = innerWidth, h = innerHeight, aspect = w / h;
    if (h <= 520 && w > h) return "sideways";
    if (aspect > 2.1 && w >= 900) return "cinema";
    if (w < 380) return "pocket";
    if (aspect < 0.45 && w < 720) return "tower";
    if (w < 720) return "phone";
    if (w < 1200) return "tablet";
    return "wide";
  }

  // the scenery for every edition is built once; CSS shows the one that matches
  const layer = document.createElement("div");
  layer.className = "chaos";
  layer.setAttribute("aria-hidden", "true");
  const lanterns = (side) => `<div class="cz-string cz-${side}">${"<i></i>".repeat(5)}</div>`;
  layer.innerHTML = `
    <div class="cz-pocket"><span class="cz-frame"></span><span class="cz-scan"></span></div>
    <div class="cz-phone">${"<i></i>".repeat(6)}</div>
    <div class="cz-sideways"><span class="cz-bigmoon"></span><b>z</b><b>z</b><b>Z</b></div>
    <div class="cz-tablet"><svg viewBox="0 0 400 60" preserveAspectRatio="none"><path d="M0 60V40c40-14 70-16 110-6s80 4 120-10 90-8 120 4 40 8 50 4V60z" opacity=".55"/><path d="M0 60V48l14-10 8 6 12-18 12 18 10-8 14 12 16-22 14 20 10-6 12 10 18-16 14 14 12-8 16 12 14-20 14 18 12-6 16 12 12-14 14 16 10-6 14 8 16-18 14 18 12-4 14 10 12-12 14 14V60z"/></svg></div>
    <div class="cz-wide"><span class="cz-cloud c1"></span><span class="cz-cloud c2"></span><span class="cz-cloud c3"></span><span class="cz-planet"></span><span class="cz-shoot"></span></div>
    <div class="cz-cinema"><span class="cz-bar top"></span><span class="cz-bar bottom"><em>NOW SHOWING · LUMI'S NIGHT SHIFT · ★★★★★</em></span></div>
    <div class="cz-tower">${lanterns("left")}${lanterns("right")}</div>`;
  $(".sky").after(layer);

  const tag = $(".home-tag"), badge = $(".badge.b5"), edition = $("#edition b");
  let shape = "";
  function apply() {
    // a phone keyboard squashes the height while you type; that isn't a new shape
    if (shape && document.activeElement?.matches("input, textarea")) return false;
    const next = shapeOf();
    if (next === shape) return false;
    const first = !shape;
    shape = next;
    document.documentElement.dataset.shape = shape;
    const ed = EDITIONS[shape];
    if (tag) tag.textContent = ed.tag;
    if (edition) {
      edition.textContent = ed.name;
      edition.parentElement.classList.remove("pop");
      void edition.offsetWidth;   // restart the pop animation
      edition.parentElement.classList.add("pop");
    }
    // a little fanfare when a resize unlocks a new edition (not on the first load)
    if (!first) app.toast(`✨ ${ed.name} unlocked!`, 2600);
    if (badge) badge.title = `${ed.name}: the site changes with your screen's shape. try resizing or turning it!`;
    return true;
  }
  apply();

  app.shape = () => shape;
  // home.js asks for this when the window settles, so Lumi announces the edition you just unlocked
  app.shapeLine = () => `${EDITIONS[shape].name} unlocked! ${EDITIONS[shape].line}`;
  addEventListener("resize", apply);
})();
