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

- **Home:** Lumi itself. Tap Lumi to poke it, but not too much: it gets hurt, then flops. Feed it a cookie to bring it back, or pick a mood. It falls asleep if you leave, its eyes follow your cursor or finger, and it remembers your visits.
- **Hobbies:** six half-finished projects with "under construction" progress cards. You can suggest a new hobby too.
- **Hobby room:** a dark room where Lumi's lantern follows your cursor (or your taps) and finds the hobbies.
- **Play: Star Catch:** a mini game in five short levels. Catch falling stars, dodge raindrops, and catch cookies to heal.
- **Story:** six scenes. The last one lights the lantern, and the light spreads over the whole site.
- **Guestbook**, a **museum of useless facts**, the **about** page (character sheet), and **credits** with a visitor odometer.
- Moth-dust sparkle trail, click sounds with a mute button, and two hidden secrets.

## Run it

No build step. Open `index.html`, or serve the folder:

```
py -m http.server 8000
```

## Files

- `index.html`: every screen (the URL hash picks which one shows)
- `css/style.css`: the layout and look
- `js/core.js`: storage, sound, toasts, counters, eye-follow and the router
- `js/home.js`, `js/hobbies.js`, `js/game.js`, `js/pages.js`: one file per part of the site
- `js/lumi.js` and `css/lumi.css`: Lumi's art and motion. `sticker(mood)` draws Lumi in 18 moods. These are copied from `design/lumi-stickers.html` by `node tools/sync-art.mjs`.
- `design/`: Lumi's reference art and the pages the SVG was drawn and checked in

## Credits

- Lumi is an original character by Lumi's human.
- Lumi's reference sketches were made with ChatGPT image generation, and Lumi was then drawn as SVG code with Claude.
- Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka) and [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand), SIL Open Font License.
- Sounds are synthesized in the browser with the Web Audio API. No audio files and no libraries.
