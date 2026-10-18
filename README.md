# Lumi's Night Shift 🏮

**Live site: https://kuheli7.github.io/lumi-baby-moth/**

The homepage of **Lumi**, a marshmallow-sized baby moth who starts a new hobby every night and never finishes any.
Built for the haX.baby *Baby's First Website* hackathon (Track 2: original character), 17–19 October 2026.

> “Ooh, shiny. New hobby.”

## Character sheet

1. **Name:** Lumi
2. **What they are:** a fuzzy baby moth. A chaotic, curious night owl. A cookie makes it happy in seconds; hurt feelings make it droop and cry, and if it gets worse it *flops* (plays dead, x_x) until someone feeds it.
3. **What they do:** Night-shift Hobby Hopper and Curator of Useless Facts.
4. **Their story:** hatched in a paint box under a desk lamp and has chased lights (and hobbies) ever since. The only thing it ever finished is the lantern it carries.
5. **Tagline:** “Ooh, shiny. New hobby.”

## What's on the site

One calm screen at a time on a starry night, with tabs at the bottom and a menu for the rest.

- **Home:** Lumi itself, flying around its patch of night sky. Tap the sky and it chases the light (it's a moth). Tap Lumi to poke it, but not too much: it gets hurt, then flops. "Feed a cookie" drops one from the sky and Lumi swoops to catch it (phones buzz a little). Pick a mood and the sky changes with it: warm, pink, sleepy or rainy. It lands on its cloud to sleep if you leave, its eyes follow your cursor or finger, it remembers your visits, and it notices when you resize the window ("best viewed at" your exact size).
- **Hobbies:** six half-finished projects as tiles with "under construction" progress cards, and a sleepy Lumi peeking over the top (it scales with the screen). You can suggest a new hobby too. From here you can step into either attic.
- **Lumi's attic:** a dark room where Lumi's lantern follows your cursor (or your taps) and finds the hobbies. Then you can do them with Lumi:
  - **paint** at the easel (with undo and redo), and the painting is framed on the attic wall;
  - **learn the guitar** with three short lessons: Lumi plays a phrase and you play it back, and the guitar grows from one string to six. Click the strings, or press `A S D F G H` (or `1`–`6`) on a keyboard;
  - **dress up Lumi** on a page of its own: a big Lumi with a tray of beads at the bottom (how many beads fit is worked out from the length of the neck), and Lumi then wears the necklace all over the site;
  - play the **lullaby** on the matchbox bed (a music box made with Web Audio), and Lumi carries the lantern to bed as a night light;
  - fly out of **the window** to the space level.
  Leave the attic quiet for half a minute and Lumi falls asleep mid-hobby.
- **Lumi's Attic 2:** the same attic rebuilt as a little 3D diorama. The room is cut into flat layers at different depths and the whole stage leans toward your pointer, so near things slide over far ones while Lumi follows the pointer. Find all five hobbies (the paint easel, the guitar, the bead rack, the jar of stars and the museum shelf); each opens in its own card, with its own copy of the paint and guitar games. There's a light switch, a window and a bed too. On a phone it goes full-screen and you drag to look around. Both attics share the painting and the guitar stars, but their code is separate (`js/attic2*.js` vs `js/hobbies.js`).
- **Play: Star Catch:** a mini game in five short levels. Catch falling stars, dodge raindrops, and catch cookies to heal. A sixth level, out of the attic window, has Lumi guide lost (friendly) space critters home.
- **Story:** the "about me" book, six scenes that turn with a swipe, the scroll wheel or the arrow keys. Only the page turns: the back and next buttons and the page dots sit below the book, not on it. The last scene lights the lantern, and the light spreads over the whole site.
- **Museum of useless facts:** 14 facts, each with its own little illustration drawn in the site's style (`js/fact-art.js`). The Attic 2 museum shelf shows a random one right in its card.
- **Character sheet:** one page with everything needed to draw Lumi again: the facts, the views, the palette, the drawing rules and a sticker sheet of every mood.
- **Talk to Lumi:** a chat page where Lumi answers in its own voice, with a face to match. It is not an AI: the first topic whose words appear in what you typed picks the reply, and suggestion chips show what you could say.
- **Guestbook**, the **about** page, and **credits** with a visitor odometer.
- **Responsive chaos:** the scenery behind the site changes with the shape of the screen (an "edition" for each shape), with soft drifting clouds. It is decoration only and never takes clicks.
- Moth-dust sparkle trail, click sounds with a mute button, and three hidden secrets.

## Run it

No build step. Open `index.html`, or serve the folder:

```
py -m http.server 8000
```

## Files

- `index.html`: every screen (the URL hash picks which one shows)
- `css/style.css`: the layout and look. `css/attic2.css`, `css/sheet.css` and `css/chaos.css` style Attic 2, the character sheet and the background scenery.
- `js/core.js`: storage, sound, toasts, counters, eye-follow and the router
- `js/home.js`, `js/hobbies.js`, `js/dress.js`, `js/game.js`, `js/pages.js`: one file per part of the site (`hobbies.js` is the lantern attic, `dress.js` the dress-up page, `pages.js` the story, guestbook, museum, about and credits)
- `js/attic2.js` and `js/attic2-quests.js`: Attic 2 (the diorama, and its easel, guitar and lesson cards)
- `js/chat.js`: the Talk to Lumi page (rule-based replies)
- `js/sheet.js`: the character sheet page. `js/chaos.js`: the screen-shape scenery.
- `js/fact-art.js`: the 14 museum illustrations, as SVG strings
- `js/lumi.js` and `css/lumi.css`: Lumi's art and motion. `sticker(mood)` draws Lumi in 18 moods. These are copied from `design/lumi-stickers.html` by `node tools/sync-art.mjs`.
- `design/`: Lumi's reference art and the pages the SVG was drawn and checked in
- `og.png` and `favicon.svg`: the link preview and the tab icon

## Credits

- Lumi is an original character by Lumi's human.
- Lumi's reference sketches were made with ChatGPT image generation, and Lumi was then drawn as SVG code with Claude. The museum illustrations and the necklace beads are SVG code too, drawn by hand in the same style (no generated images).
- Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka) and [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand), SIL Open Font License.
- Sounds are synthesized in the browser with the Web Audio API. No audio files and no libraries. The lullaby is Brahms' Lullaby and the guitar lessons teach Twinkle, Twinkle (both traditional, public domain).
