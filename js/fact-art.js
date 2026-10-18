// Little hand-drawn pictures for the museum of useless facts: app.factArt(i) is the picture for fact number i,
// in the same order as the FACTS lists in pages.js and attic2.js. Same plum outline and soft colours as Lumi.
(() => {
  "use strict";
  const O = "#4b3b7c";
  const line = `stroke="${O}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
  const thin = `stroke="${O}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
  const star = (x, y, r, c = "#f6cf6a") => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${c}"/>`;
  const heart = (x, y, s, fill) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -2 C-3 -7 -10 -4 -6 2 L0 7 L6 2 C10 -4 3 -7 0 -2 Z" fill="${fill}" ${thin}/>`;
  const text = (x, y, s, t, fill = O, extra = "") => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Patrick Hand, Comic Sans MS, cursive" font-size="${s}" fill="${fill}" ${extra}>${t}</text>`;
  // a soft blob behind the picture, with a few stars
  const back = (c) => `<ellipse cx="110" cy="76" rx="98" ry="64" fill="${c}"/>${star(28, 30, 7)}${star(198, 36, 5, "#fff")}${star(190, 126, 6, "#c9a7ea")}`;
  // feathery antenna along a curve: barbs left and right of the stem
  const feather = (x0, y0, cx, cy, x1, y1) => {
    let s = `<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}" fill="none" ${line}/>`;
    for (let k = 1; k <= 6; k++) {
      const t = k / 7, u = 1 - t;
      const px = u * u * x0 + 2 * u * t * cx + t * t * x1, py = u * u * y0 + 2 * u * t * cy + t * t * y1;
      const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy), m = Math.hypot(dx, dy);
      const nx = -dy / m * 7, ny = dx / m * 7;
      s += `<path d="M${(px - nx).toFixed(1)} ${(py - ny).toFixed(1)}L${(px + nx).toFixed(1)} ${(py + ny).toFixed(1)}" fill="none" ${thin}/>`;
    }
    return s;
  };

  const ART = [
    // 1. the first website
    () => `${back("#e8e1fb")}
      <rect x="60" y="28" width="100" height="74" rx="10" fill="#d8d0e8" ${line}/>
      <rect x="69" y="37" width="82" height="54" rx="5" fill="#2f2750"/>
      ${text(110, 60, 12, "info.cern.ch", "#8fe0a5")}${text(110, 77, 11, "since 1991", "#f6cf6a")}
      <rect x="96" y="102" width="28" height="10" fill="#c3b8dd" ${line}/>
      <rect x="78" y="112" width="64" height="9" rx="4" fill="#d8d0e8" ${line}/>`,

    // 2. the webcam that watched a coffee pot
    () => `${back("#fde9d3")}
      <path d="M86 34q-6-8 0-14M102 34q-6-8 0-14" fill="none" stroke="#c9a7ea" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M72 52h46l-4 54a8 8 0 0 1-8 7H84a8 8 0 0 1-8-7z" fill="#fffaf0" ${line}/>
      <path d="M77 84h36l-2 22a6 6 0 0 1-6 5H85a6 6 0 0 1-6-5z" fill="#8a5a32"/>
      <path d="M117 64q22 2 18 24-2 12-14 12" fill="none" ${line}/>
      <rect x="69" y="42" width="52" height="11" rx="5" fill="#a34063" ${line}/>
      <rect x="140" y="26" width="44" height="30" rx="8" fill="#c3b8dd" ${line}/>
      <circle cx="162" cy="41" r="9" fill="#2f2750" ${line}/><circle cx="159" cy="38" r="2.6" fill="#fff"/>
      <path d="M162 56v14M148 72h28" fill="none" ${line}/>`,

    // 3. luna moths have no working mouth
    () => `${back("#e2f4e6")}
      <path d="M108 70C80 30 40 40 44 74c2 18 36 22 64 8z" fill="#c8ecc9" ${line}/>
      <path d="M112 70c28-40 68-30 64 4-2 18-36 22-64 8z" fill="#c8ecc9" ${line}/>
      <path d="M106 82C80 96 70 118 54 136c24-2 46-22 54-44z" fill="#b6e2b9" ${line}/>
      <path d="M114 82c26 14 36 36 52 54-24-2-46-22-54-44z" fill="#b6e2b9" ${line}/>
      <circle cx="74" cy="66" r="9" fill="#fff6ea" ${thin}/><circle cx="74" cy="66" r="4" fill="#a993d6"/>
      <circle cx="146" cy="66" r="9" fill="#fff6ea" ${thin}/><circle cx="146" cy="66" r="4" fill="#a993d6"/>
      <ellipse cx="110" cy="82" rx="8" ry="22" fill="#fffaf0" ${line}/>
      <circle cx="110" cy="56" r="10" fill="#fffaf0" ${line}/>
      <circle cx="106" cy="55" r="1.8" fill="${O}"/><circle cx="114" cy="55" r="1.8" fill="${O}"/><path d="M107 61h6" fill="none" ${thin}/>
      <path d="M105 48q-6-12-14-14M115 48q6-12 14-14" fill="none" ${thin}/>
      <circle cx="170" cy="28" r="10" fill="#e0a466" ${line}/><path d="M162 36 178 20" stroke="#d5476b" stroke-width="3.6" stroke-linecap="round"/>`,

    // 4. moth dust is tiny scales
    () => `${back("#f3e6fa")}
      <clipPath id="fa-lens"><circle cx="138" cy="68" r="37"/></clipPath>
      <path d="M26 102C30 52 76 24 118 34c-8 36-38 62-92 68z" fill="#f4c9a8" ${line}/>
      <circle cx="62" cy="76" r="5" fill="#fff6ea"/><circle cx="84" cy="58" r="4" fill="#fff6ea"/>
      <circle cx="138" cy="68" r="37" fill="#fffaf0"/>
      <g clip-path="url(#fa-lens)" ${thin}>${[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => `<ellipse cx="${106 + c * 15 + (r % 2) * 7}" cy="${40 + r * 13}" rx="10" ry="8" fill="${["#f4c9a8", "#f6cf6a", "#f4a6b8"][(r + c) % 3]}"/>`).join("")).join("")}</g>
      <circle cx="138" cy="68" r="37" fill="none" ${line}/>
      <path d="M165 96l26 28" stroke="#8a5a32" stroke-width="9" stroke-linecap="round"/><path d="M165 96l26 28" stroke="${O}" stroke-width="2" stroke-linecap="round" opacity=".5"/>`,

    // 5. tiger moths jam a bat's sonar
    () => `${back("#dde6f7")}
      <path d="M54 68C34 52 26 64 16 60c6 22 20 20 26 28 4-8 8-10 12-10z" fill="${O}"/>
      <path d="M74 68c20-16 28-4 38-8-6 22-20 20-26 28-4-8-8-10-12-10z" fill="${O}"/>
      <ellipse cx="64" cy="74" rx="13" ry="14" fill="#6a579e" ${line}/>
      <path d="M55 62l-3-12 10 6zM73 62l3-12-10 6z" fill="#6a579e" ${line}/>
      <circle cx="59" cy="72" r="2" fill="#fff"/><circle cx="69" cy="72" r="2" fill="#fff"/>
      <path d="M122 54q10 18 0 36M134 46q16 26 0 52" fill="none" stroke="#8fc3e8" stroke-width="3" stroke-linecap="round"/>
      <path d="M52 40q-6-8 2-14M44 46q-12-8-2-24" fill="none" stroke="#8fc3e8" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
      <path d="M178 76c-14-16-34-12-36 2 6 10 24 12 36-2zM178 76c-4 8-22 20-32 12 4-8 12-12 32-12z" fill="#f4c9a8" ${line}/>
      <ellipse cx="176" cy="76" rx="5" ry="10" fill="#fffaf0" ${line}/>
      ${text(160, 50, 14, "click! click!", "#d5476b")}`,

    // 6. moths smell with their antennae
    () => `${back("#fff0c9")}
      ${feather(100, 72, 82, 44, 62, 36)}${feather(120, 72, 138, 44, 158, 36)}
      <circle cx="62" cy="36" r="15" fill="#f6cf6a" opacity=".35"/><circle cx="62" cy="36" r="8" fill="#f6cf6a" ${thin}/>
      <circle cx="158" cy="36" r="15" fill="#f6cf6a" opacity=".35"/><circle cx="158" cy="36" r="8" fill="#f6cf6a" ${thin}/>
      <ellipse cx="110" cy="100" rx="38" ry="32" fill="#fffaf0" ${line}/>
      <circle cx="96" cy="98" r="5.5" fill="${O}"/><circle cx="124" cy="98" r="5.5" fill="${O}"/>
      <circle cx="94" cy="96" r="1.8" fill="#fff"/><circle cx="122" cy="96" r="1.8" fill="#fff"/>
      <ellipse cx="84" cy="110" rx="7" ry="4.5" fill="#f4a6b8" opacity=".8"/><ellipse cx="136" cy="110" rx="7" ry="4.5" fill="#f4a6b8" opacity=".8"/>
      <path d="M106 112q4 4 8 0" fill="none" ${thin}/>`,

    // 7. octopuses have three hearts
    () => `${back("#fbd9e3")}
      ${[[78, -14], [94, -6], [110, 0], [126, 6], [142, 14]].map(([x, d]) => `<path d="M${x} 88q${d} 18 ${d / 2} 30q-4 10 ${-d / 2} 4" fill="none" stroke="${O}" stroke-width="15" stroke-linecap="round"/><path d="M${x} 88q${d} 18 ${d / 2} 30q-4 10 ${-d / 2} 4" fill="none" stroke="#f08fa6" stroke-width="10" stroke-linecap="round"/>`).join("")}
      <path d="M68 90C62 34 158 34 152 90z" fill="#f08fa6" ${line}/>
      <circle cx="94" cy="72" r="7" fill="#fff"/><circle cx="126" cy="72" r="7" fill="#fff"/>
      <circle cx="95" cy="73" r="3.6" fill="${O}"/><circle cx="125" cy="73" r="3.6" fill="${O}"/>
      <ellipse cx="82" cy="84" rx="6" ry="4" fill="#fff" opacity=".6"/><ellipse cx="138" cy="84" rx="6" ry="4" fill="#fff" opacity=".6"/>
      ${heart(84, 28, 1.5, "#d5476b")}${heart(110, 20, 1.7, "#d5476b")}${heart(136, 28, 1.5, "#d5476b")}`,

    // 8. a day on Venus is longer than its year
    () => `${back("#fdecc8")}
      <clipPath id="fa-venus"><circle cx="66" cy="76" r="40"/></clipPath>
      <circle cx="66" cy="76" r="40" fill="#f6d58a"/>
      <g clip-path="url(#fa-venus)" fill="none" stroke="#e9b266" stroke-width="7" stroke-linecap="round"><path d="M20 62q46-12 92 4"/><path d="M20 82q46-10 92 4"/><path d="M24 102q42-8 84 2"/></g>
      <circle cx="66" cy="76" r="40" fill="none" ${line}/>
      <rect x="120" y="48" width="72" height="16" rx="8" fill="#f4a6b8" ${line}/>${text(156, 43, 13, "1 year")}
      <rect x="120" y="86" width="84" height="16" rx="8" fill="#c9a7ea" ${line}/>${text(162, 120, 13, "1 day")}`,

    // 9. wombats and their cube-shaped poop
    () => `${back("#f1e4d3")}
      <ellipse cx="104" cy="88" rx="46" ry="28" fill="#b98a62" ${line}/>
      <rect x="66" y="104" width="13" height="16" rx="6" fill="#9a6f4b" ${line}/><rect x="90" y="108" width="13" height="14" rx="6" fill="#9a6f4b" ${line}/>
      <rect x="116" y="108" width="13" height="14" rx="6" fill="#9a6f4b" ${line}/><rect x="138" y="102" width="13" height="16" rx="6" fill="#9a6f4b" ${line}/>
      <ellipse cx="62" cy="82" rx="22" ry="20" fill="#b98a62" ${line}/>
      <circle cx="50" cy="64" r="7" fill="#9a6f4b" ${line}/><circle cx="74" cy="64" r="7" fill="#9a6f4b" ${line}/>
      <circle cx="56" cy="78" r="2.6" fill="${O}"/><circle cx="70" cy="78" r="2.6" fill="${O}"/>
      <ellipse cx="62" cy="90" rx="8" ry="5.5" fill="${O}"/>
      ${[[170, 112], [186, 112], [178, 96]].map(([x, y]) => `<path d="M${x - 8} ${y - 8}h16v16h-16z" fill="#8a5a32" ${thin}/><path d="M${x - 8} ${y - 8}l5-5h16l-5 5z" fill="#b98a62" ${thin}/>`).join("")}`,

    // 10. the dot over an i or j is a tittle
    () => `${back("#f3e6fa")}
      <rect x="104" y="68" width="17" height="52" rx="7" fill="${O}"/>
      <rect x="148" y="68" width="17" height="42" rx="7" fill="${O}"/><path d="M156 106q0 18-16 18" fill="none" stroke="${O}" stroke-width="17" stroke-linecap="round"/>
      <circle cx="112" cy="46" r="13" fill="#f6cf6a" ${line}/><circle cx="157" cy="46" r="13" fill="#f6cf6a" ${line}/>
      <path d="M112 25v-8M96 31l-6-6M128 31l6-6" fill="none" stroke="#f6cf6a" stroke-width="3" stroke-linecap="round"/>
      ${text(62, 46, 17, "a tittle!", "#a34063")}
      <path d="M72 50q14 8 26 2M92 50l7 1-4 6" fill="none" stroke="#a34063" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,

    // 11. bananas are berries, strawberries are not
    () => `${back("#fff0c9")}
      <path d="M50 36C44 82 80 118 130 104c-34-2-56-26-56-66z" fill="#f6dc6a" ${line}/>
      <rect x="46" y="26" width="10" height="13" rx="3" fill="#8a5a32" ${line}/>
      <path d="M152 114c-24-14-26-48 0-52 26 4 24 38 0 52z" fill="#e8546f" ${line}/>
      <path d="M138 62l14 9 14-9-6-9-8 6-8-6z" fill="#6fbf7a" ${line}/>
      ${[[144, 80], [160, 80], [152, 92], [145, 100], [159, 100]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.6" fill="#f6dc6a"/>`).join("")}
      <circle cx="70" cy="124" r="10" fill="#8fcf9a" ${line}/><path d="M65 124l4 4 7-8" fill="none" ${line}/>
      <circle cx="152" cy="130" r="9" fill="#f4a6b8" ${line}/><path d="M147 125l10 10M157 125l-10 10" fill="none" ${line}/>`,

    // 12. sea otters hold paws while they sleep
    () => `${back("#dff0fb")}
      ${heart(110, 44, 1.6, "#f4a6b8")}
      <ellipse cx="72" cy="88" rx="38" ry="15" fill="#9a6f4b" ${line}/><circle cx="40" cy="78" r="15" fill="#9a6f4b" ${line}/><ellipse cx="40" cy="82" rx="10" ry="8" fill="#e8cfae"/>
      <ellipse cx="148" cy="88" rx="38" ry="15" fill="#9a6f4b" ${line}/><circle cx="180" cy="78" r="15" fill="#9a6f4b" ${line}/><ellipse cx="180" cy="82" rx="10" ry="8" fill="#e8cfae"/>
      <path d="M34 78h8M174 78h8" fill="none" ${thin}/><ellipse cx="40" cy="85" rx="3.6" ry="2.6" fill="${O}"/><ellipse cx="180" cy="85" rx="3.6" ry="2.6" fill="${O}"/>
      <circle cx="102" cy="74" r="6" fill="#7a5638" ${line}/><circle cx="118" cy="74" r="6" fill="#7a5638" ${line}/>
      <path d="M8 94q13-9 26 0t26 0 26 0 26 0 26 0 26 0 26 0 26 0V140H8z" fill="#8fc3e8" ${line}/>
      <path d="M30 112q10-6 20 0M96 120q10-6 20 0M160 112q10-6 20 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,

    // 13. watercolor paint is held together by gum arabic from acacia trees
    () => `${back("#e2f4e6")}
      <path d="M50 124c0-26 6-34 2-52M52 86c10-4 22-8 34-16" fill="none" stroke="#8a5a32" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="46" cy="56" rx="32" ry="12" fill="#8fcf9a" ${line}/><ellipse cx="82" cy="64" rx="22" ry="9" fill="#a7dcae" ${line}/>
      <path d="M60 90q-4-8 0-12 4 4 0 12z" fill="#f2b450" ${thin}/><path d="M66 92h12m-4-4 4 4-4 4" fill="none" stroke="#f2b450" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M118 66C146 42 194 54 188 88c-4 22-30 20-34 8s-16-4-20 4c-6 12-26 0-22-18 1-6 4-12 6-16z" fill="#f2dcb9" ${line}/>
      <circle cx="140" cy="62" r="6" fill="#e8546f"/><circle cx="158" cy="58" r="6" fill="#f6cf6a"/><circle cx="174" cy="68" r="6" fill="#8fc3e8"/><circle cx="130" cy="80" r="6" fill="#a993d6"/>
      <path d="M150 124l30-36" stroke="#8a5a32" stroke-width="5" stroke-linecap="round"/><ellipse cx="183" cy="84" rx="4" ry="8" transform="rotate(40 183 84)" fill="#8fc3e8" ${thin}/>`,

    // 14. a parliament of owls (a hackathon of night owls)
    () => `${back("#e8e1fb")}
      ${text(110, 32, 14, "a hackathon of owls", "#a34063")}
      <path d="M22 118q88 6 176 0" fill="none" stroke="#8a5a32" stroke-width="7" stroke-linecap="round"/>
      ${[[62, "#b98a62"], [110, "#9a6f4b"], [158, "#c9a27c"]].map(([x, c]) => `
        <path d="M${x - 16} 56l4-12 8 6zM${x + 16} 56l-4-12-8 6z" fill="${c}" ${line}/>
        <ellipse cx="${x}" cy="82" rx="18" ry="26" fill="${c}" ${line}/>
        <circle cx="${x - 7}" cy="70" r="8" fill="#fffaf0" ${thin}/><circle cx="${x + 7}" cy="70" r="8" fill="#fffaf0" ${thin}/>
        <circle cx="${x - 7}" cy="71" r="3.6" fill="${O}"/><circle cx="${x + 7}" cy="71" r="3.6" fill="${O}"/>
        <path d="M${x - 3} 77l3 5 3-5z" fill="#f6cf6a" ${thin}/>
        <rect x="${x - 12}" y="98" width="24" height="15" rx="3" fill="#2f2750" ${thin}/><rect x="${x - 9}" y="101" width="18" height="9" rx="1.5" fill="#8fe0a5"/>`).join("")}`,
  ];

  app.factArt = (i) => {
    const draw = ART[((i % ART.length) + ART.length) % ART.length];
    return `<svg viewBox="0 0 220 150" role="img" aria-label="a little picture for this fact" xmlns="http://www.w3.org/2000/svg">${draw()}</svg>`;
  };
  app.factArtCount = ART.length;
})();
