// Copies Lumi's art out of design/lumi-stickers.html into the site, unchanged.
// The design file is where the art is drawn and checked against the reference stickers;
// the site only takes its palette, helpers, sticker(mood) and motion CSS.
// usage: node tools/sync-art.mjs
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(new URL("../design/lumi-stickers.html", import.meta.url), "utf8").replace(/\r\n/g, "\n");

function between(start, end, keepEnd = false) {
  const a = src.indexOf(start);
  const b = src.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`marker not found: ${a < 0 ? start : end}`);
  return src.slice(a, keepEnd ? b + end.length : b).trimEnd() + "\n";
}

const js = between("// Palette sampled", "// What still differs");
// motion CSS: from its comment to the end of the reduced-motion block
const cssStart = src.indexOf("/* motion:");
const rm = src.indexOf("@media (prefers-reduced-motion", cssStart);
const css = src.slice(cssStart, src.indexOf("}\n", src.indexOf("}", rm) + 1) + 1).replace(/^ {2}/gm, "") + "\n";

writeFileSync(new URL("../js/lumi.js", import.meta.url),
  "// Lumi's art: palette, drawing helpers and sticker(mood), which returns an SVG string.\n" +
  "// Copied unchanged from design/lumi-stickers.html by tools/sync-art.mjs. Edit the design file, then re-run it.\n" + js);
writeFileSync(new URL("../css/lumi.css", import.meta.url),
  "/* Lumi's motion, copied unchanged from design/lumi-stickers.html by tools/sync-art.mjs.\n" +
  "   The SVG uses these class names, so the site's own styles avoid them. */\n" + css);
console.log(`js/lumi.js: ${js.split("\n").length} lines, css/lumi.css: ${css.split("\n").length} lines`);
