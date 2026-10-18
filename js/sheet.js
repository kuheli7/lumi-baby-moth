// Character sheet: one page with everything needed to draw Lumi again: facts, views, palette, drawing rules and every mood.
(() => {
  "use strict";
  const { $ } = app;

  const FACTS = [
    ["Name", "Lumi"],
    ["Species", "a fuzzy baby moth, marshmallow-sized"],
    ["Job", "Night-shift Hobby Hopper and Curator of Useless Facts"],
    ["Home", "a paint box under a desk lamp, now a dark attic"],
    ["Personality", "chaotic, curious, a little sensitive"],
    ["Likes", "cookies, shiny things, lanterns, new hobbies"],
    ["Dislikes", "being poked too much, finishing things, rain"],
    ["Quirk", "plays dead (x_x) when hurt, until someone feeds it"],
    ["Prop", "the lantern: the only thing it ever finished"],
    ["Tagline", "“Ooh, shiny. New hobby.”"],
  ];
  const VIEWS = [["curious", "front"], ["determined", "three-quarter"], ["peek", "peeking"], ["sleepy", "resting"]];
  const PALETTE = [
    ["Fluff", C.fur], ["Fur edge", C.line], ["Peach wing", "#f8b9ac"], ["Lilac wing", "#dcc0f1"],
    ["Antenna", C.stalk], ["Blush", C.blush], ["Lantern glow", C.gold], ["Wing spot", C.spot],
  ];
  const RULES = [
    "A round cloud of cream fluff, with a soft peach-tan edge instead of a black outline.",
    "Two glowing gold bulbs on dark brown stems. They stay lit in every mood.",
    "Big glossy black eyes and pink blush. Starry and excited eyes get gold sparkles.",
    "Peach wing in front, lilac wing behind, each with one small spot.",
    "Cream fur paws and brown feet. One or two short tan dashes on the forehead.",
    "It holds its lantern when calm, and puts it down only to hug, eat or flop.",
  ];

  let drawn = false;
  app.onView("sheet", () => {
    $("#cs-hero").innerHTML = app.art("curious");
    app.look();
    if (drawn) return;
    drawn = true;
    $("#cs-facts").innerHTML = FACTS.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("#cs-views").innerHTML = VIEWS.map(([m, n]) => `<figure><img src="${app.artURL(m)}" alt="Lumi, ${n} view" width="200" height="200"><figcaption>${n}</figcaption></figure>`).join("");
    $("#cs-palette").innerHTML = PALETTE.map(([n, c]) => `<li><i style="background:${c}"></i><b>${n}</b><code>${c}</code></li>`).join("");
    $("#cs-rules").innerHTML = RULES.map(r => `<li>${r}</li>`).join("");
    $("#cs-moods").innerHTML = MOODS.map(m => `<li><img src="${app.artURL(m)}" alt="" loading="lazy" width="120" height="120"><span>${LABELS[m]}</span></li>`).join("");
  });
})();
