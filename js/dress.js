// Dress up Lumi: a page of its own with a big Lumi and a tray of beads at the bottom. The beads you string
// go on Lumi's neck as you tap them; "wear it" keeps the necklace so Lumi has it on all over the site.
// How many beads fit is worked out by the art (app.NECK_MAX) from the length of the neckline.
(() => {
  "use strict";
  const { $, sfx, restart } = app;

  const BEADS = [["#f6a9bd", "pink"], ["#e1707f", "berry"], ["#f4b68a", "peach"], ["#f6cf6a", "gold"],
    ["#a8d8a0", "mint"], ["#8fc3e8", "dew-drop blue"], ["#c9a7ea", "lilac"], ["#fffaf4", "pearl"]];
  // poses that have a neck for the necklace; tapping Lumi turns through them
  const POSES = ["starry", "thinking", "excited", "happy", "curious", "shy", "proud", "love"];
  let strung = [], pose = 0;

  const stage = $("#dress-stage"), count = $("#dress-count"), undo = $("#dress-undo"), fill = $("#dress-fill"),
    clear = $("#dress-clear"), wear = $("#dress-wear"), off = $("#dress-off");
  $("#dress-beads").innerHTML = BEADS.map(([c, n]) =>
    `<button class="bead" data-bead="${c}" style="--c:${c}" aria-label="add a ${n} bead" data-sfx="none"></button>`).join("");

  function draw() {
    stage.innerHTML = app.art(POSES[pose], false, strung);
    const worn = app.necklace(), same = !!worn && worn.join() === strung.join(), max = app.NECK_MAX;
    count.textContent = same ? `Lumi is wearing this one (${strung.length} beads)`
      : strung.length >= max ? `${max} of ${max} beads: the neck is full!`
      : strung.length ? `${strung.length} of ${max} beads`
      : "tap a bead to start";
    undo.disabled = clear.disabled = !strung.length;
    fill.disabled = strung.length >= max;
    wear.disabled = !strung.length || same;
    off.hidden = !worn;
    app.look();
  }
  const add = (color) => {
    if (strung.length >= app.NECK_MAX) { app.toast(`the neck is full (${app.NECK_MAX} beads). undo one to make room.`); return false; }
    strung.push(color);
    return true;
  };

  $("#dress-beads").addEventListener("click", (e) => {
    const bead = e.target.closest("[data-bead]");
    if (!bead || !add(bead.dataset.bead)) return;
    sfx.play.plip();
    draw();
    restart(stage, "bump");
  });
  stage.addEventListener("click", () => {
    pose = (pose + 1) % POSES.length;
    sfx.play.pop();
    draw();
  });
  undo.addEventListener("click", () => { strung.pop(); draw(); });
  clear.addEventListener("click", () => { strung = []; draw(); });
  // keeps adding the colours you have already used (or a rainbow, if there are none) until the neck is full
  fill.addEventListener("click", () => {
    const pattern = strung.length ? strung.slice() : BEADS.map(b => b[0]);
    for (let i = 0; strung.length < app.NECK_MAX; i++) strung.push(pattern[i % pattern.length]);
    sfx.play.shiny();
    draw();
    restart(stage, "bump");
  });
  wear.addEventListener("click", () => {
    app.wear(strung);
    sfx.play.shiny();
    app.toast("📿 Lumi is wearing your necklace! (go and see it on the home screen)");
    app.lumi.react("love", "is this… for me?? i'm never taking it off. (finished hobby count: still 1.)", 4000);
    draw();
  });
  off.addEventListener("click", () => {
    app.wear(null);
    strung = [];
    app.toast("Lumi took the necklace off and put it back in the bead tray.");
    draw();
  });
  addEventListener("lumi:wear", () => { if (app.view() === "dress") draw(); });

  app.onView("dress", () => {
    strung = (app.necklace() || []).slice();
    draw();
  });
})();
