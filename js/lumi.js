// Lumi, the baby moth: palette, drawing helpers and lumi(mood), which returns an SVG string.
// Copied unchanged from design/lumi-v2.html (the finished character art). Do not edit here; edit the design file and recopy.
// Palette sampled from the reference art (stalks and eyes deepened on request)
const C = {
  fur: "#fef7ed", line: "#f0c9a8", flick: "#efd0b4",
  stalk: "#4e3427", frame: "#6f4e2c",
  ring: "#fbf1f0", spot: "#c66d74", blush: "#f8b0bf",
  mouth: "#5e3b30", nose: "#4f3026",
  eye: "#080506", eyeTint: "#3f3134", eyeTintDark: "#22181a", sparkle: "#fbe3a4",
  gold: "#f6cf6a", tear: "#8fd0ff", heart: "#ee8196", shadow: "#faeadb",
};

const f1 = (n) => n.toFixed(1);

const star4 = (x, y, s, fill, extra = "") =>
  `<path d="M${x} ${y - s} Q${x + s * .2} ${y - s * .2} ${x + s} ${y} Q${x + s * .2} ${y + s * .2} ${x} ${y + s} Q${x - s * .2} ${y + s * .2} ${x - s} ${y} Q${x - s * .2} ${y - s * .2} ${x} ${y - s} Z" fill="${fill}" ${extra}/>`;

// Sparkle like the sticker sheet: a concave 4-point star, a little taller than wide, with softened tips
const sparkle = (x, y, w, h, fill, k = .27) =>
  `<path d="M${f1(x)} ${f1(y - h)} Q${f1(x + w * k)} ${f1(y - h * k)} ${f1(x + w)} ${f1(y)} Q${f1(x + w * k)} ${f1(y + h * k)} ${f1(x)} ${f1(y + h)} Q${f1(x - w * k)} ${f1(y + h * k)} ${f1(x - w)} ${f1(y)} Q${f1(x - w * k)} ${f1(y - h * k)} ${f1(x)} ${f1(y - h)} Z" fill="${fill}" stroke="${fill}" stroke-width=".8" stroke-linejoin="round"/>`;

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
// The notches sit on the ellipse; each scallop is an arc a little flatter than a semicircle.
// `pear` > 0 narrows the top and fills out the bottom; `flat` < 1 flattens the bottom (for sitting);
// `trim` = [angleDeg, amount, spreadDeg] pulls the outline in around one spot.
// `slant` leans each tuft downward like the reference: a shallow start from the upper notch,
// then a rounder drop that tucks back in at the lower notch (sides only, the crown stays even).
function scallop(cx, cy, rx, ry, n, seed, kR = .58, pear = 0, flat = 1, trim = null, slant = 0) {
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
    if (!slant) { d += ` A${f1(R)} ${f1(R)} 0 0 1 ${f1(q[0])} ${f1(q[1])}`; continue; }
    // same bump as the arc, drawn as a cubic so the two ends can lean differently
    const ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L, nx = uy, ny = -ux;
    const half = Math.asin(Math.min(1, L / 2 / R)), k = (4 / 3) * Math.tan(half / 2) * R;
    const s = slant * uy, D = .55;                       // + leans toward q, - toward p
    const a1 = half - s * D, a2 = half + s * D;
    const k1 = k * (1 - .12 * s), k2 = k * (1 + .12 * s);
    const c1 = [p[0] + k1 * (Math.cos(a1) * ux + Math.sin(a1) * nx), p[1] + k1 * (Math.cos(a1) * uy + Math.sin(a1) * ny)];
    const c2 = [q[0] + k2 * (-Math.cos(a2) * ux + Math.sin(a2) * nx), q[1] + k2 * (-Math.cos(a2) * uy + Math.sin(a2) * ny)];
    d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(q[0])} ${f1(q[1])}`;
  }
  return (attrs) => `<path d="${d}Z" stroke-linejoin="round" ${attrs}/>`;
}

// Fluff = outline on the outside of the union only + gradient fill + clipped shading.
// `line` can be a gradient so the outline warms up toward the bottom.
function fluff(shape, clipId, fill, shading = "", stroke = 4.4, line = C.line) {
  return `<clipPath id="${clipId}">${shape("")}</clipPath>
    ${shape(`fill="${line}" stroke="${line}" stroke-width="${stroke}"`)}
    ${shape(`fill="${fill}"`)}
    <g clip-path="url(#${clipId})">${shading}</g>`;
}

// Feet get a border that is lighter on the side facing the light and darker on the far side.
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

let uid = 0;
function lumi(mood = "curious") {
  const id = "l" + uid++;
  const droopy = mood === "sad";
  const lit = !["sad", "fed", "flop"].includes(mood);
  const blur = (n) => `filter="url(#${id}b${n})"`;
  const LINE = `url(#${id}line)`;
  // Blush: soft blurred pink with a crisp gradient border (lighter on top, deeper pink below)
  const blush = (x, y, rx, ry, seed, rot = 0) => {
    const d = blob(x, y, rx, ry, seed, .07, rot);
    return `<path d="${d}" fill="${C.blush}" opacity=".9" ${blur(1)}/>
      <path d="${d}" fill="none" stroke="url(#${id}blushLine)" stroke-width="1.5" opacity=".9"/>`;
  };

  // ---------- Wings: each one grows from a root at the centre of the back ----------
  // Upper (peach) wings: rounded ovals slanting down and outward; their inner ends tuck behind the head
  const upL = blob(57, 137, 58, 44, 31, .02, -28, 10);
  const upR = blob(184, 133, 56, 43, 33, .02, 28, 10);
  const loL = "M120 172 C100 168 78 172 60 178 C40 184 30 200 34 214 C38 230 58 236 74 228 C92 218 108 194 120 172 Z";
  const loR = "M120 170 C140 166 160 168 178 174 C198 180 208 194 204 208 C200 224 182 230 168 222 C150 212 132 192 120 170 Z";
  const wingsL = `<g class="wl">
    <path d="${upL}" fill="url(#${id}peachL)"/>
    <path d="${upL}" fill="url(#${id}wingBlush)"/>
    <path d="M58 139.5 Q21 143.5 6 150" transform="rotate(-11 27 144)" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
    <path d="${blob(27, 144, 14.2, 13.8, 2, .05)}" fill="${C.ring}"/>
    <path d="${blob(26.6, 144.6, 7.6, 7.2, 5, .06)}" fill="${C.spot}"/>
    <path d="${blob(43, 164, 2.8, 2.5, 8, .1)}" fill="#fff" opacity=".85"/>
    <path d="${loL}" fill="url(#${id}lilacL)"/>
    <path d="M70 203.5 Q47 206.5 36 211.5" transform="rotate(-11 50 207)" fill="none" stroke="url(#${id}veinL)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${blob(50, 207, 6.6, 6.2, 9, .07)}" fill="#fff"/></g>`;
  const wingsR = `<g class="wr">
    <path d="${upR}" fill="url(#${id}peachR)"/>
    <path d="${upR}" fill="url(#${id}wingBlush)"/>
    <path d="M182 135 Q219 138 233 145" transform="rotate(11 213 139)" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
    <path d="${blob(213, 139, 13.6, 13.2, 3, .05)}" fill="${C.ring}"/>
    <path d="${blob(213.4, 139.4, 7.3, 7, 7, .06)}" fill="${C.spot}"/>
    <path d="${blob(197, 159, 2.6, 2.3, 4, .1)}" fill="#fff" opacity=".85"/>
    <path d="${loR}" fill="url(#${id}lilacR)"/>
    <path d="M168 196 Q191.5 199.75 201 204.5" transform="rotate(11 188 200)" fill="none" stroke="url(#${id}veinR)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${blob(188, 200, 6.2, 5.8, 13, .07)}" fill="#fff"/></g>`;

  // ---------- Antennae: stalks run into the centre of each orb so they always connect ----------
  const ant = droopy
    ? [{ b: [101, 70], c: [83, 46.5], o: [61, 58.5], r: 14 },
       { b: [139, 66], c: [157, 42.5], o: [179, 54.5], r: 14 }]
    // twig: [where on the stalk, tip offset, bend offset]; the bend sits above the tip so the twig arches over and curves down
    : [{ b: [101, 70], c: [94.5, 42.5], o: [74.5, 26.5], r: 16, twig: [.42, [-12, 3], [-5.5, -4.2]], rays: [-172, 158, -128] },
       { b: [139, 66], c: [145.5, 40.5], o: [166.5, 21.5], r: 16, twig: [.42, [12, 2], [6.5, -4.6]], rays: [-60, -12, 32] }];
  // `halo` adds a soft glow behind the orb (used while sleeping, when the orbs are the night lights)
  const drawAnt = (a, w0 = 6.4, w1 = 4.9) => {
    let twig = "";
    if (a.twig) {
      const p = qpt(a.b, a.c, a.o, a.twig[0]);
      const end = [p[0] + a.twig[1][0], p[1] + a.twig[1][1]];
      twig = `<path d="${taper(p, [p[0] + a.twig[2][0], p[1] + a.twig[2][1]], end, 5.2, 3.2, 12)}" fill="${C.stalk}"/>
        <circle cx="${f1(end[0])}" cy="${f1(end[1])}" r="1.6" fill="${C.stalk}"/>`;
    }
    const [ox, oy] = a.o;
    const rays = (a.rays || []).map(deg => {
      const r = deg * Math.PI / 180;
      return `<line class="ray" x1="${f1(ox + Math.cos(r) * (a.r + 5))}" y1="${f1(oy + Math.sin(r) * (a.r + 5))}" x2="${f1(ox + Math.cos(r) * (a.r + 10))}" y2="${f1(oy + Math.sin(r) * (a.r + 10))}" stroke="#fcd96f" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`;
    }).join("");
    // The stalk is drawn over the head and ends on it with a rounded root
    const [bx, by] = a.b;
    return `${a.halo ? `<circle cx="${ox}" cy="${oy}" r="${a.r + 6}" fill="#ffe7a0" opacity=".45" ${blur(5)}/>` : ""}
      <path d="${taper(a.b, a.c, a.o, w0, w1)}" fill="${C.stalk}"/>
      <circle cx="${f1(bx)}" cy="${f1(by)}" r="${f1(w0 / 2)}" fill="${C.stalk}"/>${twig}
      <circle cx="${ox}" cy="${oy}" r="${a.r}" fill="url(#${id}orb)" stroke="url(#${id}orbRim)" stroke-width="2.7"/>
      <ellipse cx="${f1(ox - a.r * .3)}" cy="${f1(oy - a.r * .32)}" rx="${f1(a.r * .32)}" ry="${f1(a.r * .24)}" fill="#fffdf4" opacity=".85" ${blur(1)}/>
      ${rays}`;
  };
  const antenna = ant.map(a => drawAnt(a)).join("");

  // ---------- Fluff: big oval cloud head overlapping a smaller chubby body ----------
  // Body: pear-shaped, narrow under the head, flat-bottomed where it sits, lower-left bulge trimmed.
  // Head: classic scalloped cloud with the chin pulled in a little; the body's top hides behind it.
  const body = fluff(scallop(119, 196, 46, 34, 13, 7, .55, .22, .65, [152, .16, 28]), `${id}bc`, `url(#${id}furB)`, `
    <ellipse cx="119" cy="234" rx="54" ry="8" fill="#fbebdc" opacity=".55" ${blur(5)}/>`, 5.8, LINE);
  const head = `<g transform="rotate(${TILT} 120 123)">${fluff(scallop(120, 123, 71, 61.5, 16, 3, .55, 0, 1, [90, .07, 32]), `${id}hc`, `url(#${id}furH)`, `
    <ellipse cx="120" cy="189" rx="72" ry="14" fill="#f6e2cc" opacity=".45" ${blur(6)}/>`, 5.8, LINE)}</g>`;

  // ---------- Face parts (separate groups so moods can swap them) ----------
  // The eye is a hair lighter at the top so the shine's dark shadow line can read against it.
  // The brown glow behind the star has a darker band along its lower side: a dark copy sits
  // slightly lower, and the brown sits on top of it.
  const eyeBase = (e, s = 1, dy = 0) => {
    const rx = EYE_RX * s, ry = EYE_RY * s;
    // `rot` turns one eye's shape (and its brown glow) a little around the eye's centre
    return `<g transform="rotate(${e.rot || 0} ${e.x} ${e.y + dy})">
      <path d="${blob(e.x, e.y + dy, rx, ry, e.seed, .03, TILT, 10)}" fill="url(#${id}eyeG)"/>
      <path d="${blob(e.x + 1, e.y + dy + ry * .53, rx * .62, ry * .3, e.seed + 3, .08, TILT)}" fill="${C.eyeTintDark}"/>
      <path d="${blob(e.x + 1, e.y + dy + ry * .45, rx * .62, ry * .3, e.seed + 3, .08, TILT)}" fill="${C.eyeTint}"/></g>`;
  };
  // White shine with a thin crisp shadow line on its lower-right edge (a slightly larger copy nudged
  // down-right), a little darker than the eye around it
  const hl = (e, s = 1, dy = 0) => {
    const x = e.x + 3.2 * s, y = e.y + dy - 7.2 * s;
    return `<path d="${blob(x + .5 * s, y + .6 * s, 5.8 * s, 5.5 * s, e.seed + 1, .06)}" fill="#000"/>
      <path d="${blob(x, y, 5.2 * s, 4.9 * s, e.seed + 1, .06)}" fill="#fff"/>`;
  };
  // Eye star like the reference: a tall oval crossed by a slightly shorter one, with a small round
  // centre that softens the inner corners; tilted a little more than the head.
  // Border: the shapes are stroked first and filled on top, so only the outer edge shows;
  // it runs from a deeper gold on the left to a bright cream on the right.
  const ovalStar = (x, y, s, fill) => {
    const shapes = (attrs) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(1.9 * s)}" ry="${f1(5 * s)}" ${attrs}/>
      <ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(4.6 * s)}" ry="${f1(1.8 * s)}" ${attrs}/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2.1 * s)}" ${attrs}/>`;
    return `<g transform="rotate(${TILT - 3} ${f1(x)} ${f1(y)})">
      ${shapes(`fill="url(#${id}starLine)" stroke="url(#${id}starLine)" stroke-width="${f1(1.3 * s)}"`)}
      ${shapes(`fill="${fill}"`)}</g>`;
  };
  const sparkleAt = (e) => ovalStar(e.x + (e.side < 0 ? -5 : 6.5), e.y + (e.side < 0 ? 7.5 : 6.5), .78, C.sparkle);
  const openEye = (e) => `<g class="pupil"><g class="blink">${eyeBase(e)}${hl(e)}${sparkleAt(e)}</g></g>`;
  const arc = (e, up) => {
    const a = up ? `M${e.x - 12} ${e.y + 4} Q${e.x} ${e.y - 11} ${e.x + 12} ${e.y + 4}` : `M${e.x - 12} ${e.y - 1} Q${e.x} ${e.y + 10} ${e.x + 12} ${e.y - 1}`;
    return `<path d="${a}" fill="none" stroke="${C.nose}" stroke-width="${up ? 4 : 3.6}" stroke-linecap="round" transform="rotate(${TILT + (e.rot || 0)} ${e.x} ${e.y})"/>`;
  };
  // Starry eyes (sticker sheet "starry"): glossy black inside a thin white rim, a big gold sparkle a
  // little toward the nose, a small one low on the outer side, a white glint above and two faint specks
  const starEye = (e) => {
    const s = e.side, x = e.x, y = e.y;
    return `<g transform="rotate(${e.rot || 0} ${x} ${y})">
      <path d="${blob(x, y, EYE_RX + 1.5, EYE_RY + 1.5, e.seed, .03, TILT, 10)}" fill="#fff"/>
      <path d="${blob(x, y, EYE_RX, EYE_RY, e.seed, .03, TILT, 10)}" fill="url(#${id}eyeG)"/>
      <circle cx="${f1(x - s * 1.5)}" cy="${f1(y + 11.5)}" r="2.3" fill="#3b2e3e" opacity=".85"/>
      <circle cx="${f1(x - s * 7.5)}" cy="${f1(y + 7)}" r="1.1" fill="#5b4b57"/>
      <circle cx="${f1(x + s * 6)}" cy="${f1(y - 9.5)}" r=".9" fill="#5b4b57"/>
      <g transform="rotate(${TILT} ${x} ${y})">
        ${sparkle(x - s * 2.1, y - 1, 8.4, 9.6, "#fcde88")}
        ${sparkle(x + s * 7.6, y + 7.2, 3.5, 3.9, "#f9d48c")}</g>
      <path d="${blob(x - s * 7.7, y - 8.7, 2.6, 2.4, e.seed + 2, .08)}" fill="#fff"/></g>`;
  };
  const sadEye = (e) => `<g class="pupil">${eyeBase(e, .92, 2)}${hl(e, .92, 2)}</g>`;

  const eyes = {
    curious: openEye(EYE_L) + openEye(EYE_R),
    happy: arc(EYE_L, true) + arc(EYE_R, true),
    wink: openEye(EYE_L) + arc(EYE_R, true),
    starry: starEye(EYE_L) + starEye(EYE_R),
    fed: arc(EYE_L, true) + arc(EYE_R, true),
    sad: sadEye(EYE_L) + sadEye(EYE_R),
  }[mood] || "";
  // Two soft fur marks above the eyes, like little brows
  const furBrows = mood === "sad" ? "" : `<g fill="none" stroke="${C.flick}" stroke-width="2.2" stroke-linecap="round" opacity=".9">
    <path d="M84 103 q6 -4 13 -3.5"/><path d="M141 98 q7 -3.5 13 -2" transform="rotate(-4 147.5 96.5)"/></g>`;
  const brows = mood === "sad"
    ? `<path d="M81 105 Q89 99 100 99 M161 99 Q152 94 141 96" fill="none" stroke="${C.nose}" stroke-width="2.6" stroke-linecap="round"/>` : "";
  const tears = mood === "sad"
    ? `<path d="M82 142 Q78 150 82 154 Q86 150 82 142 Z M160 137 Q156 145 160 149 Q164 145 160 137 Z" fill="${C.tear}"/>` : "";
  // Mouths are drawn around (120,144) and moved under the nose, following the head tilt
  const mouthShape = {
    curious: `<path d="M114.6 144.2 Q120.2 149.8 125.9 144.7" fill="none" stroke="${C.mouth}" stroke-width="2.5" stroke-linecap="round"/>`,
    happy: `<path d="M113.5 143 Q120 154 126.5 143 Z" fill="#8a3a4c"/><ellipse cx="120" cy="149.3" rx="3.3" ry="1.8" fill="#ff8fab"/>`,
    wink: `<path d="M114 143 Q120 152 126 143 Z" fill="#8a3a4c"/>`,
    // a small round "oh!" with a pink tongue at the bottom (no nose, like the sticker)
    starry: `<path d="M120 141.2 C123.6 141.2 125.9 145 125.9 147.6 C125.9 150.6 123.3 152 120 152 C116.7 152 114.1 150.6 114.1 147.6 C114.1 145 116.4 141.2 120 141.2 Z" fill="#76222d"/>
      <path d="M116 148.4 Q120 145 124 148.4 Q123.6 150.9 120 151 Q116.4 150.9 116 148.4 Z" fill="#d47083"/>`,
    fed: `<path d="M113.5 143 Q120 154 126.5 143 Z" fill="#8a3a4c"/><circle cx="130" cy="151" r="1.8" fill="#c98b4e"/>`,
    sad: `<path d="M115.5 148 Q120 143.5 124.5 148" fill="none" stroke="${C.mouth}" stroke-width="2.2" stroke-linecap="round"/>`,
  }[mood] || "";
  const shiny = mood === "starry";
  const face = `
    ${furBrows}
    <g class="blush" data-part="blush">
      ${shiny ? blush(77, 145, 12.6, 10.6, 21, -13) + blush(166, 139, 12.6, 10.6, 23, 10)
        : blush(79, 143, 11, 8.5, 21, -13) + blush(164, 137, 11, 8.5, 23, 10)}</g>
    <g class="eyes" data-part="eyes">${eyes}</g>
    <g class="brows" data-part="brows">${brows}</g>
    <g class="tears" data-part="tears">${tears}</g>
    <g class="nose" data-part="nose">${shiny ? "" : `<path d="${blob(121.3, 129.5, 2.5, 1.9, 6, .1, TILT)}" fill="${C.nose}"/>`}</g>
    <g class="mouth" data-part="mouth"><g transform="translate(1.6 -9.5) rotate(${TILT} 120 146)">${mouthShape}</g></g>`;

  // ---------- Lantern / cookie (lower-right front) + small fluffy paws ----------
  // Lantern: a rounded square of glowing glass with a brown border, an arched handle on top,
  // and a separate shorter line underneath for the base with a crisp darker shadow below it; tilted a little
  const lantern = `<g transform="rotate(-6 120 199)">
    <path d="M112 183.5 C110.5 166 129.5 166 128 183.5" fill="none" stroke="${C.frame}" stroke-width="3.6" stroke-linecap="round"/>
    <rect x="105" y="183" width="30" height="30" rx="7" fill="url(#${id}${lit ? "glass" : "glassOff"})" stroke="url(#${id}frameG)" stroke-width="3.4"/>
    ${star5(120, 198, 7.2, 3.2, lit ? "#ffffff" : "#f6efe0")}
    <path d="M109.5 216.8 Q120 219.6 130.5 216.8" fill="none" stroke="#45301e" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M109.5 215.9 L130.5 215.9" stroke="${C.frame}" stroke-width="3.4" stroke-linecap="round"/></g>`;
  const cookie = `
    <path d="${blob(120, 198, 15, 14.5, 13, .05)}" fill="#d9a066" stroke="#c08a55" stroke-width="2"/>
    <path d="M130 187 Q137 192 135 200 Q129 196 130 187 Z" fill="#fef7ed"/>
    <circle cx="114" cy="193" r="2.6" fill="${C.nose}"/><circle cx="124" cy="196" r="2.6" fill="${C.nose}"/><circle cx="117" cy="204" r="2.6" fill="${C.nose}"/>`;
  // Small round paws (almost circles, never exact) holding the lantern's upper sides
  // The paw border turns warm gold on the side touching the lantern, as if lit by it
  // (`light` = where the lantern is; null gives a plain fur line)
  const paw = (x, y, deg, seed, rx = 8.5, ry = 7.6, light = [130, 191], stroke = 5.8) => {
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
        `${id}paw${seed}`, C.fur, `<ellipse cx="${x}" cy="${f1(y + ry * .76)}" rx="${f1(rx * .94)}" ry="${f1(ry * .45)}" fill="#f6e4d2" opacity=".7" ${blur(1)}/>`, stroke, line)}`;
  };
  // Shiny: no lantern, both paws held up together under the chin (sticker sheet "starry").
  // Like the sticker, each paw is a faint arc over its top that firms up down its inner side. Behind
  // them, a soft-edged patch repaints the head and body fur without the chin line, so the paws melt
  // into the fluff and the chin line fades out under them.
  const chest = "M86 192 L86.4 172 C86.6 160 94 155 102.4 155.2 C110 155.4 113.6 160 113.6 163 L134.6 160 C135.5 154 140 150.2 147.5 150.1 C153 150 159.5 153 161.5 160 C163 167 162 175 157 183 L152 193 L90 194 Z";
  const raised = `
    <mask id="${id}rpm" maskUnits="userSpaceOnUse" x="60" y="130" width="130" height="80"><path d="${chest}" fill="#fff" ${blur(2)}/></mask>
    <g mask="url(#${id}rpm)">
      <path d="${chest}" fill="url(#${id}furB)"/>
      <g transform="rotate(${TILT} 120 123)" clip-path="url(#${id}hc)">
        <rect x="60" y="130" width="130" height="70" fill="url(#${id}furH)"/>
        <ellipse cx="120" cy="189" rx="72" ry="14" fill="#f6e2cc" opacity=".45" ${blur(6)}/></g>
      <ellipse cx="124" cy="179" rx="12" ry="10" fill="#f6e2cc" opacity=".45" ${blur(5)}/></g>
    <linearGradient id="${id}pawArc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f9e4d0"/><stop offset=".4" stop-color="#f0c6a4"/><stop offset="1" stop-color="#e9b892"/></linearGradient>
    <g fill="none" stroke="url(#${id}pawArc)" stroke-width="2.9" stroke-linecap="round">
      <path d="M88.6 161 C91 156.6 96 155.2 102.4 155.4 C110 155.6 113.6 160 113.4 167 C113.2 174 111 181 106.5 186"/>
      <path d="M158.8 156 C156 151.6 151.5 150.2 147.5 150.3 C140 150.5 135 155 134.4 163 C133.9 170 137 177 142 182.5"/></g>`;
  const holding = shiny ? raised : `
    ${lit ? `<path d="${blob(130, 187, 32, 30, 14, .05)}" fill="#ffe8a0" opacity=".55" ${blur(7)}/>` : ""}
    <g transform="translate(130 154) scale(1.24) translate(-120 -169)">${mood === "fed" ? cookie : lantern}</g>
    ${paw(111, 183, -20, 41)}${paw(149, 180, 20, 47)}`;

  // ---------- Background decor + mood extras ----------
  const decor = `<g class="decor" opacity=".85">
    ${star4(22, 44, 5, C.gold)}${star4(222, 62, 4, C.gold)}${star4(228, 200, 5, C.gold)}${star4(12, 214, 4, C.gold)}
    <circle cx="44" cy="70" r="1.6" fill="${C.gold}"/><circle cx="214" cy="226" r="1.5" fill="${C.gold}"/><circle cx="30" cy="236" r="1.4" fill="${C.gold}"/>
    ${heart(200, 66, .8, `fill="none" stroke="${C.heart}" stroke-width="2"`, 14)}
    ${heart(222, 240, .6, `fill="none" stroke="${C.heart}" stroke-width="2.2"`, -12)}</g>`;
  const extras = {
    starry: sparkle(28, 62, 7, 9.5, C.gold) + sparkle(222, 84, 6.2, 8, C.gold) + star4(232, 176, 5, C.gold),
    happy: heart(206, 46, 1, `fill="${C.heart}"`, 12),
    fed: heart(206, 46, 1, `fill="${C.heart}"`, 12),
    // three soft lilac z's drifting up and to the right, growing as they go
    sleepy: `<g class="zz" font-family="Fredoka, sans-serif" font-weight="600" fill="#bba7ea">
      <text x="162" y="102" font-size="15" transform="rotate(-8 167 97)">z</text>
      <text x="179" y="86" font-size="19" transform="rotate(-8 185 80)">Z</text>
      <text x="199" y="68" font-size="23" transform="rotate(-8 206 61)">Z</text></g>`,
  }[mood] || "";
  const sleepDecor = `<g class="decor" opacity=".85">
    ${star4(20, 88, 6, C.gold)}<circle cx="40" cy="64" r="1.6" fill="${C.gold}"/><circle cx="12" cy="120" r="1.4" fill="${C.gold}"/></g>`;

  // Soft ground shadow just under the feet; it stays put while Lumi bobs
  const ground = `<ellipse cx="119" cy="240" rx="80" ry="6.6" fill="${C.shadow}" ${blur(2)}/>`;
  const sitting = `
    ${wingsL}${wingsR}
    ${body}
    ${head}
    ${antenna}
    ${face}
    ${foot(82, 223, 6.7, 10.3, -44, id, 2)}
    ${foot(157, 222, 7, 10.8, 44, id, 5)}
    ${holding}`;

  // ---------- Flop: belly down, feet in the air, X eyes ----------
  const flop = `
    <ellipse cx="120" cy="241" rx="90" ry="6.4" fill="${C.shadow}" ${blur(2)}/>
    <path d="${blob(150, 172, 46, 40, 4, .03, -12)}" fill="url(#${id}peachL)"/>
    <path d="${blob(176, 160, 11, 10.4, 2, .05)}" fill="${C.ring}"/><path d="${blob(176.4, 160.4, 6, 5.6, 5, .06)}" fill="${C.spot}"/>
    <path d="${blob(80, 196, 36, 24, 6, .04, -8)}" fill="url(#${id}lilacL)"/>
    <path d="${blob(64, 194, 6.5, 6, 9, .07)}" fill="#fff"/>
    ${foot(44, 196, 6.5, 10, -58, id, 2, [90, 130])}
    ${foot(62, 184, 6.5, 10, -28, id, 5, [90, 130])}
    ${fluff(scallop(96, 216, 37, 14, 9, 11, .55), `${id}fb`, `url(#${id}furB)`, "", 5, LINE)}
    ${fluff(scallop(152, 198, 39, 31, 11, 5, .55), `${id}fh`, `url(#${id}furH)`, "", 5, LINE)}
    <path d="${taper([166, 170], [188, 158], [204, 175], 6, 4.7)}" fill="${C.stalk}"/>
    <path d="${taper([150, 166], [158, 144], [182, 136], 6, 4.7)}" fill="${C.stalk}"/>
    <circle cx="166" cy="170" r="3" fill="${C.stalk}"/><circle cx="150" cy="166" r="3" fill="${C.stalk}"/>
    <circle cx="204" cy="175" r="11" fill="url(#${id}orb)" stroke="url(#${id}orbRim)" stroke-width="2.4"/><circle cx="182" cy="136" r="11" fill="url(#${id}orb)" stroke="url(#${id}orbRim)" stroke-width="2.4"/>
    ${blush(126, 214, 8, 6, 21)}${blush(178, 214, 8, 6, 23)}
    <path d="M131 191 L143 203 M143 191 L131 203 M161 191 L173 203 M173 191 L161 203" stroke="${C.eye}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M146 212 L158 212" stroke="${C.mouth}" stroke-width="2" stroke-linecap="round"/>
    <path d="M151 212 Q151 222 155 222 Q159 222 158 212 Z" fill="#ff8fab"/>
    ${star4(116, 150, 6, C.gold)}${star4(134, 136, 4, C.gold)}${star4(100, 140, 3.5, C.gold)}`;

  // ---------- Sleepy: curled up asleep, head resting on its paws, tilted onto one side (lumi.exe v7) ----------
  // The head is the same cloud as the sitting pose, drawn in its own coordinates and then set down:
  // shrunk a little and tilted so it rests on the paws. toW() maps head coordinates into the scene.
  const SH = { x: 131, y: 181, rot: 22, s: .86 };
  // One outline width for head, body and paws: the head's 5.8 after it is shrunk into the scene
  const SW = f1(5.8 * SH.s);
  const toW = (x, y) => {
    const a = SH.rot * Math.PI / 180, dx = (x - 120) * SH.s, dy = (y - 123) * SH.s;
    return [SH.x + dx * Math.cos(a) - dy * Math.sin(a), SH.y + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  // Closed eyes: thick dark crescents (‿) with rounded ends, outer ends tipped up a little
  const sleepEye = (x, y, rot) => `<path d="M${x - 13} ${y - 2} Q${x} ${y + 12.5} ${x + 13} ${y - 2} Q${x} ${y + 4.5} ${x - 13} ${y - 2} Z" fill="${C.eye}" stroke="${C.eye}" stroke-width="2.6" stroke-linejoin="round" transform="rotate(${rot} ${x} ${y})"/>`;
  // Blush with three tiny darker strokes
  const hatch = (x, y) => [-4.5, 0, 4.5].map(k => `<path d="M${f1(x + k - 1.2)} ${f1(y + 2)} L${f1(x + k + 1.2)} ${f1(y - 2)}"/>`).join("");
  const sleepHead = `<g transform="translate(${SH.x} ${SH.y}) rotate(${SH.rot}) scale(${SH.s}) translate(-120 -123)">
    ${fluff(scallop(120, 123, 71, 61.5, 16, 3, .55, 0, 1, [90, .07, 32]), `${id}shc`, `url(#${id}furH)`, `
      <ellipse cx="120" cy="189" rx="72" ry="14" fill="#f6e2cc" opacity=".45" ${blur(6)}/>`, 5.8, LINE)}
    ${blush(72, 160, 12.5, 9.5, 21, -8)}${blush(168, 160, 12.5, 9.5, 23, 8)}
    <g stroke="#f0a3b4" stroke-width="1.4" stroke-linecap="round" opacity=".7">${hatch(72, 160)}${hatch(168, 160)}</g>
    ${sleepEye(88, 144, 7)}${sleepEye(152, 144, -7)}
    <path d="M112.5 160.5 Q113.5 165.5 116.5 164.5 Q119 163.5 120 161 Q121 163.5 123.5 164.5 Q126.5 165.5 127.5 160.5" fill="none" stroke="${C.mouth}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  // One antenna stands up with its twig, the other flops over to the right; both orbs keep glowing
  const sleepAnt = [
    { b: toW(101, 70), c: [133, 110], o: [138, 90], r: 14.5, twig: [.45, [-10, 3], [-5, -3.5]], rays: [-143, -117, -92], halo: 1 },
    { b: toW(139, 66), c: [183, 121], o: [206, 141], r: 14.5, twig: [.4, [4, 8], [5, 3]], rays: [-62, -38, -14], halo: 1 },
  ].map(a => drawAnt(a, 5.8, 4.4)).join("");
  const sleep = `
    <ellipse cx="125" cy="240" rx="110" ry="6.4" fill="${C.shadow}" ${blur(2)}/>
    <path d="${blob(44, 212, 36, 34, 14, .05)}" fill="#ffe8a0" opacity=".6" ${blur(7)}/>
    <ellipse cx="44" cy="241" rx="34" ry="5" fill="#fde7a8" opacity=".8" ${blur(2)}/>
    <g class="breathe">
      <path d="${blob(60, 134, 52, 42, 31, .02, -22, 10)}" fill="url(#${id}peachL)"/>
      <path d="${blob(60, 134, 52, 42, 31, .02, -22, 10)}" fill="url(#${id}wingBlush)"/>
      <path d="${blob(55, 123, 14, 13.6, 2, .05)}" fill="${C.ring}"/>
      <path d="${blob(54.6, 123.6, 7.5, 7.1, 5, .06)}" fill="${C.spot}"/>
      <path d="${blob(35, 151, 2.8, 2.5, 8, .1)}" fill="#fff" opacity=".85"/>
      <path d="${blob(67, 197, 36, 18, 9, .03, -58)}" fill="url(#${id}lilacL)"/>
      <path d="${blob(62, 185, 4.2, 4, 9, .07)}" fill="#fff"/>
      <path d="${blob(203, 176, 40, 60, 33, .02, 12, 10)}" fill="url(#${id}peachR)"/>
      <path d="${blob(203, 176, 40, 60, 33, .02, 12, 10)}" fill="url(#${id}wingBlush)"/>
      <path d="${blob(218, 186, 13.4, 13, 3, .05)}" fill="${C.ring}"/>
      <path d="${blob(218.4, 186.4, 7.2, 6.9, 7, .06)}" fill="${C.spot}"/>
      <path d="${blob(221, 215, 2.6, 2.3, 4, .1)}" fill="#fff" opacity=".85"/>
      <path d="${blob(204, 227, 16, 12, 13, .04, -10)}" fill="url(#${id}lilacR)"/>
      ${fluff(scallop(172, 207, 29, 30, 10, 7, .55, 0, .7), `${id}sbc`, `url(#${id}furB)`, `
        <ellipse cx="172" cy="236" rx="34" ry="8" fill="#fbebdc" opacity=".55" ${blur(5)}/>`, SW, LINE)}
      ${sleepHead}
      ${sleepAnt}
      ${paw(93, 229, 6, 51, 17.5, 10.5, [44, 212], SW)}
      ${paw(139, 231, 10, 53, 16, 10, null, SW)}
    </g>
    <g transform="translate(44 214) scale(1.4) translate(-120 -198) rotate(6 120 199)">${lantern}</g>`;

  return `<svg viewBox="0 -8 240 252" overflow="visible" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="${id}b1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".7"/></filter>
      <filter id="${id}b2" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="1.8"/></filter>
      <filter id="${id}b5" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
      <filter id="${id}b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${id}b7" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
      <!-- lilac wing veins: white near the body fading to a deeper lilac at the tip -->
      <linearGradient id="${id}veinL" gradientUnits="userSpaceOnUse" x1="70" y1="203.5" x2="36" y2="211.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".3"/><stop offset=".3" stop-color="#ece0f9"/><stop offset="1" stop-color="#d9c4f0"/></linearGradient>
      <linearGradient id="${id}veinR" gradientUnits="userSpaceOnUse" x1="168" y1="196" x2="201" y2="204.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".3"/><stop offset=".3" stop-color="#ece0f9"/><stop offset="1" stop-color="#d9c4f0"/></linearGradient>
      <linearGradient id="${id}blushLine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fbc4ce"/><stop offset="1" stop-color="#e7809a"/></linearGradient>
      <linearGradient id="${id}starLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#c9963f"/><stop offset=".5" stop-color="#e8c272"/><stop offset="1" stop-color="#fff6dc"/></linearGradient>
      <linearGradient id="${id}eyeG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a1214"/><stop offset=".55" stop-color="${C.eye}"/></linearGradient>
      <linearGradient id="${id}line" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f6dbc2"/><stop offset=".55" stop-color="#f0c6a4"/><stop offset="1" stop-color="#e8b692"/></linearGradient>
      <radialGradient id="${id}furH" gradientUnits="userSpaceOnUse" cx="120" cy="110" r="86">
        <stop offset="0" stop-color="#fffaf3"/><stop offset=".75" stop-color="${C.fur}"/><stop offset="1" stop-color="#fbeedf"/></radialGradient>
      <radialGradient id="${id}furB" gradientUnits="userSpaceOnUse" cx="119" cy="190" r="62">
        <stop offset="0" stop-color="#fffcf7"/><stop offset=".75" stop-color="#fef9f1"/><stop offset="1" stop-color="#fcf0e4"/></radialGradient>
      <!-- orb rim: a thin, gentle gold edge, a touch warmer at the bottom -->
      <linearGradient id="${id}orbRim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe196"/><stop offset=".45" stop-color="#fdd477"/><stop offset="1" stop-color="#eda43e"/></linearGradient>
      <radialGradient id="${id}orb" cx=".38" cy=".34" r=".7">
        <stop offset="0" stop-color="#fff6dc"/><stop offset=".45" stop-color="#fee39c"/><stop offset=".82" stop-color="#fdcb62"/><stop offset="1" stop-color="#f2b450"/></radialGradient>
      <radialGradient id="${id}glass" cx=".5" cy=".5" r=".62">
        <stop offset="0" stop-color="#fffdf6"/><stop offset=".3" stop-color="#fff0b8"/><stop offset=".62" stop-color="#fedd87"/><stop offset=".88" stop-color="#e3b25a"/><stop offset="1" stop-color="#ae8847"/></radialGradient>
      <linearGradient id="${id}glassOff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3eadb"/><stop offset="1" stop-color="#e2d3b8"/></linearGradient>
      <linearGradient id="${id}frameG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#86603a"/><stop offset=".5" stop-color="${C.frame}"/><stop offset="1" stop-color="#583c22"/></linearGradient>
      <linearGradient id="${id}cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6438"/><stop offset="1" stop-color="${C.frame}"/></linearGradient>
      <!-- soft pink blush along the bottom of the peach wings, fading out by the middle -->
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
    </defs>
    ${mood === "sleepy" ? sleepDecor : decor}
    ${extras}
    ${mood === "flop" ? flop : mood === "sleepy" ? sleep : `${ground}<g class="bob">${sitting}</g>`}
  </svg>`;
}
