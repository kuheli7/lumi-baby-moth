// Lumi's art: palette, drawing helpers and sticker(mood), which returns an SVG string.
// Copied unchanged from design/lumi-stickers.html by tools/sync-art.mjs. Edit the design file, then re-run it.
// Palette sampled from the reference art (same as Lumi v4)
const C = {
  fur: "#fef7ed", line: "#f0c9a8", flick: "#efd0b4",
  stalk: "#4e3427", frame: "#6f4e2c",
  ring: "#fbf1f0", spot: "#c66d74", blush: "#f8b0bf",
  mouth: "#5e3b30", nose: "#4f3026", lid: "#1f1517", lip: "#7a2e3a",
  eye: "#080506", eyeTint: "#3f3134", eyeTintDark: "#22181a", sparkle: "#fbe3a4",
  gold: "#f6cf6a", heart: "#ee8196", shadow: "#faeadb",
  card: "#fcf2e2", cardLine: "#a99179", label: "#4a2c1a",
};

const f1 = (n) => n.toFixed(1);

const star4 = (x, y, s, fill, extra = "") =>
  `<path d="M${x} ${y - s} Q${x + s * .2} ${y - s * .2} ${x + s} ${y} Q${x + s * .2} ${y + s * .2} ${x} ${y + s} Q${x - s * .2} ${y + s * .2} ${x - s} ${y} Q${x - s * .2} ${y - s * .2} ${x} ${y - s} Z" fill="${fill}" ${extra}/>`;

const star5 = (x, y, R, r, fill) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    d += (i ? "L" : "M") + f1(x + Math.cos(a) * rad) + " " + f1(y + Math.sin(a) * rad);
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${fill}" stroke-width="1.6" stroke-linejoin="round"/>`;
};

// Hearts are a little taller than wide and can be tilted around their own centre
const heart = (x, y, s, attrs, rot = 0) =>
  `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s} ${f1(s * 1.22)})" d="M0 -2 C-3 -7 -10 -4 -6 2 L0 7 L6 2 C10 -4 3 -7 0 -2 Z" ${attrs}/>`;

const seeded = (seed) => {
  let s = seed * 7 + 3;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
};

// Organic oval: smooth closed curve through slightly jittered points (never a perfect circle)
function blob(cx, cy, rx, ry, seed, wob = .06, rotDeg = 0, n = 8) {
  const rand = seeded(seed);
  const rot = rotDeg * Math.PI / 180, cr = Math.cos(rot), sr = Math.sin(rot);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rand() - .5) * 2 * wob;
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + "Z";
}

// Quadratic curve drawn as a filled shape that tapers from w0 to w1
function taper(p0, p1, p2, w0, w1, steps = 18) {
  const L = [], R = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, mt = 1 - t;
    const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
    const y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
    const dx = 2 * mt * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * mt * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push([x - (dy / len) * w, y + (dx / len) * w]);
    R.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  return "M" + L.concat(R.reverse()).map(p => f1(p[0]) + " " + f1(p[1])).join(" L") + " Z";
}
const qpt = (p0, p1, p2, t) => {
  const mt = 1 - t;
  return [mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0], mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]];
};

// Traditional cloud: evenly spaced, same-sized scallops that all bulge outward (no dents).
// `pear` > 0 narrows the top and fills out the bottom; `flat` < 1 flattens the bottom (for sitting);
// `trim` = [angleDeg, amount, spreadDeg] pulls the outline in around one spot.
function scallop(cx, cy, rx, ry, n, seed, kR = .58, pear = 0, flat = 1, trim = null) {
  const rand = seeded(seed);
  // sample the outline by arc length so every scallop comes out the same size
  const M = 360, pts = [], len = [0];
  for (let i = 0; i <= M; i++) {
    const t = (i / M) * Math.PI * 2, s = Math.sin(t);
    const k = trim ? 1 - trim[1] * Math.exp(-(((t * 180 / Math.PI - trim[0]) / trim[2]) ** 2)) : 1;
    pts.push([cx + Math.cos(t) * rx * (1 + pear * s) * k, cy + ry * (s > 0 ? s ** flat : s) * k]);
    if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = len[M], off = rand();
  const at = (s) => {
    s = ((s % total) + total) % total;
    let i = 1;
    while (len[i] < s) i++;
    const u = (s - len[i - 1]) / (len[i] - len[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
  };
  const notches = Array.from({ length: n }, (_, i) => at(((i + off + (rand() - .5) * .12) / n) * total));
  let d = `M${f1(notches[0][0])} ${f1(notches[0][1])}`;
  for (let i = 1; i <= n; i++) {
    const p = notches[i - 1], q = notches[i % n];
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]), R = L * (kR + (rand() - .5) * .06);
    d += ` A${f1(R)} ${f1(R)} 0 0 1 ${f1(q[0])} ${f1(q[1])}`;
  }
  return (attrs) => `<path d="${d}Z" stroke-linejoin="round" ${attrs}/>`;
}

// Fluff = outline on the outside of the union only + gradient fill + clipped shading.
// part "line" or "fill" draws just one half, so parts that join can share one outline (see joined)
function fluff(shape, clipId, fill, shading = "", stroke = 4.4, line = C.line, part = "all") {
  const ln = shape(`fill="${line}" stroke="${line}" stroke-width="${stroke}"`);
  const fl = `<clipPath id="${clipId}">${shape("")}</clipPath>
    ${shape(`fill="${fill}"`)}
    <g clip-path="url(#${clipId})">${shading}</g>`;
  return part === "line" ? ln : part === "fill" ? fl : ln + fl;
}

// Feet (and the brown paws) get a border that is lighter on the side facing the light.
// The gradient runs in the foot's own rotated space, so the light direction is rotated into it.
const foot = (cx, cy, rx, ry, deg, id, seed, light = [130, 186]) => {
  const a = -deg * Math.PI / 180, R = Math.max(rx, ry);
  let dx = cx - light[0], dy = cy - light[1];
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
  const gid = `${id}footLine${seed}`;
  return `<g transform="translate(${cx} ${cy}) rotate(${deg})">
  <linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f1(-lx * R)}" y1="${f1(-ly * R)}" x2="${f1(lx * R)}" y2="${f1(ly * R)}">
    <stop offset="0" stop-color="#7d5a46"/><stop offset="1" stop-color="#3f281d"/></linearGradient>
  <path d="${blob(0, 0, rx, ry, seed, .05)}" fill="url(#${id}foot)" stroke="url(#${gid})" stroke-width="2"/>
  <path d="M${f1(-rx * .45)} ${f1(-ry * .55)} q${f1(rx * .35)} ${f1(-ry * .22)} ${f1(rx * .8)} ${f1(-ry * .08)}" fill="none" stroke="#a7826c" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>`;
};

// Both eyes share one structure; only position (and the sparkle side) differ
const TILT = -5;
const EYE_L = { x: 91.5, y: 124, side: -1, seed: 11, rot: 5 };
const EYE_R = { x: 150.5, y: 119, side: 1, seed: 11 };
const EYE_RX = 15.5, EYE_RY = 16.5;

// Same order as the sticker sheet (three rows of six)
const MOODS = ["curious", "happy", "excited", "shy", "proud", "love",
  "surprised", "confused", "sad", "hurt", "sleepy", "flop",
  "fed", "thinking", "peek", "chase", "starry", "determined"];
const LABELS = {
  curious: "curious", happy: "happy", excited: "excited", shy: "shy", proud: "proud", love: "love",
  surprised: "surprised", confused: "confused", sad: "sad", hurt: "hurt", sleepy: "sleepy", flop: "flop",
  fed: "fed!", thinking: "thinking", peek: "peek", chase: "chasing shiny things", starry: "starry", determined: "determined",
};

let uid = 0;
function sticker(mood) {
  const id = "s" + uid++;
  const blur = (n) => `filter="url(#${id}b${n})"`;
  const LINE = `url(#${id}line)`;
  // Blush: soft blurred pink with a crisp gradient border (lighter on top, deeper pink below)
  const blush = (x, y, rx = 11, ry = 8.5, seed = 21, rot = 0) => {
    const d = blob(x, y, rx, ry, seed, .07, rot);
    return `<path d="${d}" fill="${C.blush}" opacity=".9" ${blur(1)}/>
      <path d="${d}" fill="none" stroke="url(#${id}blushLine)" stroke-width="1.5" opacity=".9"/>`;
  };

  // ---------- Wings (the v4 pair, each swinging from its root on the back) ----------
  // lo scales the lilac wing alone, from where it tucks under the body; up lifts it
  const upL = blob(57, 137, 58, 44, 31, .02, -28, 10);
  const upR = blob(184, 133, 56, 43, 33, .02, 28, 10);
  const loL = "M120 172 C100 168 78 172 60 178 C40 184 30 200 34 214 C38 230 58 236 74 228 C92 218 108 194 120 172 Z";
  const loR = "M120 170 C140 166 160 168 178 174 C198 180 208 194 204 208 C200 224 182 230 168 222 C150 212 132 192 120 170 Z";
  const wingL = (lo = 1, up = 0) => `<g class="wl">
    <path d="${upL}" fill="url(#${id}peachL)"/>
    <path d="${upL}" fill="url(#${id}wingBlush)"/>
    <path d="M58 139.5 Q21 143.5 6 150" transform="rotate(-11 27 144)" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
    <path d="${blob(27, 144, 14.2, 13.8, 2, .05)}" fill="${C.ring}"/>
    <path d="${blob(26.6, 144.6, 7.6, 7.2, 5, .06)}" fill="${C.spot}"/>
    <path d="${blob(43, 164, 2.8, 2.5, 8, .1)}" fill="#fff" opacity=".85"/>
    <g transform="translate(120 ${172 - up}) scale(${lo}) translate(-120 -172)"><path d="${loL}" fill="url(#${id}lilacL)"/>
    <path d="M70 203.5 Q47 206.5 36 211.5" transform="rotate(-11 50 207)" fill="none" stroke="url(#${id}veinL)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${blob(50, 207, 6.6, 6.2, 9, .07)}" fill="#fff"/></g></g>`;
  const wingR = (lo = 1, up = 0) => `<g class="wr">
    <path d="${upR}" fill="url(#${id}peachR)"/>
    <path d="${upR}" fill="url(#${id}wingBlush)"/>
    <path d="M182 135 Q219 138 233 145" transform="rotate(11 213 139)" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
    <path d="${blob(213, 139, 13.6, 13.2, 3, .05)}" fill="${C.ring}"/>
    <path d="${blob(213.4, 139.4, 7.3, 7, 7, .06)}" fill="${C.spot}"/>
    <path d="${blob(197, 159, 2.6, 2.3, 4, .1)}" fill="#fff" opacity=".85"/>
    <g transform="translate(120 ${170 - up}) scale(${lo}) translate(-120 -170)"><path d="${loR}" fill="url(#${id}lilacR)"/>
    <path d="M168 196 Q191.5 199.75 201 204.5" transform="rotate(11 188 200)" fill="none" stroke="url(#${id}veinR)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${blob(188, 200, 6.2, 5.8, 13, .07)}" fill="#fff"/></g></g>`;
  // Free-standing wings for the poses that are not sitting upright (same fills as the v4 pair)
  const peachWing = (cx, cy, rx, ry, rot, seed, spot, side = "L") => {
    const d = blob(cx, cy, rx, ry, seed, .02, rot, 10);
    return `<path d="${d}" fill="url(#${id}peach${side})"/><path d="${d}" fill="url(#${id}wingBlush)"/>
      <path d="${blob(spot[0], spot[1], spot[2], spot[2] * .97, 2, .05)}" fill="${C.ring}"/>
      <path d="${blob(spot[0] - .3, spot[1] + .4, spot[2] * .53, spot[2] * .5, 5, .06)}" fill="${C.spot}"/>`;
  };
  const lilacWing = (cx, cy, rx, ry, rot, seed, dot, side = "L") =>
    `<path d="${blob(cx, cy, rx, ry, seed, .03, rot, 10)}" fill="url(#${id}lilac${side})"/>
     <path d="${blob(dot[0], dot[1], dot[2], dot[2] * .94, 9, .07)}" fill="#fff"/>`;

  // ---------- Antennae: stalks run into the centre of each orb so they always connect ----------
  // twig: [where on the stalk, tip offset, bend offset]; `halo` adds a soft glow behind the orb
  const drawAnt = (a, w0 = 7.2, w1 = 5.5) => {
    let twig = "";
    if (a.twig) {
      const p = qpt(a.b, a.c, a.o, a.twig[0]);
      const end = [p[0] + a.twig[1][0], p[1] + a.twig[1][1]];
      twig = `<path d="${taper(p, [p[0] + a.twig[2][0], p[1] + a.twig[2][1]], end, 5.8, 3.6, 12)}" fill="${C.stalk}"/>
        <circle cx="${f1(end[0])}" cy="${f1(end[1])}" r="1.8" fill="${C.stalk}"/>`;
    }
    const [ox, oy] = a.o;
    const rays = (a.rays || []).map(deg => {
      const r = deg * Math.PI / 180;
      return `<line class="ray" x1="${f1(ox + Math.cos(r) * (a.r + 5))}" y1="${f1(oy + Math.sin(r) * (a.r + 5))}" x2="${f1(ox + Math.cos(r) * (a.r + 10))}" y2="${f1(oy + Math.sin(r) * (a.r + 10))}" stroke="#fcd96f" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`;
    }).join("");
    const [bx, by] = a.b;
    return `<circle cx="${ox}" cy="${oy}" r="${a.r + 6}" fill="#ffe7a0" opacity="${a.halo ?? .4}" ${blur(5)}/>
      <path d="${taper(a.b, a.c, a.o, w0, w1)}" fill="${C.stalk}"/>
      <circle cx="${f1(bx)}" cy="${f1(by)}" r="${f1(w0 / 2)}" fill="${C.stalk}"/>${twig}
      <circle cx="${ox}" cy="${oy}" r="${a.r}" fill="url(#${id}orb)" stroke="url(#${id}orbRim)" stroke-width="2.7"/>
      <ellipse cx="${f1(ox - a.r * .3)}" cy="${f1(oy - a.r * .32)}" rx="${f1(a.r * .32)}" ry="${f1(a.r * .24)}" fill="#fffdf4" opacity=".85" ${blur(1)}/>
      ${rays}`;
  };
  const ants = (list, w0, w1) => list.map(a => drawAnt(a, w0, w1)).join("");

  // ---------- Fluff: the v4 oval cloud head and pear-shaped body ----------
  // One or two short tan dashes on the forehead, like the stray tufts in the sticker art:
  // each [x1, y1, x2, y2, opacity] tip to tip, in final position
  const tufts = (list = [], w = 4) => list.map(([x1, y1, x2, y2, op = 1]) => {
    const len = Math.hypot(x2 - x1, y2 - y1), k = Math.max(0, len - w) / len / 2, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<path d="M${f1(mx - (x2 - x1) * k)} ${f1(my - (y2 - y1) * k)} L${f1(mx + (x2 - x1) * k)} ${f1(my + (y2 - y1) * k)}" stroke="#f1d3b7" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  }).join("");
  const headShape = scallop(120, 123, 71, 61.5, 16, 3, .55, 0, 1, [90, .07, 32]);
  const head = (t = "", sfx = "", part = "all") => `<g transform="${t}"><g transform="rotate(${TILT} 120 123)">${fluff(headShape, `${id}hc${sfx}`, `url(#${id}furH)`, `
    <ellipse cx="120" cy="189" rx="72" ry="14" fill="#f6e2cc" opacity=".45" ${blur(6)}/>`, 5.8, LINE, part)}</g></g>`;
  // The sticker art sits on a chunkier body than v4, so the width (and scallop count) can grow per mood
  const body = (t = "", [rx = 46, ry = 34, n = 13, pear = .22] = [], part = "all") => `<g transform="${t}">${fluff(scallop(119, 196, rx, ry, n, 7, .55, pear, .65, [152, .16, 28]), `${id}bc`, `url(#${id}furB)`, `
    <ellipse cx="119" cy="${196 + ry}" rx="${rx + 8}" ry="8" fill="#fbebdc" opacity=".55" ${blur(5)}/>`, 5.8, LINE, part)}</g>`;
  // Any other cloud (lying down, flopped): same outline and fill treatment
  const cloud = (cx, cy, rx, ry, n, seed, flat, sfx, fill = "furH", part = "all", pear = 0, line = LINE) => fluff(scallop(cx, cy, rx, ry, n, seed, .55, pear, flat), `${id}cl${sfx}`, `url(#${id}${fill})`, `
    <ellipse cx="${cx}" cy="${cy + ry}" rx="${rx}" ry="${f1(ry * .22)}" fill="#f6e2cc" opacity=".45" ${blur(6)}/>`, 5.8, line, part);
  // Head and body are one ball of fluff in the sticker art, with no line across the neck: draw every
  // part's outline first, then every fill, so the outline only shows around the outside
  const joined = (...parts) => parts.map(p => p("line")).join("") + parts.map(p => p("fill")).join("");
  // Keeps only the part of what it wraps that lies over the path d: lets the head redraw its outline
  // across a wing tucked between body and head without bringing back the neck line
  const onlyOver = (mid, d, s) => `<mask id="${id}${mid}" maskUnits="userSpaceOnUse" x="-30" y="-10" width="300" height="300">
    <path d="${d}" fill="#fff"/></mask><g mask="url(#${id}${mid})">${s}</g>`;

  // ---------- Eyes ----------
  // The eye is a hair lighter at the top; a darker band along its lower side holds the reflection
  const eyeBase = (e, s = 1) => {
    const rx = EYE_RX * s, ry = EYE_RY * s;
    return `<g transform="rotate(${e.rot || 0} ${e.x} ${e.y})">
      <path d="${blob(e.x, e.y, rx, ry, e.seed, .03, TILT, 10)}" fill="url(#${id}eyeG)"/>
      <path d="${blob(e.x + 1, e.y + ry * .53, rx * .62, ry * .3, e.seed + 3, .08, TILT)}" fill="${C.eyeTintDark}"/>
      <path d="${blob(e.x + 1, e.y + ry * .45, rx * .62, ry * .3, e.seed + 3, .08, TILT)}" fill="${C.eyeTint}"/></g>`;
  };
  // White shine with a thin crisp shadow line on its lower-right edge
  const hl = (e, s = 1, dx = 3.2, dy = -7.2) => {
    const x = e.x + dx * s, y = e.y + dy * s;
    return `<path d="${blob(x + .5 * s, y + .6 * s, 5.8 * s, 5.5 * s, e.seed + 1, .06)}" fill="#000"/>
      <path d="${blob(x, y, 5.2 * s, 4.9 * s, e.seed + 1, .06)}" fill="#fff"/>`;
  };
  const openEye = (e, s = 1) => `<g class="pupil"><g class="blink">${eyeBase(e, s)}${hl(e, s, e.hx, e.hy)}</g></g>`;
  // Closed eyes: ^ (happy) or ‿ (content / asleep), thick near-black strokes with round ends; arch deepens the curve
  const closedEye = (x, y, w, up, rot = 0, sw = 4.4, arch = 0) => {
    const d = up ? `M${x - w} ${y + 4} Q${x} ${y - 10 - arch} ${x + w} ${y + 4}` : `M${x - w} ${y - 3} Q${x} ${y + 8 + arch} ${x + w} ${y - 3}`;
    return `<path d="${d}" fill="none" stroke="${C.lid}" stroke-width="${sw}" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
  };
  // Worried eye: the top is cut by a line that rises toward the nose. A dark lid runs along the cut
  // in one stroke, thinning out as it reaches the outer edge, and flicks up slightly past the inner corner;
  // a blue tear pools at the outer bottom edge
  const tear = (x, y, rx = 7.5, ry = 6.2, rot = 0, op = 1) => `<g transform="rotate(${rot} ${x} ${y})" opacity="${op}">
    <path d="${blob(x, y, rx, ry, 17, .06)}" fill="url(#${id}tear)" stroke="#86aef0" stroke-width="1.2"/>
    <ellipse cx="${f1(x - rx * .3)}" cy="${f1(y - ry * .3)}" rx="${f1(rx * .32)}" ry="${f1(ry * .24)}" fill="#fff" opacity=".85"/></g>`;
  // An eye with its top cut off by a straight line from a point on the inner edge (inDeg above
  // the middle) to one on the outer edge (outDeg): inner high reads worried, inner low reads fierce
  // bow lifts the middle of the cut into a gentle arch. Returns the cut's ends, its curve's control
  // point and unit vectors along it and up from it, for drawing a lid on top
  const cutEye = (e, s, inDeg, outDeg, tag, bow = 0) => {
    const rx = EYE_RX * s, ry = EYE_RY * s, k = e.side, ti = inDeg * Math.PI / 180, to = outDeg * Math.PI / 180;
    const pin = [e.x - k * rx * Math.cos(ti), e.y - ry * Math.sin(ti)];
    const pout = [e.x + k * rx * Math.cos(to), e.y - ry * Math.sin(to)];
    const d = [pout[0] - pin[0], pout[1] - pin[1]], len = Math.hypot(d[0], d[1]);
    const u = [d[0] / len, d[1] / len], up = u[0] > 0 ? [u[1], -u[0]] : [-u[1], u[0]];
    const c = [(pin[0] + pout[0]) / 2 + up[0] * bow * 2, (pin[1] + pout[1]) / 2 + up[1] * bow * 2];
    const a = [pin[0] - d[0], pin[1] - d[1]], b = [pout[0] + d[0], pout[1] + d[1]];
    const cid = `${id}${tag}${k < 0 ? "L" : "R"}`;
    return [pin, `<clipPath id="${cid}"><path d="M${f1(a[0])} ${f1(a[1])} L${f1(pin[0])} ${f1(pin[1])} Q${f1(c[0])} ${f1(c[1])} ${f1(pout[0])} ${f1(pout[1])} L${f1(b[0])} ${f1(b[1])} L${f1(b[0])} ${f1(e.y + ry * 2)} L${f1(a[0])} ${f1(e.y + ry * 2)} Z"/></clipPath>
      <g clip-path="url(#${cid})">${eyeBase(e, s)}</g>`, pout, c, u, up];
  };
  const worriedEye = (e, s = 1, outDeg = 10, tearOp = 1) => {
    const k = e.side, [pin, eye, pout, c] = cutEye(e, s, 52, outDeg, "we", 2.6 * s);
    // The lid follows the gently arched cut; at the inner corner it flicks up a little
    const back = [pin[0] - (c[0] - pin[0]) * .2, pin[1] - (c[1] - pin[1]) * .2];
    const tip = [back[0] - k * .6 * s, back[1] - 1.5 * s];
    return `${eye}
      <path d="${taper(pin, c, pout, 3 * s, .4 * s, 24)}" fill="${C.eye}"/>
      <circle cx="${f1(pin[0])}" cy="${f1(pin[1])}" r="${f1(1.4 * s)}" fill="${C.eye}"/>
      <path d="${taper(pin, back, tip, 2.8 * s, 1.2 * s)}" fill="${C.eye}"/>
      <circle cx="${f1(e.x - k * 3.5 * s)}" cy="${f1(e.y - 3 * s)}" r="${f1(4.6 * s)}" fill="#fff"/>
      ${tear(e.x + k * 8.5 * s, e.y + 11 * s, 7.6 * s, 6.2 * s, k * -12, tearOp)}`;
  };
  // Determined: the cut drops toward the nose like a lowered brow, with a dark lid along it that pokes
  // a little past the eye at the outer end and only just at the inner one; the shine sits on the inner side
  const fierceEye = (e, s = 1, inDeg = 18, outDeg = 60) => {
    const [pin, eye, pout, , u] = cutEye(e, s, inDeg, outDeg, "fe"), extIn = 0, extOut = .9 * s;
    const a = [pin[0] - u[0] * extIn, pin[1] - u[1] * extIn], b = [pout[0] + u[0] * extOut, pout[1] + u[1] * extOut];
    return `${eye}
      <path d="M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}" stroke="${C.eye}" stroke-width="${f1(3 * s)}" stroke-linecap="round"/>
      <circle cx="${f1(e.x - e.side * 5.5 * s)}" cy="${f1(e.y - 1 * s)}" r="${f1(4.2 * s)}" fill="#fff"/>`;
  };
  // Starry: a big gold sparkle, a small one toward the outer edge and a white glint toward the nose
  const starEye = (e, s = 1, spin = 0) => {
    const k = e.side, gold = "#f8d779";
    const big = [e.x - k * 1 * s, e.y - 2 * s], small = [e.x + k * 7.5 * s, e.y + 8 * s];
    const turn = (p) => `transform="rotate(${spin} ${f1(p[0])} ${f1(p[1])})"`;
    return `${eyeBase(e, s)}
      ${star4(big[0], big[1], 8.6 * s, gold, `stroke="${gold}" stroke-width="${f1(1.4 * s)}" stroke-linejoin="round" ${turn(big)}`)}
      ${star4(small[0], small[1], 3.8 * s, gold, turn(small))}
      <circle cx="${f1(e.x - k * 9 * s)}" cy="${f1(e.y - 9 * s)}" r="${f1(2.2 * s)}" fill="#fff"/>`;
  };
  const xEye = (x, y, r = 8, rot = 0) => `<path d="M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}" stroke="${C.lid}" stroke-width="5.4" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;

  // ---------- Mouths and nose ----------
  const wMouth = (x, y, w, rot = 0) => `<path d="M${x - w} ${y - 2.2} Q${x - w * .5} ${y + 3.6} ${x} ${y - .6} Q${x + w * .5} ${y + 3.6} ${x + w} ${y - 2.2}" fill="none" stroke="${C.lip}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${rot} ${x} ${y})"/>`;
  const frown = (x, y, w, rot = 0, sw = 2.6) => `<path d="M${x - w} ${y + 2.4} Q${x} ${y - 4.4} ${x + w} ${y + 2.4}" fill="none" stroke="${C.lip}" stroke-width="${sw}" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
  const nose = (x, y, fill = C.nose) => `<path d="${blob(x, y, 2.4, 1.8, 6, .1, TILT)}" fill="${fill}"/>`;
  const oMouth = (x, y, rx = 4, ry = 5.5) => `<path d="${blob(x, y, rx, ry, 3, .06)}" fill="#8a3a4c"/>
    <ellipse cx="${x}" cy="${f1(y + ry * .45)}" rx="${f1(rx * .62)}" ry="${f1(ry * .34)}" fill="#ff8fab"/>`;
  const laugh = (x, y, w, rot = 0) => `<g transform="rotate(${rot} ${x} ${y})">
    <path d="M${x - w} ${y - 1} Q${x} ${y - 2.5} ${x + w} ${y - 1} Q${f1(x + w * .75)} ${f1(y + w * 1.15)} ${x} ${f1(y + w * 1.1)} Q${f1(x - w * .75)} ${f1(y + w * 1.15)} ${x - w} ${y - 1} Z" fill="#8a3a4c" stroke="#8a3a4c" stroke-width="1.2" stroke-linejoin="round"/>
    <ellipse cx="${x}" cy="${f1(y + w * .74)}" rx="${f1(w * .5)}" ry="${f1(w * .3)}" fill="#ff8fab"/></g>`;
  const smile = (x, y, w, rot = 0) => `<path d="M${x - w} ${y - 1.5} Q${x} ${y + 5.5} ${x + w} ${y - 2.5}" fill="none" stroke="${C.lip}" stroke-width="2.6" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;

  // ---------- Props: lantern (v4), cookie, fur paws, brown paws ----------
  const lanternArt = (lit, handle = true) => `
    ${handle ? `<path d="M112 183.5 C110.5 166 129.5 166 128 183.5" fill="none" stroke="${C.frame}" stroke-width="3.6" stroke-linecap="round"/>`
      : `<path d="M109 184 L109 180.5 Q109 177.5 112 177.5 L128 177.5 Q131 177.5 131 180.5 L131 184 Z" fill="${C.frame}"/>
         <circle cx="111.5" cy="176.5" r="2.6" fill="${C.frame}"/><circle cx="128.5" cy="176.5" r="2.6" fill="${C.frame}"/>`}
    <rect x="105" y="183" width="30" height="30" rx="7" fill="url(#${id}${lit ? "glass" : "glassOff"})" stroke="url(#${id}frameG)" stroke-width="3.4"/>
    ${star5(120, 198, 7.2, 3.2, lit ? "#ffffff" : "#f6efe0")}
    <path d="M109.5 216.8 Q120 219.6 130.5 216.8" fill="none" stroke="#45301e" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M109.5 215.9 L130.5 215.9" stroke="${C.frame}" stroke-width="3.4" stroke-linecap="round"/>`;
  // (x, y) is the centre of the glass
  const lantern = (x, y, s, rot = 0, lit = true, handle = true) => `
    ${lit ? `<path d="${blob(x, y - 3 * s, 27 * s, 25 * s, 14, .05)}" fill="#ffe8a0" opacity=".55" ${blur(7)}/>` : ""}
    <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-120 -198)">${lanternArt(lit, handle)}</g>`;
  // Cookie: round, a little wider than tall, with one bite out of the top
  const cookie = (x, y, rx, ry) => {
    const P = (u, v) => `${f1(x + u * rx)} ${f1(y + v * ry)}`;
    const d = `M${P(.3, -.86)} C${P(.75, -1.08)} ${P(1.02, -.6)} ${P(.99, -.05)} C${P(.96, .6)} ${P(.5, .99)} ${P(0, .97)} C${P(-.5, .99)} ${P(-.96, .6)} ${P(-.99, -.05)} C${P(-1.02, -.6)} ${P(-.75, -1.08)} ${P(-.3, -.86)} A${f1(rx * .32)} ${f1(ry * .36)} 0 0 0 ${P(.3, -.86)} Z`;
    const chips = [[-.5, -.3], [.42, -.42], [-.08, .1], [.52, .22], [-.55, .42], [.12, .58], [-.2, -.55]]
      .map(([u, v], i) => `<path d="${blob(x + u * rx, y + v * ry, 2.6, 2.3, 30 + i, .15)}" fill="#6a3f2a"/>`).join("");
    return `<path d="${d}" fill="url(#${id}cookie)" stroke="#a96f40" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M${P(-.78, -.25)} Q${P(-.7, -.72)} ${P(-.38, -.8)}" fill="none" stroke="#ecc08a" stroke-width="2" stroke-linecap="round" opacity=".8"/>${chips}`;
  };
  // Small round fur paws; the border turns warm gold on the side facing `light` (a lit lantern)
  const paw = (x, y, deg, seed, rx = 8.5, ry = 7.6, light = null) => {
    let grad = "", line = LINE;
    if (light) {
      let dx = light[0] - x, dy = light[1] - y;
      const len = Math.hypot(dx, dy) || 1, R = Math.max(rx, ry) + .5;
      dx /= len; dy /= len;
      const gid = `${id}pawLine${seed}`;
      grad = `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f1(x - dx * R)}" y1="${f1(y - dy * R)}" x2="${f1(x + dx * R)}" y2="${f1(y + dy * R)}">
        <stop offset="0" stop-color="#f0c6a4"/><stop offset=".4" stop-color="#f0c6a4"/><stop offset="1" stop-color="#c8893f"/></linearGradient>`;
      line = `url(#${gid})`;
    }
    return `${grad}
      ${fluff((a) => `<path d="${blob(x, y, rx, ry, seed, .04, deg)}" ${a}/>`,
        `${id}paw${seed}`, C.fur, `<ellipse cx="${x}" cy="${f1(y + ry * .76)}" rx="${f1(rx * .94)}" ry="${f1(ry * .45)}" fill="#f6e4d2" opacity=".7" ${blur(1)}/>`, 4.6, line)}`;
  };
  // A big glossy heart to hug (love); r is half its width
  const bigHeart = (x, y, r, rot = 0) => {
    const P = (u, v) => `${f1(u * r)} ${f1(v * r)}`;
    const d = `M${P(0, -.42)} C${P(-.22, -.95)} ${P(-1.02, -.92)} ${P(-1, -.28)} C${P(-.98, .28)} ${P(-.4, .62)} ${P(0, .9)} C${P(.4, .62)} ${P(.98, .28)} ${P(1, -.28)} C${P(1.02, -.92)} ${P(.22, -.95)} ${P(0, -.42)} Z`;
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="beat">
      <path d="${d}" fill="url(#${id}heartG)" stroke="#e1707f" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="${f1(r * .52)}" cy="${f1(-r * .42)}" rx="${f1(r * .2)}" ry="${f1(r * .11)}" transform="rotate(40 ${f1(r * .52)} ${f1(-r * .42)})" fill="#fff" opacity=".75"/></g></g>`;
  };
  // Brown paws (the sticker art uses them for cookie-holding, clasping and reaching)
  const bpaw = (x, y, rx, ry, deg, seed, light = [x - 20, y - 30]) => foot(x, y, rx, ry, deg, id, seed, light);

  // ---------- Little marks around the stickers ----------
  const strokes = (list, color, w = 2.6, cls = "") => `<g class="${cls}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round">${list.map(d => `<path d="${d}"/>`).join("")}</g>`;
  const dash = (x, y, len, deg) => {
    const r = deg * Math.PI / 180, dx = Math.cos(r) * len / 2, dy = Math.sin(r) * len / 2;
    return `M${f1(x - dx)} ${f1(y - dy)} L${f1(x + dx)} ${f1(y + dy)}`;
  };
  // Gold sparkle with a pale centre, like the ones floating around the stickers
  const sparkle = (x, y, s) => star4(x, y, s, C.gold) + star4(x, y, s * .42, "#fff6d8");
  const question = (x, y, size, color) => `<g transform="rotate(10 ${x} ${y})"><text class="wobble" x="${x}" y="${f1(y + size * .36)}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="${size}" fill="${color}">?</text></g>`;
  const ground = (cx = 119, cy = 236, rx = 84) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="6.6" fill="${C.shadow}" ${blur(2)}/>`;

  // ---------- Sitting rig: v4 parts, each with its own placement per mood ----------
  // o = { fig, wl, wr, body, head: transforms (fig turns wings, body and head together); lo, loUp: lilac wing scale and lift;
  //       ant: antennae; tufts: forehead dashes; feet, face, hands: markup in final position; under: tucked behind the body;
  //       back, front: unbobbed }
  const sit = (o) => `
    ${o.back || ""}
    ${o.ground ?? ground()}
    <g class="bob"><g class="${o.cls || ""}">
      ${o.under || ""}
      <g transform="${o.fig || ""}">
        <g transform="${o.wl || ""}">${wingL(o.lo, o.loUp)}</g><g transform="${o.wr || ""}">${wingR(o.lo, o.loUp)}</g>
        ${joined(p => body(o.body, o.bodySize, p), p => head(o.head, "", p))}
      </g>
      ${tufts(o.tufts)}
      ${ants(o.ant)}
      ${o.feet || ""}
      ${o.face}
      ${o.hands || ""}
    </g></g>
    ${o.front || ""}`;

  const poses = {
    // Wide open eyes looking off to one side, a small "o" mouth, lantern held low, a pink "?"
    curious: () => sit({
      wl: "translate(1 -7)", wr: "translate(-11 -8)",
      body: "translate(-4 -4)", bodySize: [52, 34, 15, .06], head: "translate(-2 -6)",
      tufts: [[89.5, 96, 95.5, 93.5, .7]],
      ant: [
        { b: [86, 71], c: [76, 54], o: [46, 54], r: 16, twig: [.5, [-6, 7], [-5, 2]] },
        { b: [124, 60], c: [127, 35], o: [148, 20], r: 16, twig: [.45, [9, 1], [5, -4]] },
      ],
      feet: foot(93, 221, 7.5, 10.5, -70, id, 2),
      face: `${blush(86, 151, 12.5, 9.5, 21, -10)}${blush(173, 133, 12.5, 9.5, 23, 10)}
        ${openEye({ x: 99, y: 129, side: -1, seed: 11, rot: 5 })}${openEye({ x: 154, y: 118, side: 1, seed: 11 })}
        ${oMouth(132, 138, 5, 6)}`,
      hands: `${lantern(135, 202, 1.35, 0)}${paw(112, 183, -20, 41, 9.5, 8.5, [135, 200])}${paw(160, 179, 20, 47, 9.5, 8.5, [135, 200])}`,
      back: question(201, 61, 40, "#f29aac"),
    }),

    // Eyes squeezed shut in a ^ ^ grin, mouth open in a laugh, little pink joy lines
    happy: () => sit({
      wl: "translate(-4 5)", wr: "translate(-7 0)",
      body: "translate(-4 -4)", bodySize: [52, 34, 15, .06], head: "translate(-3 -4)",
      tufts: [[85, 99, 96.5, 91.5], [137.2, 89.7, 146.9, 92.8]],
      ant: [
        { b: [98, 61], c: [88, 39], o: [68, 28], r: 16, twig: [.27, [-10, 2], [-5, -3]] },
        { b: [136, 59], c: [146, 38], o: [168, 29], r: 16, twig: [.27, [10, 2], [5, -3]] },
      ],
      feet: foot(95, 223, 7, 10, -60, id, 2),
      face: `${blush(73, 149, 13, 10, 21, -10)}${blush(173, 132, 13, 10, 23, 10)}
        ${closedEye(88, 127, 14, true, -6, 5.4)}${closedEye(154, 116, 14, true, -6, 5.4)}
        ${laugh(123, 140, 10, -6)}`,
      hands: `${lantern(128, 205, 1.35, 0)}${paw(103, 188, -20, 41, 9.5, 8.5, [128, 203])}${paw(153, 184, 20, 47, 9.5, 8.5, [128, 203])}`,
      back: strokes([dash(28, 68, 11, 58), dash(16, 84, 11, 15), dash(208, 71, 11, -58), dash(219, 85, 11, -15)], "#f28ea3", 3.6),
    }),

    // Sparkles in both eyes, mouth open, little brown fists up, bouncing
    excited: () => sit({
      cls: "bounce",
      wl: "translate(4 -10)", wr: "translate(1 -9)",
      body: "translate(5 -3)", bodySize: [55, 34, 15, .06], head: "translate(6 6)",
      tufts: [[102.5, 109, 111.3, 105], [153, 99.5, 160, 98.5, .55]],
      ant: [
        { b: [104, 79], c: [93, 59], o: [66, 43], r: 16, twig: [.5, [-10, 2], [-5, -3]] },
        { b: [146, 74], c: [153, 53], o: [179, 36], r: 16, twig: [.5, [10, 2], [5, -3]] },
      ],
      feet: foot(83, 219, 9, 12, -40, id, 2) + foot(158, 223, 9, 11.5, 50, id, 5),
      face: `${blush(94, 164, 13, 10.5, 21, -10)}${blush(189, 146, 13, 10.5, 23, 10)}
        ${starEye({ x: 108, y: 139, side: -1, seed: 11, rot: 5 }, 1.18)}${starEye({ x: 168, y: 129, side: 1, seed: 11 }, 1.18)}
        ${oMouth(143, 154, 7.5, 9.5)}`,
      hands: `${bpaw(121, 196, 8, 10, 20, 7)}${bpaw(168, 191, 8, 10, -20, 8)}`,
      back: `${sparkle(23, 59, 12)}${sparkle(216, 63, 10)}`,
    }),

    // Leaning over to hug a big glossy heart, eyes closed happily, pink hearts floating
    love: () => sit({
      fig: "rotate(18 120 170)",
      wl: "translate(1 -11)", wr: "translate(-9 3)",
      bodySize: [50, 34, 14, .06], head: "translate(-5 9)",
      tufts: [[113.5, 98.5, 124.5, 98.5]],
      ant: [
        { b: [133, 78], c: [131, 50], o: [109, 31], r: 16, twig: [.45, [-9, 3], [-5, -3]] },
        { b: [176, 89], c: [189, 72], o: [222, 73], r: 16, twig: [.5, [1, 9], [3, 4]] },
      ],
      feet: foot(59, 214, 9.5, 12, -30, id, 2) + foot(133, 226, 8, 10, 10, id, 5),
      face: `${blush(83, 136, 12.5, 10, 21, 10)}${blush(178, 169, 12.5, 10, 23, 25)}
        ${closedEye(104, 130, 14, true, 18, 6.4, 4)}${closedEye(166, 150, 14, true, 18, 6.4, 4)}
        ${smile(133, 151, 6.5, 18)}`,
      hands: `${bigHeart(134, 204, 38, 14)}${paw(104, 185, 14, 41, 10, 9.5)}${paw(166.5, 220, 39, 47, 10, 9.5)}`,
      back: `${heart(48, 41, 1.75, `fill="${C.heart}" opacity=".9"`, -26)}${heart(228, 108, 1.25, `fill="${C.heart}" opacity=".9"`, 26)}
        ${strokes([dash(83, 55, 5, -40)], "#e9c3a4", 2.4)}`,
    }),

    // Eyes wide, mouth a round "o", lantern clutched in front, a pink "!!"
    surprised: () => sit({
      wl: "translate(2 -8)", wr: "translate(-6 -3)",
      body: "translate(-2 -4)", bodySize: [56, 34, 15, .06], head: "translate(-2 -5)",
      tufts: [[91.3, 92.2, 102.8, 88.4], [146.5, 92, 151, 91, .55]],
      ant: [
        { b: [103, 64], c: [99, 39], o: [75, 21], r: 16, twig: [.5, [-10, 3], [-5, -3]] },
        { b: [149, 66], c: [158, 52], o: [188, 46], r: 16, twig: [.4, [9, 4], [5, -2]] },
      ],
      feet: foot(74, 218, 8.5, 11, -45, id, 2) + foot(159, 219, 8.5, 11, 45, id, 5),
      face: `${blush(76, 141, 13, 10, 21, -8)}${blush(165, 146, 13, 10, 23, 8)}
        ${openEye({ x: 93, y: 120, side: -1, seed: 11, rot: 5 }, 1.03)}${openEye({ x: 151, y: 121, side: 1, seed: 11 }, 1.03)}
        ${oMouth(122, 139, 6.5, 8.5)}`,
      hands: `${lantern(118, 207, 1.35, 0)}${paw(94, 191, -20, 41, 9.5, 8.5, [118, 205])}${paw(143, 191, 20, 47, 9.5, 8.5, [118, 205])}`,
      back: `${strokes(["M11 39 L15.5 59", "M27 37 L29 57"], "#f28ea3", 5.5)}
        <circle cx="17.5" cy="69" r="3.3" fill="#f28ea3"/><circle cx="30" cy="66.5" r="3.3" fill="#f28ea3"/>`,
    }),

    // Whole body tipped over to one side, one antenna curled into a question mark, a brown "?"
    confused: () => sit({
      fig: "rotate(-15 120 170)",
      wl: "translate(10 -4)", wr: "translate(5 4)",
      body: "translate(-4 0)", bodySize: [54, 34, 15, .06], head: "translate(8 3)",
      tufts: [[133, 93.8, 145.6, 90.6], [87.5, 116.6, 95, 107]],
      ant: [
        { b: [76, 86], c: [64, 66], o: [28, 73], r: 16, twig: [.55, [-1, 8], [-4, 3]] },
        { b: [118, 68], c: [140, 28], o: [99, 23], r: 16, twig: [.18, [-8, 1], [-4, -3]] },
      ],
      feet: foot(101, 221, 8, 9.5, -70, id, 2) + foot(160, 218, 8.5, 10, 60, id, 6),
      face: `${blush(93, 168, 12.5, 10, 21, -15)}${blush(179, 129, 12.5, 10, 23, -15)}
        ${openEye({ x: 103, y: 146, side: -1, seed: 11 }, .95)}${openEye({ x: 158, y: 121, side: 1, seed: 11 }, .95)}
        ${frown(139, 148, 4.5, -24)}`,
      hands: `${paw(124, 218, -10, 41, 8.5, 7.6)}${paw(162, 207, 15, 47, 8.5, 7.6)}`,
      back: question(181, 56, 40, "#5e4030"),
    }),

    // Paws pressed together under the chin, a small pout, three dots filling in
    thinking: () => sit({
      wl: "translate(-2 -4)", wr: "translate(-3 -9)",
      body: "translate(4 -11)", bodySize: [52, 34, 15, .06], head: "translate(0 -8)",
      tufts: [[100.3, 96.3, 110.6, 89.7], [149.4, 84.4, 160, 87.8]],
      ground: ground(124, 222, 84),
      ant: [
        { b: [94, 66], c: [88, 43], o: [60, 31], r: 16, twig: [.28, [-10, 2], [-5, -3]] },
        { b: [141, 61], c: [149, 43], o: [176, 33], r: 16, twig: [.28, [10, 2], [5, -3]] },
      ],
      feet: foot(99, 211, 8.5, 11, -50, id, 2) + foot(166, 209, 8.5, 11, 50, id, 5),
      face: `${blush(98, 148, 13, 10, 21, -10)}${blush(184, 129, 13, 10, 23, 10)}
        ${openEye({ x: 111, y: 126, side: -1, seed: 11, rot: 5 }, .94)}${openEye({ x: 168, y: 114, side: 1, seed: 11 }, .94)}
        ${frown(144, 134, 4)}`,
      hands: `${paw(130, 163, -8, 41, 12, 15)}${paw(157, 162, 8, 47, 12, 15)}`,
      back: `<g class="dots" fill="#e7a2a4"><circle cx="201" cy="69" r="3.4"/><circle cx="214" cy="69" r="3.4"/><circle cx="227" cy="69" r="3.4"/></g>`,
    }),

    // Gold sparkles in both eyes, paws up at the chest, sparkles all around
    starry: () => sit({
      wl: "translate(-3 -21)", wr: "translate(-12 -3)",
      body: "translate(-8 -12)", bodySize: [52, 34, 15, .06], head: "translate(-3 -4)",
      ground: ground(112, 220, 84),
      ant: [
        { b: [108, 61], c: [101, 43], o: [81, 28], r: 16, twig: [.5, [-10, 2], [-5, -3]] },
        { b: [146, 66], c: [158, 48], o: [181, 39], r: 16, twig: [.45, [9, 4], [5, -2]] },
      ],
      feet: foot(76, 206, 8.5, 11, -50, id, 2) + foot(139, 209, 8.5, 11, 40, id, 5),
      face: `${blush(66, 131, 13, 10.5, 21, -8)}${blush(157, 143, 13, 10.5, 23, 8)}
        ${starEye({ x: 85, y: 112, side: -1, seed: 11, rot: 5 }, 1.08, 12)}${starEye({ x: 144, y: 119, side: 1, seed: 11 }, 1.08, 12)}
        ${oMouth(112, 132, 3.4, 4.8)}`,
      hands: `${paw(92, 159, -10, 41, 11, 12.5)}${paw(133, 163, 10, 47, 11, 12.5)}`,
      back: `${sparkle(24, 49, 13)}${sparkle(215, 73, 11)}`,
    }),

    // Charging forward with the lantern held out in front, lowered brows, a little smirk, speed lines
    determined: () => `
      ${strokes(["M18 13 L66 34", "M38 38 L71 53", "M-12 149 L19 164", "M4 173 L41 188", "M-4 186 L28 199"], "#f3dcc2", 5.5)}
      ${strokes(["M231 93 L222 100 L232 104", dash(236, 56, 7, -60), dash(243, 64, 6, -25)], "#f4c752", 2.8, "glint")}
      <g class="lean">
        ${peachWing(43, 103, 43, 40, -15, 31, [50, 94, 13], "L")}
        ${peachWing(203, 150, 27, 34, 15, 33, [206, 148, 11], "R")}
        ${lilacWing(42, 156, 22, 28, -10, 9, [41, 156, 7], "L")}
        ${lilacWing(168, 191, 26, 18, 10, 13, [169, 193, 6], "R")}
        ${joined(p => cloud(128, 182, 46, 26, 12, 7, .7, "b", "furB", p), p => head("translate(132 119) rotate(10) translate(-120 -123)", "", p))}
        ${tufts([[121, 90, 131, 94.4], [169.7, 102.5, 176.9, 106.9]])}
        ${ants([
          { b: [126, 63], c: [116, 43], o: [93, 30], r: 16, twig: [.5, [-7, 6], [-5, 1]] },
          { b: [176, 78], c: [189, 68], o: [216, 70], r: 16, twig: [.5, [1, 9], [3, 4]] },
        ])}
        ${blush(94, 133, 12, 9.5, 21, 10)}${blush(183, 156, 12, 9.5, 23, 10)}
        <g transform="rotate(18 113 128)">${fierceEye({ x: 113, y: 128, side: -1, seed: 11 }, .98)}</g>${fierceEye({ x: 174, y: 139, side: 1, seed: 11 }, .98)}
        ${smile(143, 147, 7.5, 10)}
        ${lantern(73, 174, 1.6, 12)}
        ${bpaw(109, 203, 10, 12.5, -60, 7)}
      </g>`,

    // Eyes low in the face, lantern held up under the chin, three pink blush lines
    shy: () => sit({
      wl: "translate(5 -3)", wr: "translate(-1 8)",
      body: "translate(2 2)", bodySize: [57, 34, 16, .06], head: "translate(1 9)",
      tufts: [[76.6, 121.9, 85.6, 116.9], [125.6, 107.2, 135.6, 109.1]],
      ant: [
        { b: [88, 84], c: [71, 62], o: [47, 56], r: 16, twig: [.45, [-10, 5], [-5, -1]] },
        { b: [116, 78], c: [119, 46], o: [135, 28], r: 16, twig: [.45, [10, 1], [5, -4]] },
      ],
      feet: foot(77, 223, 7, 10.5, -44, id, 2) + foot(160, 220, 7, 10.8, 44, id, 5),
      face: `${blush(73, 179, 12, 9, 21, -10)}${blush(164, 163, 12, 9, 23, 10)}
        ${openEye({ x: 88, y: 158, side: -1, seed: 11, rot: 5 }, .98)}${openEye({ x: 144, y: 148, side: 1, seed: 11 }, .98)}
        ${nose(116, 165, "#d7a28c")}`,
      hands: `${lantern(121, 209, 1.25, -3)}${paw(91, 193, -20, 41, 9, 8, [121, 205])}${paw(142, 184, 20, 47, 9, 8, [121, 205])}`,
      back: strokes([dash(178, 64, 9, -80), dash(189, 68, 9, -60), dash(199, 73, 9, -40)], "#f28ea3", 3),
    }),

    // Head tipped to the side, eyes closed in a content ‿, lantern lifted up on one side, standing
    proud: () => {
      const H = "translate(-22 0) rotate(18 121 121.5)";
      return sit({
        wl: "translate(-2 -21)", wr: "translate(-13 6)", lo: 1.15, loUp: 10,
        body: "translate(-14 -10) rotate(4 119 196)", bodySize: [46, 31, 13, .1], head: H, ground: ground(111, 233, 76),
        tufts: [[128.8, 93.4, 137.5, 98.8]],
        ant: [
          { b: [96, 66], c: [99, 36], o: [76, 24], r: 16, twig: [.2, [-10, 2], [-5, -4]] },
          { b: [134, 73], c: [152, 56], o: [181, 44], r: 16, twig: [.4, [9, 6], [6, 0]] },
        ],
        under: foot(89, 225, 11, 8, -4, id, 2) + foot(133, 223, 11, 8, 6, id, 5),
        face: `<g transform="${H}">${blush(79, 143, 12, 9.5, 21, -13)}${blush(164, 137, 12, 9.5, 23, 10)}
          ${closedEye(EYE_L.x, EYE_L.y, 12.5, false, TILT, 5.8)}${closedEye(EYE_R.x, EYE_R.y, 12.5, false, TILT, 5.8)}
          ${wMouth(121.6, 134.5, 6.5, TILT)}</g>`,
        hands: `${lantern(71, 188, 1.4, 10)}${paw(55, 162, -20, 41, 9.5, 8.5, [71, 188])}${paw(104, 176, 20, 47, 9.5, 8.5, [71, 188])}`,
        back: `${star4(23, 53, 15, "#fff3cf", `stroke="${C.gold}" stroke-width="3" stroke-linejoin="round"`)}${star4(209, 83, 8, C.gold)}`,
      });
    },

    // Slumped, tears welling, one antenna drooping; the lantern is set down on the ground beside it
    sad: () => sit({
      wl: "translate(-4 -15)", wr: "translate(-2 -10)",
      body: "translate(-1 -6)", bodySize: [60, 33, 16, .06], head: "translate(0 2)", lo: 1.12,
      tufts: [[90.6, 99.5, 95, 98.5, .6]],
      ant: [
        { b: [86, 77], c: [80, 46], o: [39, 59], r: 15.5, twig: [.45, [-4, 10], [-6, 4]] },
        { b: [127, 64], c: [129, 40], o: [141, 21], r: 15.5, twig: [.28, [10, 0], [5, -5]] },
      ],
      feet: foot(117, 215, 8, 9.5, -20, id, 2) + foot(156, 210, 8.5, 9.5, 30, id, 5),
      face: `${blush(76, 158, 13, 10, 21, -10)}${blush(176, 139, 13, 10, 23, 10)}
        <g transform="rotate(-12 94 136)">${worriedEye({ x: 94, y: 136, side: -1, seed: 11 }, 1.08, 10)}</g>${worriedEye({ x: 156, y: 128, side: 1, seed: 11 }, 1, 10)}
        ${frown(129, 147, 6)}`,
      front: lantern(79, 202, 1.45, -3, true, false),
      back: `${strokes(["M190 56 q3 -7 9 -4", "M203 71 q4 -6 9 -2"], "#e9c3a4", 3)}
        ${strokes([dash(18, 76, 6, 40), dash(14, 83, 5, 10)], "#f7d67a", 2.4, "glint")}`,
    }),

    // Both antennae arched over, worried eyes with tears, brown paws clasped at the chest
    hurt: () => sit({
      cls: "shiver",
      wl: "translate(-4 4) rotate(-4 60 170)", wr: "translate(1 -13)",
      body: "translate(-7 -7)", bodySize: [60, 34, 16, .06], head: "translate(109 118) scale(1.07) translate(-120 -123)",
      tufts: [[70.6, 103.8, 79.7, 98.8], [123, 94, 132.8, 98]],
      ant: [
        { b: [80, 67], c: [55, 27], o: [21, 94], r: 15.5, twig: [.5, [-1, 9], [-5, 3]] },
        { b: [126, 58], c: [136, 14], o: [159, 79], r: 15.5, twig: [.5, [5, 8], [5, 2]] },
      ],
      feet: foot(76, 216, 8, 10.5, -35, id, 2) + foot(146, 218, 8, 10.5, 25, id, 5),
      face: `${blush(59, 158, 13, 10, 21, -10)}${blush(158, 151, 13, 10, 23, 10)}
        ${worriedEye({ x: 76, y: 145, side: -1, seed: 11 }, 1, 5, .88)}${worriedEye({ x: 136, y: 144, side: 1, seed: 11 }, 1, 5, .88)}
        ${frown(106, 155, 5.5, 0, 3.6)}`,
      hands: `${strokes(["M107 195.8 Q102.5 199.5 98 200.6", "M117.5 194.6 Q123 197.6 128.5 197.6"], "#e6c4a4", 2.4)}
        ${bpaw(105.5, 180.5, 7.4, 10.5, -12, 7)}${bpaw(114.5, 181.3, 8.6, 12.3, -6, 8)}
        <path d="M109.5 171.5 Q104.6 177 106 183 Q106.8 186.6 108 188.5" fill="none" stroke="#3f281d" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>`,
      back: `${strokes(["M188 60 q3 -7 9 -3", "M201 70 q4 -6 9 -2"], "#a99be6", 3)}
        ${strokes(["M-10 190 q-4 6 0 12", "M-4 194 q-3 5 0 9", "M232 178 q4 6 0 12", "M226 182 q3 5 0 9"], "#d9bfa6", 2.4)}
        ${strokes([dash(2, 112, 6, 30), dash(-2, 120, 5, 0)], "#f7d67a", 2.4, "glint")}`,
    }),

    // Closed happy eyes, a bitten cookie held in brown paws, hearts and crumbs
    fed: () => sit({
      wl: "translate(5 -11)", wr: "translate(-1 -14)",
      body: "translate(3 -10)", bodySize: [64, 36, 18, .06], head: "translate(1 -9)", lo: 1.18, loUp: 4,
      tufts: [[92.5, 97.2, 103, 90.6], [145, 84.2, 153.5, 87.3]],
      ground: ground(121, 224, 86),
      ant: [
        { b: [93, 64], c: [76, 38], o: [59, 26], r: 16, twig: [.45, [-10, 2], [-5, -4]] },
        { b: [138, 58], c: [147, 34], o: [169, 24], r: 16, twig: [.45, [10, 0], [5, -5]] },
      ],
      feet: foot(66, 208, 7, 10.5, -50, id, 2) + foot(165, 210, 7, 10.5, 45, id, 5),
      face: `${blush(84, 146, 13, 11, 21, -10)}${blush(179, 128, 13, 11, 23, 10)}
        ${closedEye(99, 125, 13, true, -10, 5.8)}${closedEye(161, 114, 13, true, -10, 5.8)}
        ${wMouth(132, 133, 9, -8)}`,
      hands: `${strokes(["M113 199.5 Q107.5 202.5 101.5 202", "M164.5 181 Q169.5 188 176 193.5"], "#e6c4a4", 2.4)}
        ${cookie(137, 168, 27, 23)}
        <path d="${blob(173, 148, 2.4, 2, 3, .2)}" fill="#c48a50"/><path d="${blob(178, 154, 2, 1.7, 4, .2)}" fill="#c48a50"/>
        ${bpaw(119, 193, 9, 11.5, 35, 7)}${bpaw(158, 172, 9, 12, -15, 8)}`,
      back: `${heart(26, 62, 1.8, `fill="${C.heart}" opacity=".72"`, -32)}${heart(208, 57, 1.15, `fill="${C.heart}" opacity=".72"`, 32)}
        <path d="${blob(46, 226, 3, 2.6, 5, .2)}" fill="#c48a50"/>`,
    }),

    // Curled up asleep with the lantern beside it as a night light
    sleepy: () => `
      <ellipse cx="118" cy="226" rx="112" ry="7" fill="${C.shadow}" ${blur(2)}/>
      <path d="${blob(40, 188, 34, 32, 14, .05)}" fill="#ffe8a0" opacity=".55" ${blur(7)}/>
      <g class="breathe">
        ${peachWing(35, 123, 41, 30, -8, 31, [33, 123, 13], "L")}
        ${lilacWing(24, 176, 30, 23, -10, 9, [16, 178, 6], "L")}
        ${peachWing(219, 170, 18, 29, 10, 33, [212, 178, 9.5], "R")}
        ${lilacWing(211, 203, 19, 13, 0, 13, [208, 205, 4.5], "R")}
        ${cloud(127, 166, 73, 58, 17, 5, .36, "s")}
        ${ants([
          { b: [119, 126], c: [108, 103], o: [81, 101], r: 15, twig: [.45, [-2, 9], [-5, 4]], halo: .5 },
          { b: [173, 144], c: [190, 126], o: [223, 138], r: 15, twig: [.5, [0, 9], [3, 4]], halo: .5 },
        ], 5.8, 4.4)}
        ${blush(76, 190, 12, 9, 21, 15)}${blush(163, 218, 11, 8, 23, 15)}
        ${closedEye(96, 188, 12, false, 17, 5.8)}${closedEye(153, 206, 12, false, 17, 5.8)}
        ${wMouth(120, 205, 6, 17)}
        ${paw(73, 207, 10, 51, 11, 8.5, [40, 196])}
      </g>
      ${lantern(39, 196, 1.5, 0)}
      <g class="zz" font-family="Fredoka, sans-serif" font-weight="600" fill="#b9a6ee">
        <text x="154" y="98" font-size="18" transform="rotate(-6 161 91)">z</text>
        <text x="180" y="82" font-size="22" transform="rotate(-6 189 74)">Z</text>
        <text x="208" y="65" font-size="26" transform="rotate(-6 218 56)">Z</text></g>
      ${strokes([dash(66, 78, 6, -60), dash(60, 84, 5, -30), dash(240, 120, 6, -120), dash(244, 128, 5, -150)], "#f7d67a", 2.4, "glint")}`,

    // Belly-flop: lying flat, the head the top of the mound and the body sloping off to the left,
    // wings sticking up, feet out behind, a paw on the ground, X eyes
    flop: () => `
      <radialGradient id="${id}furF" gradientUnits="userSpaceOnUse" cx="166" cy="180" r="82">
        <stop offset="0" stop-color="#fffdf9"/><stop offset=".6" stop-color="#fffaf3"/><stop offset="1" stop-color="${C.fur}"/></radialGradient>
      <linearGradient id="${id}flopLine" gradientUnits="userSpaceOnUse" x1="0" y1="104" x2="0" y2="212">
        <stop offset="0" stop-color="#f6dbc2"/><stop offset=".45" stop-color="#f0c6a4"/><stop offset=".75" stop-color="#f0c6a4"/><stop offset="1" stop-color="#f7e2cf"/></linearGradient>
      <ellipse cx="112" cy="205" rx="118" ry="10" fill="#f6e3cc" opacity=".85" ${blur(2)}/>
      ${peachWing(93, 87, 48, 38, 10, 4, [93, 84, 15.5], "L")}
      <g transform="translate(0 9) rotate(55 44 126)">${lilacWing(44, 126, 46, 39, -25, 6, [31, 119, 10], "L")}</g>
      ${foot(13, 189, 8.5, 13.5, 64, id, 2, [40, 150])}
      ${ants([{ b: [201, 153], c: [217, 140], o: [238, 165], r: 14, twig: [.66, [2, 9], [3, 4]] }], 5.8, 4.4)}
      ${joined(p => `<g transform="rotate(-9 74 181)">${cloud(74, 181, 47, 26, 11, 11, .4, "b", "furB", p, 0, `url(#${id}flopLine)`)}</g>`,
        p => cloud(147, 157, 64, 50, 17, 5, .5, "h", "furF", p, .22, `url(#${id}flopLine)`))}
      ${foot(40, 198, 10.5, 17, 66, id, 5, [40, 150])}
      ${paw(88, 203, 8, 41, 11, 8.5)}
      ${ants([{ b: [176, 136], c: [170, 112], o: [203, 114], r: 14, twig: [.45, [8, 3], [4, -3]] }], 5.8, 4.4)}
      ${blush(118, 198, 13, 10, 21)}${blush(204, 191, 12, 10, 23)}
      ${xEye(138, 181, 8, -12)}${xEye(184, 179, 8, -12)}
      ${strokes(["M38 70 q4 -3 8 0", "M14 158 q3 3 0 6"], "#e2c4a6", 2.2)}${star4(174, 93, 5, "#ead2b6")}${star4(186, 100, 3, "#ead2b6")}`,

    // Peeking out from behind a door: one eye, one antenna, a paw gripping the edge
    peek: () => {
      // The clip stays put at the door while the figure leans out and back inside it
      const hid = (s) => `<g clip-path="url(#${id}doorClip)">${s}</g>`;
      return `
      <clipPath id="${id}doorClip"><rect x="-30" y="-10" width="193" height="260"/></clipPath>
      ${strokes([dash(44, 69, 9, 55), dash(38, 85, 9, 5)], "#f4c752", 3.2, "glint")}
      ${hid(`<g class="lean">
          <g transform="rotate(120 71 123)">${peachWing(71, 123, 35, 60, 0, 31, [68, 128, 14], "L")}</g>
          ${lilacWing(132, 182, 35, 29, -12, 9, [133, 188, 7], "L")}
          ${foot(153, 211, 8, 11, 62, id, 2)}
          ${head("translate(157 107) scale(.95 1) translate(-120 -123)")}${tufts([[126.6, 81.3, 134.7, 75.6]])}
          ${ants([{ b: [127, 49], c: [118, 29], o: [94, 22], r: 16, twig: [.45, [-9, 3], [-5, -3]] }])}
          ${blush(129, 144, 12, 10, 21)}
          ${openEye({ x: 139, y: 118, side: 1, seed: 11 }, 1.12)}</g>`)}
      <path d="M163 44 L196 44 Q216 44 216 64 L216 229 L163 229 Z" fill="url(#${id}door)" opacity=".9"/>
      ${strokes(["M184 130 q3 4 2 9", "M194 138 q2 3 1 7"], "#ead6c0", 2.4)}
      <path d="M163 3 L163 229" stroke="#5e4030" stroke-width="4.2" stroke-linecap="round"/>
      <g class="lean">${paw(158, 159, 0, 53, 10.5, 10, null)}</g>`;
    },

    // Mid-hop after a glowing butterfly: three-quarter view, antennae swept back, paws reaching
    chase: () => {
      const H = "translate(113 108) scale(.9) translate(-120 -123)";
      const fur = (part) => `<g transform="rotate(-25 108 170)">${fluff(scallop(108, 170, 35, 25, 10, 7, .55, .1, .8), `${id}cb`, `url(#${id}furB)`, "", 5.8, LINE, part)}</g>`;
      return `
      ${strokes(["M-10 110 q4 3 8 1"], "#e2c4a6", 2.2)}
      <path d="M232 80 Q246 116 214 134 Q190 148 172 190" fill="none" stroke="#f2c14e" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 9"/>
      ${star4(138, 26, 9, C.gold)}
      <g class="fly">
        <path d="${blob(198, 50, 11, 18, 4, .04, -18)}" class="flutter" fill="url(#${id}fly)" stroke="#f2c14e" stroke-width="2.6"/>
        <path d="${blob(205, 70, 8, 8, 6, .05)}" fill="url(#${id}fly)" stroke="#f2c14e" stroke-width="2.4"/>
        <path d="${blob(221, 40, 15, 22, 2, .04, 22)}" class="flutter" fill="url(#${id}fly)" stroke="#f2c14e" stroke-width="2.6"/>
        <path d="${blob(219, 64, 9, 9, 8, .05)}" fill="url(#${id}fly)" stroke="#f2c14e" stroke-width="2.4"/>
        <path d="M207 34 Q209 52 210 70" fill="none" stroke="#e9b53e" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      <g class="hop">
        ${peachWing(40, 152, 30, 44, 3, 31, [33.3, 149.3, 11], "L")}
        ${foot(39, 204, 7.5, 11, 60, id, 2, [80, 160])}
        ${foot(86, 203, 7.5, 11, 30, id, 5, [80, 160])}
        ${fur("line")}${head(H, "", "line")}${fur("fill")}
        ${lilacWing(68, 183, 36, 28, -22, 9, [67.1, 188.3, 7], "L")}
        ${onlyOver("chm", blob(68, 183, 36, 28, 9, .03, -22, 10), head(H, "", "line"))}
        ${head(H, "", "fill")}${tufts([[116.9, 76.9, 127.5, 69.7]])}
        ${ants([
          { b: [93, 55], c: [80, 32], o: [56, 31], r: 15.5, twig: [.5, [-2, 9], [-5, 4]] },
          { b: [76, 74], c: [60, 64], o: [34, 83], r: 15.5, twig: [.5, [0, 9], [-3, 5]] },
        ])}
        ${blush(120, 122, 13, 10, 21)}<path d="${blob(176, 97, 4, 6, 4, .1)}" fill="${C.blush}" opacity=".9" ${blur(1)}/>
        ${openEye({ x: 135, y: 101, side: 1, seed: 11 }, .92)}
        <g transform="rotate(-22 171 88)"><g class="blink"><path d="${blob(171, 88, 4.2, 10, 12, .05)}" fill="url(#${id}eyeG)"/>
          <ellipse cx="170.6" cy="84.2" rx="1.6" ry="2.9" fill="#fff"/></g></g>
        <path d="${blob(162, 103, 4.6, 5.8, 3, .08)}" fill="#8a3a4c"/><ellipse cx="162.5" cy="106" rx="3" ry="2" fill="#ff8fab"/>
        ${bpaw(165.6, 147.6, 7.2, 11.8, 20, 8)}${bpaw(157.6, 145, 7.2, 11.6, 13, 3)}
      </g>
      ${strokes([dash(14, 60, 6, -40), dash(8, 72, 5, 0), dash(28, 46, 5, -70), dash(14, 104, 5, 20)], "#f7d67a", 2.4, "glint")}`;
    },
  };

  return `<svg viewBox="-24 -4 282 282" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lumi, ${LABELS[mood]}">
    <defs>
      <filter id="${id}b1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".7"/></filter>
      <filter id="${id}b2" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="1.8"/></filter>
      <filter id="${id}b5" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
      <filter id="${id}b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${id}b7" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
      <linearGradient id="${id}veinL" gradientUnits="userSpaceOnUse" x1="70" y1="203.5" x2="36" y2="211.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".3"/><stop offset=".3" stop-color="#ece0f9"/><stop offset="1" stop-color="#d9c4f0"/></linearGradient>
      <linearGradient id="${id}veinR" gradientUnits="userSpaceOnUse" x1="168" y1="196" x2="201" y2="204.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".3"/><stop offset=".3" stop-color="#ece0f9"/><stop offset="1" stop-color="#d9c4f0"/></linearGradient>
      <linearGradient id="${id}blushLine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fbc4ce"/><stop offset="1" stop-color="#e7809a"/></linearGradient>
      <linearGradient id="${id}eyeG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1214"/><stop offset=".55" stop-color="${C.eye}"/></linearGradient>
      <linearGradient id="${id}line" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f6dbc2"/><stop offset=".55" stop-color="#f0c6a4"/><stop offset="1" stop-color="#e8b692"/></linearGradient>
      <radialGradient id="${id}furH" gradientUnits="userSpaceOnUse" cx="120" cy="110" r="86">
        <stop offset="0" stop-color="#fffaf3"/><stop offset=".75" stop-color="${C.fur}"/><stop offset="1" stop-color="#fbeedf"/></radialGradient>
      <radialGradient id="${id}furB" gradientUnits="userSpaceOnUse" cx="119" cy="190" r="62">
        <stop offset="0" stop-color="#fffcf7"/><stop offset=".75" stop-color="#fef9f1"/><stop offset="1" stop-color="#fcf0e4"/></radialGradient>
      <linearGradient id="${id}orbRim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe196"/><stop offset=".45" stop-color="#fdd477"/><stop offset="1" stop-color="#eda43e"/></linearGradient>
      <radialGradient id="${id}orb" cx=".38" cy=".34" r=".7">
        <stop offset="0" stop-color="#fff6dc"/><stop offset=".45" stop-color="#fee39c"/><stop offset=".82" stop-color="#fdcb62"/><stop offset="1" stop-color="#f2b450"/></radialGradient>
      <radialGradient id="${id}glass" cx=".5" cy=".5" r=".62">
        <stop offset="0" stop-color="#fffdf6"/><stop offset=".3" stop-color="#fff0b8"/><stop offset=".62" stop-color="#fedd87"/><stop offset=".88" stop-color="#e3b25a"/><stop offset="1" stop-color="#ae8847"/></radialGradient>
      <linearGradient id="${id}glassOff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3eadb"/><stop offset="1" stop-color="#e2d3b8"/></linearGradient>
      <linearGradient id="${id}frameG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#86603a"/><stop offset=".5" stop-color="${C.frame}"/><stop offset="1" stop-color="#583c22"/></linearGradient>
      <linearGradient id="${id}wingBlush" x1="0" y1="0" x2="0" y2="1">
        <stop offset=".5" stop-color="#f8b9ac" stop-opacity="0"/><stop offset="1" stop-color="#f8b9ac" stop-opacity=".5"/></linearGradient>
      <radialGradient id="${id}peachL" cx=".85" cy=".5" r=".95">
        <stop offset="0" stop-color="#fcebdc"/><stop offset=".5" stop-color="#f9dcc4"/><stop offset=".85" stop-color="#f7d6ba"/><stop offset="1" stop-color="#f1c8a6"/></radialGradient>
      <radialGradient id="${id}peachR" cx=".15" cy=".5" r=".95">
        <stop offset="0" stop-color="#fcefe2"/><stop offset=".5" stop-color="#fadec6"/><stop offset=".85" stop-color="#f7d8bd"/><stop offset="1" stop-color="#f1c8a6"/></radialGradient>
      <radialGradient id="${id}lilacL" cx=".3" cy=".55" r=".8">
        <stop offset="0" stop-color="#f1e4fb"/><stop offset=".6" stop-color="#e7cef6"/><stop offset="1" stop-color="#dcc0f1"/></radialGradient>
      <radialGradient id="${id}lilacR" cx=".7" cy=".55" r=".8">
        <stop offset="0" stop-color="#f1e4fb"/><stop offset=".6" stop-color="#e7cef6"/><stop offset="1" stop-color="#dcc0f1"/></radialGradient>
      <radialGradient id="${id}foot" cx=".4" cy=".3"><stop offset="0" stop-color="#94705a"/><stop offset="1" stop-color="#734f3d"/></radialGradient>
      <linearGradient id="${id}tear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3dcfb"/><stop offset="1" stop-color="#7fa9ee"/></linearGradient>
      <radialGradient id="${id}cookie" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#e6b679"/><stop offset=".7" stop-color="#d69c5e"/><stop offset="1" stop-color="#c88a4f"/></radialGradient>
      <radialGradient id="${id}heartG" cx=".62" cy=".32" r=".75"><stop offset="0" stop-color="#fdcbd0"/><stop offset=".55" stop-color="#f597a3"/><stop offset="1" stop-color="#ea7c8b"/></radialGradient>
      <radialGradient id="${id}fly" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="#ffefb0"/><stop offset="1" stop-color="#fde08a"/></radialGradient>
      <linearGradient id="${id}door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e7d2"/><stop offset="1" stop-color="#f9eddc" stop-opacity=".6"/></linearGradient>
    </defs>
    <rect x="-23.2" y="-3.2" width="280.4" height="280.4" rx="13" fill="${C.card}" stroke="${C.cardLine}" stroke-width="1.6"/>
    ${poses[mood]()}
    <text x="117" y="259" text-anchor="middle" font-family="Patrick Hand, Comic Sans MS, cursive" font-size="${mood === "chase" ? 26 : 28}" fill="${C.label}" stroke="${C.label}" stroke-width=".5" word-spacing="4">${LABELS[mood]}</text>
  </svg>`;
}
