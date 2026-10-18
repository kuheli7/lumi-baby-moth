// Lumi's Attic 2: the same attic as a little diorama. The room is cut into flat layers at different depths;
// tilting the whole stage makes the near layers slide over the far ones. The lantern attic stays as it is.
(() => {
  "use strict";
  const { $, $$, sfx, store, restart, reduceMotion } = app;

  const VB_W = 600, VB_H = 520, PERSPECTIVE = 900;
  const star = (cx, cy, r, fill = "#f6cf6a", stroke = "#d9a93a") => {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * .45 : r;
      p.push((cx + Math.cos(a) * d).toFixed(1) + " " + (cy + Math.sin(a) * d).toFixed(1));
    }
    return `<path d="M${p.join("L")}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"/>`;
  };
  const leaf = (x, y, rot, s = 1) =>
    `<ellipse cx="0" cy="-9" rx="6" ry="11" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="#5f8a5a" stroke="#3f6a40" stroke-width="1.4"/>`;
  const svg = (inner) => `<svg style="overflow:visible" viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${inner}</svg>`;
  const glint = (list) => list.map(([x, y, r]) => star(x, y, r, "#fde9a6", "#fde9a6")).join("");

  // ---------- the layers, far to near ----------
  const wall = svg(`
    <defs>
      <linearGradient id="a2-wall" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="520"><stop offset="0" stop-color="#2d2250"/><stop offset=".55" stop-color="#5a3f55"/><stop offset="1" stop-color="#7a5348"/></linearGradient>
      <linearGradient id="a2-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1850"/><stop offset="1" stop-color="#3f3086"/></linearGradient>
      <radialGradient id="a2-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".85"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
      <radialGradient id="a2-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf86" stop-opacity=".32"/><stop offset=".6" stop-color="#ffb07a" stop-opacity=".1"/><stop offset="1" stop-color="#ffb07a" stop-opacity="0"/></radialGradient>
      <linearGradient id="a2-shadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0c24" stop-opacity=".45"/><stop offset="1" stop-color="#1a0c24" stop-opacity="0"/></linearGradient>
      <radialGradient id="a2-vig" cx=".5" cy=".46" r=".62"><stop offset=".62" stop-color="#140a26" stop-opacity="0"/><stop offset="1" stop-color="#140a26" stop-opacity=".55"/></radialGradient>
    </defs>
    <rect x="-140" y="-140" width="880" height="800" fill="url(#a2-wall)"/>
    <g stroke="#2a1830" stroke-opacity=".28" stroke-width="2">${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 55 + 20} 0V440"/>`).join("")}</g>
    <path d="M-140 448H740V660H-140Z" fill="#5b3b3f"/>
    <rect x="-140" y="434" width="880" height="14" fill="#6b4528"/><path d="M-140 434H740" stroke="#8a5a32" stroke-width="3"/>
    <path d="M0 0H255L0 200Z" fill="#7a5538" stroke="#4a3020" stroke-width="3"/>
    <path d="M600 0H345L600 185Z" fill="#7a5538" stroke="#4a3020" stroke-width="3"/>
    <rect width="600" height="26" fill="#6b4528" stroke="#4a3020" stroke-width="3"/>
    <circle cx="380" cy="150" r="260" fill="url(#a2-warm)"/>
    <circle class="a2-pulse" cx="449" cy="150" r="64" fill="url(#a2-lamp)" opacity=".45"/><!-- the warm spill of the star lamp and the fairy lights -->
    <rect x="44" y="118" width="212" height="216" rx="6" fill="#7a5538" stroke="#4a3020" stroke-width="3"/>
    <rect x="58" y="132" width="184" height="188" fill="url(#a2-sky)"/>
    <path d="M170 160a32 32 0 1 0 22 54a26 26 0 1 1 -22 -54Z" fill="#fde9a6" stroke="#e8c76a" stroke-width="2"/>
    <g class="a2-twinkle">${glint([[92, 168, 7], [104, 262, 6], [212, 276, 5], [222, 184, 4]])}</g>
    <path d="M150 132V320M58 226H242" stroke="#7a5538" stroke-width="9"/>
    `);

  // one curtain, gathered on the rod, tied with a ribbon and frilled at the hem; the right one is its mirror image
  const lace = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8, u = 1 - t;
    return `<circle cx="${(u * u * 4 + 2 * t * u * 37 + t * t * 70).toFixed(1)}" cy="${(u * u * 344 + 2 * t * u * 356 + t * t * 344 + 1).toFixed(1)}" r="4.6"/>`;
  }).join("");
  const drape = `
    <g fill="#f1eaff" stroke="#b9a6e6" stroke-width="1.4">${lace}</g>
    <path d="M8 104H74C72 150 56 196 42 230C60 268 72 308 70 344Q37 356 4 344C0 300 6 262 24 230C14 190 6 150 8 104Z" fill="url(#a2-drape)" stroke="#6f58ae" stroke-width="2.5" stroke-linejoin="round"/>
    <g fill="none" stroke="#6f58ae" stroke-width="2.2" stroke-linecap="round" opacity=".45">
      <path d="M28 108C28 150 31 196 32 226M50 108C48 150 41 196 35 226M66 108C62 142 54 182 40 224M32 238C26 280 18 316 15 344M35 238C43 280 52 316 55 348M33 238C34 280 34 316 35 350"/></g>
    <g fill="none" stroke="#e2d8fb" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M17 110C17 150 22 196 28 226M27 242C19 280 11 316 10 342M58 110C56 140 50 180 39 218"/></g>
    <g opacity=".75">${star(20, 160, 3, "#fff6dc", "#fff6dc")}${star(48, 136, 2.6, "#fff6dc", "#fff6dc")}${star(36, 190, 2.4, "#fff6dc", "#fff6dc")}${star(22, 300, 3, "#fff6dc", "#fff6dc")}${star(50, 290, 2.6, "#fff6dc", "#fff6dc")}${star(38, 326, 2.4, "#fff6dc", "#fff6dc")}</g>
    <g stroke="#47297e" stroke-width="1.6" stroke-linejoin="round">
      <path d="M31 233L25 250L30 247L33 252ZM35 233L41 250L36 247L33 252Z" fill="#6c3fb8"/>
      <path d="M21 226Q33 222 45 226L44 237Q33 233 22 237Z" fill="#7e52cc"/>
      <path d="M33 231C24 219 13 223 17 233C21 241 29 237 33 231ZM33 231C42 219 53 223 49 233C45 241 37 237 33 231Z" fill="#9468de"/>
      <path d="M31 229C26 224 20 225 21 230M35 229C40 224 46 225 45 230" fill="none" stroke="#d9c6fb" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
      <circle cx="33" cy="231" r="3.6" fill="#6c3fb8"/></g>
    <g fill="#e8c76a" stroke="#a8823a" stroke-width="1.3">${[12, 25, 38, 51, 64].map(x => `<circle cx="${x}" cy="103" r="4" fill="none" stroke-width="2"/>`).join("")}</g>`;
  const curtains = svg(`
    <defs><linearGradient id="a2-drape" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f76cf"/><stop offset=".22" stop-color="#b29ced"/><stop offset=".45" stop-color="#9a82d6"/><stop offset=".7" stop-color="#b8a4ef"/><stop offset="1" stop-color="#8a70c8"/></linearGradient></defs>
    <rect x="6" y="98" width="288" height="7" rx="3.5" fill="#c9965a" stroke="#7a5034" stroke-width="2"/>
    ${drape}<g transform="translate(300 0) scale(-1 1)">${drape}</g>
    <circle cx="6" cy="101.5" r="7" fill="#e8c76a" stroke="#a8823a" stroke-width="2"/><circle cx="294" cy="101.5" r="7" fill="#e8c76a" stroke="#a8823a" stroke-width="2"/>`);

  const shelf = svg(`
    <g transform="rotate(-7 300 109)"><rect x="258" y="78" width="84" height="62" fill="#f4e4cc" stroke="#c9a67a" stroke-width="2"/>
      <g id="a2-planet"><ellipse cx="300" cy="109" rx="20" ry="7.5" fill="none" stroke="#9a82d6" stroke-width="3" transform="rotate(-20 300 109)"/><circle cx="300" cy="109" r="12" fill="#c9a7ea" stroke="#9a82d6" stroke-width="2"/></g>
      <image id="a2-art" x="262" y="82" width="76" height="54" display="none" preserveAspectRatio="xMidYMid slice"/></g>
    <g transform="rotate(6 338 150)"><rect x="318" y="128" width="40" height="44" fill="#f6a9bd" stroke="#d27792" stroke-width="2"/>${star(338, 150, 11, "#fff6dc", "#e8c76a")}</g>
    <rect x="392" y="208" width="196" height="16" fill="url(#a2-shadow)"/><rect x="298" y="259" width="122" height="10" fill="url(#a2-shadow)"/>
    <!-- the light switch -->
    <rect x="466" y="232" width="22" height="32" rx="4" fill="#f4e4cc" stroke="#c9a67a" stroke-width="2"/>
    <rect x="472" y="238" width="10" height="20" rx="3" fill="#d8c3a2"/>
    <rect class="a2-toggle" x="473" y="239" width="8" height="9" rx="2" fill="#fffaf0" stroke="#b6946a" stroke-width="1.2"/>
    <rect x="506" y="108" width="64" height="15" rx="3" fill="#f2d488" stroke="#8a6a2a" stroke-width="2"/><text x="538" y="119" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="9" letter-spacing="1.5" fill="#4a3510">MUSEUM</text>
    <rect x="522" y="176" width="32" height="18" rx="2" fill="#fffdf6" stroke="#c9b49b" stroke-width="1.5"/><text x="538" y="189" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="12" fill="#a34063">?!</text>
    <path d="M506 196V168Q506 140 538 140Q570 140 570 168V196Z" fill="#e8f4fb" fill-opacity=".45" stroke="#9db7cf" stroke-width="3"/><circle cx="538" cy="136" r="4" fill="#9db7cf"/><path d="M514 170Q515 154 526 148" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>
    <g transform="translate(26 66)"><!-- the bead rack hangs lower and to the right, clear of the curtain, the jar and the museum shelf -->
    <rect x="286" y="192" width="8" height="12" rx="2" fill="#6d4425"/><rect x="372" y="192" width="8" height="12" rx="2" fill="#6d4425"/>
    <path d="M290 204Q333 286 376 204" fill="none" stroke="#c9a7ea" stroke-width="2"/>
    ${[.1, .21, .32, .43, .57, .68, .79, .9].map((t, i) => {
      const u = 1 - t, x = u * u * 290 + 2 * t * u * 333 + t * t * 376, y = u * u * 204 + 2 * t * u * 286 + t * t * 204;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="${["#f4a3b8", "#c9a7ea", "#8fc3e8", "#f6cf6a"][i % 4]}" stroke="#4a3020" stroke-opacity=".35" stroke-width="1.2"/><circle cx="${(x - 1.6).toFixed(1)}" cy="${(y - 1.8).toFixed(1)}" r="1.5" fill="#fff" opacity=".7"/>`;
    }).join("")}
    <path transform="translate(333 256) scale(2.1)" d="M0 -6 Q5 0 0 5 Q-5 0 0 -6Z" fill="#cfeafa" stroke="#8fc3e8" stroke-width="1.2"/></g>
    <rect x="418" y="104" width="62" height="90" rx="14" fill="#d8c6f3" fill-opacity=".55" stroke="#bda3e9" stroke-width="3"/>
    <rect x="426" y="90" width="46" height="16" rx="4" fill="#f4a3b8" stroke="#c97a92" stroke-width="2"/>
    <path d="M449 94c-18-18-34 2-6 8c-10 8 8 18 6-8c0 26 16 16 6 8c28-6 12-26-6-8Z" fill="#f48fae" stroke="#c97a92" stroke-width="2"/>
    <g class="a2-twinkle">${star(440, 160, 10)}${star(458, 134, 8)}${star(462, 172, 6)}${star(436, 126, 5)}</g>`);

  // things standing on the desk and its lower shelf; the desk itself is real 3D boxes (see desk below).
  // This layer stands at the middle of the desk top's depth (the slab runs from z 45 back to -45), so things sit on it, not in it
  const props = svg(`
    <ellipse cx="66" cy="427" rx="40" ry="3.5" fill="#2a1830" opacity=".4"/>
    <g stroke-width="2" stroke-linejoin="round"><!-- two books, with their tops and right sides showing -->
      <path d="M30 414L36 408H100L94 414Z" fill="#cdb8f2" stroke="#8068c0"/><path d="M94 414L100 408V420L94 426Z" fill="#9a80d4" stroke="#8068c0"/>
      <rect x="30" y="414" width="64" height="12" rx="2" fill="#b79be8" stroke="#8068c0"/>
      <path d="M34 402L40 396H98L92 402Z" fill="#f9c4d2" stroke="#c97a92"/><path d="M92 402L98 396V408L92 414Z" fill="#e08aa3" stroke="#c97a92"/>
      <rect x="34" y="402" width="58" height="12" rx="2" fill="#f4a3b8" stroke="#c97a92"/></g>
    <g transform="rotate(-10 62 342)"><rect x="18" y="326" width="84" height="30" rx="6" fill="#f7efe3" stroke="#c9b496" stroke-width="2"/>
      <circle cx="36" cy="338" r="6" fill="#c9a7ea"/><circle cx="54" cy="336" r="6" fill="#f4a3b8"/><circle cx="72" cy="338" r="6" fill="#f6cf6a"/><circle cx="88" cy="342" r="5" fill="#8fc3e8"/><circle cx="46" cy="349" r="5" fill="#a8d8a0"/></g>
    <rect x="130" y="320" width="30" height="36" rx="6" fill="#d8ecf3" fill-opacity=".7" stroke="#9cc3d1" stroke-width="2"/>
    <path d="M138 322L132 286M146 322L146 282M154 322L160 288" stroke="#8a5a32" stroke-width="5" stroke-linecap="round"/><path d="M132 290L130 280M146 286L146 276M160 292L162 282" stroke="#e1707f" stroke-width="5" stroke-linecap="round"/>
    <circle class="a2-pulse" cx="206" cy="326" r="52" fill="url(#a2-lamp)"/>
    ${star(206, 326, 24, "#fff1b8", "#e8c76a")}`);

  const stuff = svg(`
    <ellipse cx="500" cy="468" rx="56" ry="9" fill="#2a1830" opacity=".35"/>
    <defs>
      <radialGradient id="a2-gtop" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#f6c88a"/><stop offset=".65" stop-color="#e0a466"/><stop offset="1" stop-color="#c4874a"/></radialGradient>
      <linearGradient id="a2-gneck" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a06a3c"/><stop offset=".5" stop-color="#8a5a32"/><stop offset="1" stop-color="#5e3a20"/></linearGradient>
    </defs>
    <g transform="translate(-16 16) rotate(14 520 380)"><!-- a real guitar has depth: its rim and the side of the neck show to the right -->
      ${[6, 5, 4, 3, 2, 1].map(i => `<g transform="translate(${(i * 1.5).toFixed(1)} ${(i * .5).toFixed(1)})" fill="#5a3520"><rect x="513" y="206" width="14" height="124"/><ellipse cx="520" cy="352" rx="38" ry="36"/><ellipse cx="520" cy="408" rx="50" ry="48"/></g>`).join("")}
      <path d="M552 330Q566 352 558 378Q578 396 570 432" fill="none" stroke="#8a5a32" stroke-width="1.6" opacity=".7"/>
      <rect x="513" y="206" width="14" height="124" fill="url(#a2-gneck)"/>
      <path d="M513 222H527M513 238H527M513 253H527M513 267H527M513 280H527M513 292H527M513 303H527M513 313H527" stroke="#e8d9b8" stroke-width="1.2"/>
      <circle cx="520" cy="245" r="1.6" fill="#f4ead2"/><circle cx="520" cy="273" r="1.6" fill="#f4ead2"/><circle cx="520" cy="298" r="1.6" fill="#f4ead2"/>
      <path d="M507 214V190Q507 182 515 182H525Q533 182 533 190V214Z" fill="#6f4528" stroke="#4b2e1f" stroke-width="1.5"/><path d="M533 190L536 192V212L533 214Z" fill="#4b2e1f"/>
      <g fill="#e8c76a" stroke="#a8823a" stroke-width="1"><circle cx="504" cy="190" r="3"/><circle cx="504" cy="200" r="3"/><circle cx="504" cy="210" r="3"/><circle cx="537" cy="190" r="3"/><circle cx="537" cy="200" r="3"/><circle cx="537" cy="210" r="3"/></g>
      <rect x="512" y="204" width="16" height="3" rx="1" fill="#f4ead2"/>
      <ellipse cx="520" cy="352" rx="38" ry="36" fill="#8a5a32"/><ellipse cx="520" cy="408" rx="50" ry="48" fill="#8a5a32"/>
      <ellipse cx="520" cy="352" rx="35" ry="33" fill="#f2dcb4"/><ellipse cx="520" cy="408" rx="47" ry="45" fill="#f2dcb4"/>
      <ellipse cx="520" cy="352" rx="33" ry="31" fill="url(#a2-gtop)"/><ellipse cx="520" cy="408" rx="45" ry="43" fill="url(#a2-gtop)"/>
      <path d="M520 330V331" stroke="#e0a466" stroke-width="20"/>
      <circle cx="520" cy="372" r="17" fill="none" stroke="#8a5a32" stroke-width="2.5"/><circle cx="520" cy="372" r="15" fill="none" stroke="#f2dcb4" stroke-width="1.2" stroke-dasharray="2 2"/>
      <circle cx="520" cy="372" r="13" fill="#3a2216"/><path d="M509 366A13 13 0 0 1 531 366" fill="none" stroke="#1f120b" stroke-width="4" opacity=".6"/>
      <rect x="503" y="420" width="34" height="8" rx="3" fill="#6f4528" stroke="#4b2e1f" stroke-width="1.2"/><path d="M508 423H532" stroke="#f4ead2" stroke-width="1.6"/>
      <path d="M492 334Q496 322 508 320M482 392Q484 376 494 368" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>
      ${star(494, 434, 6, "#f8b0bf", "#d27792")}
      <path d="M516 190V424M520 190V424M524 190V424" stroke="#fbf7ec" stroke-width="1.3"/>
    </g>
    <g transform="translate(111 -8)">
      <ellipse cx="442" cy="482" rx="34" ry="6" fill="#2a1830" opacity=".35"/>
      <circle cx="440" cy="446" r="36" fill="#f48fae" stroke="#c4577b" stroke-width="3"/>
      <path d="M411 438q29 12 58-6M408 452q32 12 64-4M418 422q22 10 46 5M418 468q22 8 44-6" fill="none" stroke="#fbc0d0" stroke-width="3" stroke-linecap="round"/>
    </g>`);

  // Lumi's bed, on the rug: a matchbox, a cotton-stuffed pillow and a sock for a blanket (the same bed as in the lantern attic)
  // drawn around its own foot (0 0), then moved onto the middle of the rug; it stands where the floor is, which is nearer than it looks
  // the head and foot boards are solid slabs: the outline is stacked a few times along the bed's depth, then the face goes on top
  const slab = (d, side) => [6, 5, 4, 3, 2, 1].map(i => `<path d="${d}" transform="translate(${(i * 1.6).toFixed(1)} ${(-i * 1.4).toFixed(1)})" fill="${side}" stroke="${side}" stroke-width="2"/>`).join("");
  const foot = (x, back) => `<g transform="translate(${x} 0)" fill="${back ? "#a9845a" : "#c9a87c"}" stroke="#8a6040" stroke-width="1.6"><rect x="-5" y="-6" width="10" height="7" rx="2"/><ellipse cx="0" cy="1" rx="5" ry="2.2"/><ellipse cx="0" cy="-6" rx="5" ry="2.2" fill="${back ? "#c2a074" : "#e0c49a"}"/></g>`;
  const HEAD = "M-92 -2V-52Q-92 -72 -73 -72Q-55 -72 -55 -52V-2Z", FOOT = "M66 -2V-34Q66 -46 78 -46Q90 -46 90 -34V-2Z";
  const bed = svg(`<defs>
      <linearGradient id="a2-bedfront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9cf"/><stop offset="1" stop-color="#e6c49a"/></linearGradient>
      <linearGradient id="a2-bedside" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d4b083"/><stop offset="1" stop-color="#b8915f"/></linearGradient>
      <linearGradient id="a2-board" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2cffa"/><stop offset=".55" stop-color="#c3a3ec"/><stop offset="1" stop-color="#a888dc"/></linearGradient>
      <linearGradient id="a2-blanket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dccff8"/><stop offset="1" stop-color="#b3a0e6"/></linearGradient>
      <radialGradient id="a2-cotton" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fbf3ea"/><stop offset="1" stop-color="#dcc5ad"/></radialGradient>
    </defs>
    <g transform="translate(392 474) scale(1.3)">
    <ellipse cx="6" cy="1" rx="100" ry="9" fill="#2a1830" opacity=".38"/>
    <ellipse cx="4" cy="0" rx="86" ry="4.5" fill="#2a1830" opacity=".3"/>
    ${foot(-60, 1)}${foot(84, 1)}
    <g stroke-width="2" stroke-linejoin="round">
      ${slab(HEAD, "#7f64b8")}
      <path d="M-80 -28L-70 -37H90L80 -28Z" fill="#fbefd9" stroke="#b98a5c"/>
      <path d="M-74 -29.5L-67 -35H85L78 -29.5Z" fill="#b98f62" stroke="none"/>
      <path d="M80 -28L90 -37V-11L80 -2Z" fill="url(#a2-bedside)" stroke="#b98a5c"/>
      <path d="M82 -24L88 -29.5" stroke="#f3dcbc" stroke-width="1.4" opacity=".7"/>
      <rect x="-80" y="-28" width="160" height="26" rx="4" fill="url(#a2-bedfront)" stroke="#b98a5c" stroke-width="2.4"/>
      <path d="M-76 -24.5H76" stroke="#fff8ec" stroke-width="2" stroke-linecap="round" opacity=".8"/>
      <path d="M-76 -5H76" stroke="#c9a172" stroke-width="2" stroke-linecap="round" opacity=".55"/>
      <ellipse cx="-40" cy="-30" rx="24" ry="4" fill="#8f6a44" opacity=".4" stroke="none"/>
      <!-- a puffy pillow: its top and side show behind the front, which bulges and dips at the middle button -->
      <path d="M-62 -31Q-65 -41 -60 -50Q-43 -54 -25 -50Q-20 -41 -23 -31Q-42 -27 -62 -31Z" transform="translate(6 -5)" fill="#e9dccd" stroke="#d2bba3" stroke-width="1.6"/>
      <path d="M-60 -50L-54 -55Q-37 -59 -19 -55L-25 -50Q-43 -54 -60 -50ZM-25 -50L-19 -55Q-14 -46 -17 -36L-23 -31Q-20 -41 -25 -50Z" fill="#f6eee4" stroke="none"/>
      <path d="M-62 -31Q-65 -41 -60 -50Q-43 -54 -25 -50Q-20 -41 -23 -31Q-42 -27 -62 -31Z" fill="url(#a2-cotton)" stroke="#d2bba3" stroke-width="1.8"/>
      <path d="M-58 -33.5Q-60 -41 -56.5 -47.5Q-43 -50.5 -28 -47.5Q-24.5 -41 -26.5 -34" fill="none" stroke="#e2cdb6" stroke-width="1.1" stroke-dasharray="2 2"/>
      <path d="M-49 -46Q-43 -41 -42.5 -40M-36 -46Q-41 -41 -42.5 -40M-50 -34Q-45 -38 -42.5 -40M-34 -34Q-39 -38 -42.5 -40" fill="none" stroke="#dcc6ae" stroke-width="1.1" stroke-linecap="round"/>
      <circle cx="-42.5" cy="-40" r="2.1" fill="#f4a3b8" stroke="#c97a92" stroke-width="1"/>
      <path d="M-57 -45Q-55 -49 -49 -49.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>
      <path d="M-24 -38Q-23 -46 -15 -46H72Q80 -46 80 -38V-28H-24Z" fill="url(#a2-blanket)" stroke="#9c86d6"/>
      <path d="M-15 -46L-9 -50H76Q84 -50 84 -43L80 -38Q80 -46 72 -46Z" fill="#e8defb" stroke="#9c86d6" stroke-width="1.6"/>
      <path d="M-4 -45V-29M14 -45V-29M32 -45V-29M50 -45V-29M66 -45V-29" stroke="#fff" stroke-width="3" opacity=".5"/>
      <path d="M2 -40Q20 -36 34 -41T64 -39" fill="none" stroke="#9c86d6" stroke-width="1.4" opacity=".5"/>
      <path d="M-24 -38Q-23 -46 -15 -46H-6V-28H-24Z" fill="#f4a3b8" stroke="#c97a92"/><path d="M-19 -44V-30M-13 -45V-30" stroke="#fff" stroke-width="1.5" opacity=".6"/>
      <path d="M-24 -28H80V-23Q67 -17 54 -23Q41 -17 28 -23Q15 -17 2 -23Q-11 -17 -24 -23Z" fill="#c9b7f0" stroke="#9c86d6"/>
      <g fill="#fff" stroke="none" opacity=".75"><circle cx="40" cy="-25" r="1.6"/><circle cx="66" cy="-25" r="1.6"/><circle cx="21" cy="-38" r="1.6"/><circle cx="57" cy="-38" r="1.6"/></g>
      <path d="${HEAD}" fill="url(#a2-board)" stroke="#7f64b8"/>
      <path d="M-86 -6V-50Q-86 -65 -73 -65Q-61 -65 -61 -50V-6Z" fill="none" stroke="#efe6fd" stroke-width="2"/>
      <path d="M-88 -12V-50Q-88 -66 -76 -68" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
      <path d="M-73 -40c-5 -6 -12 -1 -7 4l7 6l7 -6c5 -5 -2 -10 -7 -4z" fill="#f48fae" stroke="#c97a92" stroke-width="1.4"/>
      ${slab(FOOT, "#7f64b8")}
      <path d="${FOOT}" fill="url(#a2-board)" stroke="#7f64b8"/>
      <path d="M69 -8V-34Q69 -42 76 -43.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
    </g>
    ${foot(-68, 0)}${foot(72, 0)}
    ${star(-73, -58, 4.5, "#f6cf6a", "#d9a93a")}${star(78, -32, 4.5, "#f6cf6a", "#d9a93a")}</g>`);

  // The floor is a real plane lying down (rotated 90 degrees, running from the back wall toward you), and the rug
  // lies on it, so tilting the room moves them together. Its top edge is the foot of the wall.
  const ground = `<div class="a2-plane" style="transform:translateZ(-130px) rotateX(90deg)"><div class="a2-rug"></div></div>`;

  const lights = svg(`
    <path d="M-10 36Q150 92 300 48T610 70" fill="none" stroke="#4a3020" stroke-width="2.5"/>
    ${[[60, 66], [150, 80], [240, 70], [330, 56], [420, 58], [500, 68], [570, 76]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" fill="url(#a2-lamp)" opacity=".55"/>`).join("")}
    <circle class="a2-pulse" cx="390" cy="126" r="70" fill="url(#a2-lamp)" opacity=".6"/>
    <g class="a2-twinkle">${[[60, 66], [150, 80], [240, 70], [330, 56], [420, 58], [500, 68], [570, 76]].map(([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="7" fill="${i % 2 ? "#ffd7e2" : "#fff1b8"}" stroke="#e8c76a" stroke-width="1.5"/>`).join("")}</g>
    <path d="M390 31V108" stroke="#4a3020" stroke-width="2"/>${star(390, 126, 18, "#fff1b8", "#e8c76a")}
    <path d="M598 150C566 200 590 250 572 330" fill="none" stroke="#3f6a40" stroke-width="3"/>
    ${leaf(590, 168, 30, 1.1)}${leaf(574, 204, -30)}${leaf(588, 244, 30, .9)}${leaf(572, 290, -20)}${leaf(580, 320, 20, .8)}`);

  // The desk is built, not drawn: boxes with a front, sides and a top, so tilting the room shows its depth.
  // x, y, w, h are % of the stage; z is the front face's depth and d how far the box runs back (px)
  // things above eye level (bottom: true) show their underside instead of their top
  const box = ({ x, y, w, h, z, d, cls = "", bottom = false }) =>
    `<div class="a2-box ${cls}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;transform:translateZ(${z}px)"><i class="f fr"></i><i class="f bk" style="transform:translateZ(${-d}px)"></i><i class="f lf" style="width:${d}px"></i><i class="f rt" style="width:${d}px"></i>${bottom ? `<i class="f bt" style="height:${d}px"></i>` : `<i class="f tp" style="height:${d}px"></i>`}</div>`;
  // the window sill sticks out of the wall, the jar and museum shelf is a real plank, and a beam runs across the ceiling up front
  const sill = box({ x: 6.67, y: 62.7, w: 36.67, h: 2.7, z: 18, d: 18, cls: "sill" });
  const shelves = [
    box({ x: 69.4, y: 39.6, w: 1.2, h: 5.6, z: 6, d: 26, cls: "bracket" }),
    box({ x: 92.7, y: 39.6, w: 1.2, h: 5.6, z: 6, d: 26, cls: "bracket" }),
    box({ x: 65.3, y: 36.5, w: 32.6, h: 3.5, z: 16, d: 36, cls: "plank", bottom: true }),
    box({ x: 49.67, y: 48.08, w: 20.33, h: 1.9, z: 12, d: 20, cls: "plank" }),
  ].join("");
  const beam = box({ x: -5, y: -1.5, w: 110, h: 5, z: 0, d: 46, cls: "beam", bottom: true });

  // ivy that hangs into the room right in front of you: the nearest layer, so it slides the most when the room leans
  const IVY = [["#6f9a5f", "#45703f"], ["#8bb370", "#557f4b"]];
  const ivyLeaf = (x, y, rot, s, k) =>
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${s.toFixed(2)})"><path d="M0 0C-8 -5 -9 -15 0 -23C9 -15 8 -5 0 0Z" fill="${IVY[k][0]}" stroke="${IVY[k][1]}" stroke-width="1.3"/><path d="M0 -3V-17" stroke="${IVY[k][1]}" stroke-width="1" opacity=".6"/></g>`;
  // a stem along a curve with leaves on alternate sides, getting smaller toward the tip
  const strand = (x0, y0, cx, cy, x1, y1, n, s0 = 1) => {
    let out = `<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="#3f6a40" stroke-width="2.6" stroke-linecap="round"/>`;
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      const a = Math.atan2(2 * u * (cy - y0) + 2 * t * (y1 - cy), 2 * u * (cx - x0) + 2 * t * (x1 - cx)) * 180 / Math.PI;
      out += ivyLeaf(x, y, a + 90 + (i % 2 ? 55 : -55) + (i * 37 % 20 - 10), s0 * (1.05 - .35 * t), i % 3 ? 0 : 1);
    }
    return out;
  };
  // pothos leaves: a heart with a pointed tip, base at (0 0), pointing up; k picks the shade
  // shades 0 and 1 for the middle leaves, 2 for the dark ones at the back, 3 for the light ones at the front
  const POT_GREEN = [["#5f9a58", "#3c6a3a", "#86bd72"], ["#7fb06a", "#4d7f45", "#a6d08c"], ["#3f7444", "#284d2c", "#5f9a5c"], ["#9fd07e", "#5f8f4f", "#d2efb6"]];
  const heart = (x, y, rot, s, k) => {
    const [f, l, h] = POT_GREEN[k];
    return `<g transform="translate(${x} ${y}) rotate(${rot.toFixed(0)}) scale(${s})"><path d="M0 0C-4 2 -14 0 -15 -11C-16 -21 -7 -28 0 -36C7 -28 16 -21 15 -11C14 0 4 2 0 0Z" fill="${f}" stroke="${l}" stroke-width="1.6"/><path d="M0 -2C-9 -3 -12 -12 -10 -20C-7 -26 -3 -30 0 -33Z" fill="${h}" opacity=".45"/><path d="M0 -1V-30" stroke="${l}" stroke-width="1.2" opacity=".7"/></g>`;
  };
  const stem = (x0, y0, cx, cy, x1, y1, c = "#4d7f45") => `<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
  // [tip x, tip y, bend x, bend y, size, shade]; the plant is three layers of leaves (back, middle, front), so they shift apart when the room leans
  const POTHOS_BACK = [[-14, 400, 10, 436, 1.05, 2], [4, 372, 20, 424, 1.15, 2], [24, 358, 28, 420, 1.2, 2], [44, 366, 36, 422, 1.15, 2],
    [64, 384, 44, 430, 1.1, 2], [78, 408, 52, 440, 1, 2]];
  const POTHOS = [[-4, 418, 18, 446, 1, 0], [10, 398, 22, 436, 1.1, 1], [30, 386, 28, 428, 1.2, 0], [50, 396, 36, 432, 1.1, 1],
    [70, 418, 48, 444, 1, 0], [2, 446, 18, 462, .85, 1], [58, 446, 44, 460, .85, 1], [40, 410, 30, 440, .8, 0]];
  const POTHOS_FRONT = [[-4, 462, 12, 458, .9, 3], [16, 438, 24, 452, 1, 3], [44, 442, 38, 454, 1, 3], [10, 484, 14, 472, .7, 3]];
  // the plant stands a little in from the corner: its front leaves lean the most, and right at the edge they got cut off
  const PLANT_AT = "translate(50 -8)";
  const pothos = (set, c) => set.map(([ex, ey, cx, cy, s, k]) => stem(30, 468, cx, cy, ex, ey, c) + heart(ex, ey, Math.atan2(ey - cy, ex - cx) * 180 / Math.PI + 90, s, k)).join("");
  const plantBack = svg(`<g transform="${PLANT_AT}">${pothos(POTHOS_BACK, "#2f5a33")}</g>`);
  const plantFront = svg(`<g transform="${PLANT_AT}">${pothos(POTHOS_FRONT, "#5f8f4f")}
    ${stem(50, 468, 74, 466, 72, 488, "#5f8f4f")}${heart(60, 472, 120, .55, 3)}${heart(70, 478, 70, .5, 1)}${heart(72, 488, 150, .45, 3)}</g>`);
  const near = svg(`
    ${strand(-10, -6, 40, 10, 124, 4, 9, 1.15)}${strand(10, -8, 0, 60, 34, 118, 9, 1.3)}${strand(95, -6, 100, 30, 90, 60, 5, 1)}${strand(40, -8, 50, 40, 22, 74, 5, 1.1)}
    ${strand(610, -6, 560, 12, 470, 2, 9, 1.15)}${strand(592, -8, 606, 50, 584, 100, 8, 1.25)}${strand(540, -6, 530, 36, 546, 70, 5, 1.05)}${strand(570, -8, 556, 30, 580, 56, 4, 1.1)}
    <g transform="${PLANT_AT}"><!-- a little potted pothos in the front corner: heart leaves on curly stems, one trailing over the rim -->
      <ellipse cx="30" cy="468" rx="25" ry="4.5" fill="#4a2f22"/>
      ${pothos(POTHOS)}
      <path d="M4 476H56L50 528H10Z" fill="#d9876a" stroke="#a85a45" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M42 477H55L49.5 527H38Z" fill="#b8634c" opacity=".45"/>
      <path d="M11 480L14 524" stroke="#f3b79d" stroke-width="3" stroke-linecap="round" opacity=".6"/>
      <path d="M30 494c-3.5 -4 -9 -1 -5.5 3l5.5 5l5.5 -5c3.5 -4 -2 -7 -5.5 -3z" fill="#f4a3b8" stroke="#c97a92" stroke-width="1.2"/>
      <rect x="0" y="464" width="60" height="14" rx="4" fill="#e89a7c" stroke="#a85a45" stroke-width="2.5"/>
      <path d="M5 468H44" stroke="#f7c4ad" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
    </g>`);
  const desk = [
    box({ x: 2.2, y: 71.7, w: 2.2, h: 20.4, z: -32, d: 10, cls: "leg" }),
    box({ x: 39.8, y: 71.7, w: 2.2, h: 20.4, z: -32, d: 10, cls: "leg" }),
    box({ x: 4.4, y: 71.7, w: 35.4, h: 20.4, z: -40, d: 2, cls: "gap" }),
    box({ x: 3, y: 81.9, w: 39, h: 1.8, z: 38, d: 78, cls: "shelf" }),
    box({ x: 21, y: 72, w: 18, h: 8, z: 36, d: 70, cls: "drawer" }),
    box({ x: 2.2, y: 71.7, w: 2.2, h: 20.4, z: 38, d: 10, cls: "leg" }),
    box({ x: 39.8, y: 71.7, w: 2.2, h: 20.4, z: 38, d: 10, cls: "leg" }),
    box({ x: -3, y: 68.5, w: 46.6, h: 3.2, z: 45, d: 90, cls: "slab" }),
  ].join("");

  // z in px (negative is farther away); hits are [id, name, left%, top%, width%, height%]
  const LAYERS = [
    { z: -130, html: wall, cls: "a2-wall", hits: [["window", "the window", 7, 23, 35, 40]] },
    { z: -130, html: sill, cls: "a2-boxes" },
    { z: -105, html: curtains, cls: "a2-curtains" },
    { z: -70, html: shelves, cls: "a2-boxes" },
    { z: -70, html: shelf, cls: "a2-shelf", hits: [["jar", "resin jar of stars", 68, 16, 14, 24], ["museum", "museum of useless facts", 83.5, 20, 12.5, 18], ["beads", "dew-drop beads", 49.3, 47.7, 21, 17], ["switch", "light switch", 76.7, 43.6, 5.5, 8]] },
    { z: -57, html: desk, cls: "a2-desk" },
    { z: -10, html: props, cls: "a2-props", hits: [["moons", "watercolor moons", 2, 60, 24, 12]] },
    { z: -25, html: stuff, cls: "a2-stuff", hits: [["guitar", "the guitar", 73.5, 55, 22, 30]] },
    { z: 0, html: ground, cls: "a2-ground" },
    { z: 15, html: bed, cls: "a2-bed", hits: [["bed", "Lumi's bed", 45.5, 73.6, 28, 18]] },
    { z: 40, html: beam, cls: "a2-boxes" },
    { z: 60, html: lights, cls: "a2-front" },
    { z: 74, html: plantBack, cls: "a2-near" },
    { z: 90, html: near, cls: "a2-near" },
    { z: 97, html: plantFront, cls: "a2-near" },
    { z: 100, html: svg(`<rect x="-140" y="-140" width="880" height="800" fill="url(#a2-vig)"/>`), cls: "a2-vignette" },
  ];
  const LUMI_Z = 25;
  const zoom = (z) => ((PERSPECTIVE - z) / PERSPECTIVE).toFixed(4);

  // Lumi's five hobbies (the same ones as in the lantern attic, written out here so Attic 2 stands on its own);
  // the window is a bonus spot and doesn't count. The guitar's text grows with its strings (see attic2-quests.js).
  const HOBBY_IDS = ["moons", "jar", "beads", "guitar", "museum"];
  const HOBBIES = {
    moons: { name: "watercolor moons", progress: 40, note: "painted three moons. two came out looking like lemons. the third is still a pencil circle." },
    jar: { name: "resin jar of stars", progress: 30, note: "poured the resin. forgot the stars. added the stars. the resin had already set. one star lives on the lid now." },
    beads: { name: "dew-drop bead jewellery", progress: 15, note: "strung three dew drops. they evaporated by morning. switched to glass beads, then lost the needle." },
    guitar: { name: "the guitar (one string)", progress: 5, note: "learned one string. it is a very good string. the other five are 'coming soon'." },
    museum: { name: "museum of useless facts", progress: 99, note: "the only hobby that grows by itself. it can never be finished, because new facts keep happening." },
  };
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
  const SPOTS = {
    window: ["the window", "out there: the whole night sky, and (Lumi is sure of it) a few space critters who can't find their way home."],
    bed: ["Lumi's bed", "a matchbox, a cotton-stuffed pillow and a sock for a blanket. Lumi only sleeps after a lullaby."],
  };
  const ACTIONS = {
    moons: `<button class="btn btn-gold small" data-a2-paint data-sfx="none">🎨 paint with Lumi</button>`,
    beads: `<a class="btn btn-gold small" href="#dress">📿 dress up Lumi ›</a>`,
    guitar: `<button class="btn btn-gold small" data-a2-pluck data-sfx="none">🎸 pluck the string</button><button class="btn btn-lilac small" data-a2-lesson-open data-sfx="none">🎶 guitar lesson</button>`,
    museum: `<button class="btn btn-lilac small" data-a2-fact data-sfx="none">another fact</button><a class="btn btn-lilac small" href="#facts">visit the museum ›</a>`,
    jar: `<button class="btn btn-gold small" data-a2-shake data-sfx="none">✨ shake the jar</button>`,
    window: `<button class="btn btn-gold small" data-a2-space data-sfx="none">🛸 fly out the window</button>`,
  };

  const stage = $("#a2-stage"), world = $("#a2-world"), tilt = $("#a2-tilt"), card = $("#a2-card"), count = $("#a2-found"), pips = $("#a2-pips");
  const saved = store.get("attic2", []);
  const found = new Set((Array.isArray(saved) ? saved : []).map(id => id === "paints" ? "moons" : id).filter(id => HOBBY_IDS.includes(id)));

  tilt.innerHTML = LAYERS.map(l => {
    const hits = (l.hits || []).map(([id, name, x, y, w, h]) =>
      `<button class="a2-hit" data-spot="${id}" data-sfx="none" aria-label="${name}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"><span class="a2-tag">${name}</span></button>`).join("");
    return `<div class="a2-layer ${l.cls}" style="transform:translateZ(${l.z}px) scale(${zoom(l.z)})">${l.html}${hits}</div>`;
  }).join("");
  const lumi = document.createElement("div");
  lumi.className = "a2-lumi";
  lumi.setAttribute("aria-hidden", "true");
  lumi.style.transform = `translateZ(${LUMI_Z}px) scale(${zoom(LUMI_Z)})`;
  lumi.innerHTML = `<span class="a2-roam"><span class="a2-glow" aria-hidden="true"></span><span class="a2-shade" aria-hidden="true"></span><span class="a2-hover"></span></span>`;
  tilt.insertBefore(lumi, tilt.querySelector(".a2-front"));
  const roam = lumi.firstChild, hover = roam.lastChild;

  // the painting from the easel goes up in the frame on the wall (the browser keeps one painting, so a painting
  // hung in the lantern attic shows up here too)
  const hang = (url) => {
    if (!url) return;
    $("#a2-art", tilt).setAttribute("href", url);
    $("#a2-art", tilt).removeAttribute("display");
    $("#a2-planet", tilt).setAttribute("display", "none");
  };

  // ---------- Lumi: she follows the pointer like the lantern does in the dark attic ----------
  // she is only a cursor: clicks go through her to whatever she is standing in front of
  const MOODS = { moons: "happy", jar: "surprised", beads: "love", guitar: "excited", museum: "curious", window: "starry", bed: "sleepy" };
  let mood = "", lastMove = 0, wander = 0, calm = 0;
  let bedtime = false;
  const feel = (m, force = false) => { if (bedtime && !force) return; if (m !== mood) { mood = m; hover.innerHTML = app.art(m, true); } };
  const react = (id) => {
    feel(MOODS[id]);
    clearTimeout(calm);
    calm = setTimeout(() => feel("starry"), 4200);
  };
  feel("starry");
  // a necklace strung on the dress-up page shows up here too
  addEventListener("lumi:wear", () => { const m = mood; mood = ""; feel(m); });

  // where she is, as a pixel offset from her home spot; she eases toward where the pointer is
  const me = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
  const glide = () => {
    const k = reduceMotion ? 1 : .1;
    me.x += (me.tx - me.x) * k;
    me.y += (me.ty - me.y) * k;
    roam.style.translate = `${me.x.toFixed(1)}px ${me.y.toFixed(1)}px`;
    me.raf = Math.abs(me.tx - me.x) + Math.abs(me.ty - me.y) > .3 ? requestAnimationFrame(glide) : 0;
  };
  // fx, fy: where to go, as fractions of the world
  const follow = (fx, fy) => {
    if (bedtime) return;
    const W = world.clientWidth, H = world.clientHeight, w = lumi.offsetWidth, h = lumi.offsetHeight;
    if (!w) return;
    const cx = Math.max(w * .35, Math.min(W - w * .35, fx * W));
    const cy = Math.max(h * .4, Math.min(H - h * .5, fy * H - h * .1));
    me.tx = cx - (lumi.offsetLeft + w / 2);
    me.ty = cy - (lumi.offsetTop + h / 2);
    if (!me.raf) me.raf = requestAnimationFrame(glide);
  };
  const frac = (e) => {
    const r = world.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  const render = () => {
    count.textContent = found.size;
    pips.innerHTML = HOBBY_IDS.map(id => `<i class="${found.has(id) ? "on" : ""}"></i>`).join("");
    $$(".a2-hit", tilt).forEach(b => b.classList.toggle("found", found.has(b.dataset.spot)));
  };
  let intro = false; // the welcome card goes away by itself on a phone, where it would cover the room
  const say = (title, text, extra = "") => {
    intro = false;
    card.hidden = false;
    card.innerHTML = `<h2>${title}</h2><p>${text}</p>${extra}`;
    restart(card, "pop");
  };
  const bar = (p) => `<div class="progress"><span>progress</span><span class="progress-bar"><i style="--p:${p}%"></i></span><span>${p}%</span></div>`;
  // the museum card shows a fact right here
  const newFact = () => {
    const el = $(".a2-fact", card), art = $(".a2-fact-art", card), i = Math.floor(Math.random() * FACTS.length);
    if (el) el.textContent = `“${FACTS[i]}”`;
    if (art) art.innerHTML = app.factArt(i);
  };
  const open = (id) => {
    const h = id === "guitar" ? { ...HOBBIES.guitar, ...app.a2guitar() } : HOBBIES[id], fresh = !!h && !found.has(id);
    if (h) {
      found.add(id);
      store.set("attic2", [...found]);
      render();
    }
    const [name, note] = h ? [h.name, h.note] : SPOTS[id];
    const all = fresh && found.size === HOBBY_IDS.length;
    react(id);
    say(name, note, (all ? `<p class="a2-all">⭐ you found all five!! (finished: none of them. that's the tradition.)</p>` : "")
      + (id === "museum" ? `<div class="a2-fact-art"></div><p class="a2-fact"></p>` : "")
      + (h ? bar(h.progress) : "") + (ACTIONS[id] ? `<div class="bead-actions">${ACTIONS[id]}</div>` : "")
      + (id === "bed" ? `<div class="bead-actions"><button class="btn btn-lilac small" data-a2-lullaby data-sfx="none">${bedtime ? "☀️ wake Lumi up" : "♪ play the lullaby"}</button></div>` : ""));
    if (id === "museum") newFact();
    sfx.play.plip();
    if (all) { sfx.play.shiny(); app.lumi.react("happy", "you found everything!! the attic has never been so seen.", 3200); }
  };

  // ---------- phones: the room is bigger than the screen; you drag to look around and tap to send Lumi ----------
  const phone = matchMedia("(max-width: 719px), (max-height: 520px)");
  const pan = { x: 0, y: 0 };
  let drag = null, dragged = false;
  const setPan = (x, y) => {
    const minX = stage.clientWidth - world.offsetWidth, minY = stage.clientHeight - world.offsetHeight;
    pan.x = Math.min(0, Math.max(minX, x));
    pan.y = Math.min(0, Math.max(minY, y));
    world.style.translate = `${pan.x.toFixed(1)}px ${pan.y.toFixed(1)}px`;
    // where you are looking leans the room, so dragging shows its depth the way the mouse does
    if (!reduceMotion) aim(((minX < 0 ? pan.x / minX : .5) - .5) * 14, -((minY < 0 ? pan.y / minY : .5) - .5) * 9);
  };
  // the camera starts on Lumi
  const recenter = () => {
    if (!phone.matches) { pan.x = pan.y = 0; world.style.translate = ""; return; }
    setPan(stage.clientWidth / 2 - (lumi.offsetLeft + lumi.offsetWidth / 2 + me.x), stage.clientHeight * .45 - (lumi.offsetTop + lumi.offsetHeight / 2 + me.y));
  };

  tilt.addEventListener("click", (e) => {
    if (dragged) { dragged = false; return; } // the end of a drag is not a tap
    const spot = e.target.closest("[data-spot]");
    if (spot?.dataset.spot === "switch") { setLights(!lit); sfx.play.pop(); }
    else if (spot) open(spot.dataset.spot);
  });
  // the paint easel and the guitar lessons open right here, in this card
  card.addEventListener("click", (e) => {
    if (e.target.closest("[data-a2-paint]")) {
      sfx.play.pop();
      app.a2quests.paint(hang);
    } else if (e.target.closest("[data-a2-lesson-open]")) {
      sfx.play.pop();
      app.a2quests.lesson();
    } else if (e.target.closest("[data-a2-pluck]")) {
      app.a2quests.pluck();
    } else if (e.target.closest("[data-a2-fact]")) {
      sfx.play.pop();
      newFact();
    } else if (e.target.closest("[data-a2-shake]")) {
      sfx.play.shiny();
      app.toast("✨ a star fell out. Lumi put it back. the thumbprint stays.");
      app.lumi.react("surprised", "did the jar just wink?", 2600);
    } else if (e.target.closest("[data-a2-lullaby]")) {
      lullaby();
    } else if (e.target.closest("[data-a2-space]")) {
      sfx.play.shiny();
      app.secret("space");
      app.game.toSpace();
      app.toast("🛸 Lumi flew out of the window!");
      location.hash = "#play";
    }
  });
  $("#a2-x").addEventListener("click", () => { card.hidden = true; });
  // keyboard: tabbing onto a thing brings Lumi to it
  tilt.addEventListener("focusin", (e) => {
    const b = e.target.closest(".a2-hit");
    if (!b || !b.matches(":focus-visible")) return;
    const s = world.getBoundingClientRect(), r = b.getBoundingClientRect();
    lastMove = Date.now();
    follow((r.left + r.width / 2 - s.left) / s.width, (r.top + r.height / 2 - s.top) / s.height);
  });

  // ---------- tilt: the pointer leans the room; with no pointer it sways slowly on its own ----------
  const LEAN = -5; // the room always leans a little, so you look down onto the desk and the rug
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const frame = () => {
    cx += (tx - cx) * .12;
    cy += (ty - cy) * .12;
    tilt.style.transform = `rotateX(${(cy + LEAN).toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg)`;
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .02 ? requestAnimationFrame(frame) : 0;
  };
  const aim = (x, y) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(frame); };
  stage.addEventListener("pointerdown", (e) => {
    if (asleep && !e.target.closest(".a2-hit")) { wakeUp(); return; }
    lastMove = Date.now();
    dragged = false;
    if (phone.matches) drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    else follow(...frac(e));
  });
  stage.addEventListener("pointermove", (e) => {
    lastMove = Date.now();
    if (phone.matches) {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!dragged && Math.hypot(dx, dy) < 8) return;
      dragged = true;
      stage.classList.add("steered");
      setPan(drag.px + dx, drag.py + dy);
      return;
    }
    const [fx, fy] = frac(e);
    follow(fx, fy);
    if (reduceMotion) return;
    aim((fx - .5) * 14, -(fy - .5) * 9);
    stage.classList.add("steered");
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    if (!dragged && e.type === "pointerup") follow(...frac(e)); // a tap sends Lumi there
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("pointerleave", () => { if (phone.matches) return; aim(0, 0); stage.classList.remove("steered"); });
  addEventListener("resize", () => { if (app.view() === "attic2") recenter(); });

  aim(0, 0); // sets the resting lean
  // with nobody steering she wanders the rug
  const RUG = [[.3, .8], [.5, .82], [.7, .8], [.4, .74], [.62, .76]];
  const stroll = () => {
    if (document.hidden || Date.now() - lastMove < 6000) return;
    follow(...RUG[Math.floor(Math.random() * RUG.length)]);
  };

  // ---------- the lights: a switch on the wall (and a button). In the dark, Lumi's antennae are the only light ----------
  const dark = document.createElement("div"), lightsBtn = $("#a2-lights");
  dark.className = "a2-dark";
  dark.setAttribute("aria-hidden", "true");
  stage.appendChild(dark);
  let lit = store.get("a2lit", true) !== false, glowRaf = 0;
  // the dark has a hole of light that follows Lumi
  const trackGlow = () => {
    glowRaf = 0;
    if (lit || app.view() !== "attic2") return;
    const s = stage.getBoundingClientRect(), r = hover.getBoundingClientRect();
    dark.style.setProperty("--lx", (r.left + r.width / 2 - s.left).toFixed(0) + "px");
    dark.style.setProperty("--ly", (r.top + r.height * .3 - s.top).toFixed(0) + "px");
    dark.style.setProperty("--r", Math.max(90, r.width * .95).toFixed(0) + "px");
    glowRaf = requestAnimationFrame(trackGlow);
  };
  function setLights(on, keep = true) {
    lit = on;
    stage.classList.toggle("dark", !on);
    if (keep) store.set("a2lit", on);
    lightsBtn.textContent = on ? "🌙 lights off" : "💡 lights on";
    lightsBtn.setAttribute("aria-pressed", String(!on));
    if (!on && !glowRaf) trackGlow();
  }
  lightsBtn.addEventListener("click", () => { setLights(!lit); sfx.play.pop(); });

  // ---------- bedtime: the lullaby sends Lumi to bed, the lights go down, and her glow is the night light ----------
  // Brahms' Lullaby (traditional, public domain), up an octave like a music box: the same tune as the lantern attic
  const N = { D: 587.3, E: 659.3, F: 698.5, G: 784, A: 880, B: 987.8, C: 1046.5 };
  const LULLABY = [["E", .5], ["E", .5], ["G", 2], ["E", .5], ["E", .5], ["G", 2], ["E", .5], ["G", .5], ["C", 1], ["B", 1.5], ["A", .5],
    ["A", 1], ["G", 1], ["D", .5], ["E", .5], ["F", 1], ["D", 1], ["D", .5], ["E", .5], ["F", 2], ["D", .5], ["F", .5],
    ["B", .5], ["A", .5], ["G", 1], ["B", 1], ["C", 3]].map(([n, b]) => [N[n], b]);
  const PILLOW = [380 / VB_W, 428 / VB_H];   // where she curls up, on the sock blanket
  let asleep = false, tune = null, wasLit = true, nap = 0;
  const lullabyBtn = () => $("[data-a2-lullaby]", card);
  function lullaby() {
    if (bedtime) { wakeUp(); return; }
    bedtime = true;
    wasLit = lit;
    clearTimeout(calm);
    feel("sleepy", true);
    stage.classList.add("bedtime");
    tune = sfx.music(LULLABY, .5);
    app.toast(tune ? "♪ Brahms' Lullaby, music-box edition" : "♪ (the sound is off, so Lumi hums it quietly)");
    if (lullabyBtn()) lullabyBtn().textContent = "■ stop the lullaby";
    // she flies to the bed (shrinking to bed size as she goes) and curls up on the blanket
    const W = world.clientWidth, H = world.clientHeight;
    me.tx = PILLOW[0] * W - (lumi.offsetLeft + lumi.offsetWidth / 2);
    me.ty = PILLOW[1] * H - (lumi.offsetTop + lumi.offsetHeight * .9);
    if (!me.raf) me.raf = requestAnimationFrame(glide);
    clearTimeout(nap);
    nap = setTimeout(() => {
      if (!bedtime) return;
      asleep = true;
      setLights(false, false);
      const p = $("p", card);
      if (lullabyBtn() && p) p.textContent = "zzz… Lumi fell asleep. her antennae stay on as a night light. (tap the attic to wake her.)";
      if (lullabyBtn()) lullabyBtn().textContent = "☀️ wake Lumi up";
    }, reduceMotion ? 0 : 1800);
  }
  function wakeUp(quiet = false) {
    if (!bedtime) return;
    bedtime = asleep = false;
    clearTimeout(nap);
    if (tune) { tune.stop(); tune = null; }
    stage.classList.remove("bedtime");
    setLights(wasLit, false);
    feel("starry", true);
    if (quiet) return;
    follow(.5, .8);
    sfx.play.pop();
    if (lullabyBtn()) lullabyBtn().textContent = "♪ play the lullaby";
    app.toast("Lumi: *yawn* …i wasn't asleep. (i was asleep.)");
  }

  app.onView("attic2", () => {
    setLights(lit);
    hang(store.get("painting", null));
    render();
    recenter();
    if (card.hidden || !card.innerHTML.trim()) say("look around", phone.matches
      ? "drag to look around. tap to send Lumi flying. tap the glowing things to find her five hobbies. (the window is a bonus.)"
      : "move around and Lumi follows. tap the glowing things to find her five hobbies. (the window is a bonus.)");
    if (card.querySelector("h2")?.textContent === "look around") {
      intro = true;
      if (phone.matches) setTimeout(() => { if (intro) card.hidden = true; }, 6000);
    }
    app.look();
    if (!reduceMotion && !wander) wander = setInterval(stroll, 5200);
  }, () => { wakeUp(true); aim(0, 0); stage.classList.remove("steered"); clearInterval(wander); wander = 0; app.a2quests.stop(); });
})();
