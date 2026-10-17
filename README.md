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

## What's on the page

The site is a retro desktop on a starry night. Every section is a window you can minimize, close and reopen, and drag around on big screens.

- **lumi.exe:** Lumi reacts to you. Poke it to make it giggle, but poke it too much and it gets hurt, then flops. Drag a cookie from the jar to bring it back (tapping a cookie works too). Leave it alone and it falls asleep. Its eyes follow your cursor or finger.
- **hobby_room.exe:** a dark room where your cursor is Lumi's lantern. Find five half-finished hobbies, each with an "under construction" progress card.
- **story.txt:** a six-page storybook. The last page lights the lantern, and the light spreads over the whole site.
- **museum_of_useless_facts.exe**, a **guestbook**, a cookie odometer, a visit counter, and Lumi remembers when you come back.
- Moth-dust sparkle trail, click sounds with a mute button, and two hidden secrets.

## Run it

No build step. Open `index.html`, or serve the folder:

```
py -m http.server 8000
```

## Files

- `index.html`: the page
- `css/style.css`: the desktop, the windows and everything around them
- `css/lumi.css` and `js/lumi.js`: Lumi's art and motion (`lumi(mood)` returns an SVG for one of eight moods)
- `js/main.js`: the interactions
- `design/`: Lumi's reference art and the SVG design pages it was built from

## Credits

- Lumi is an original character by Lumi's human.
- Lumi's reference sketches were made with ChatGPT image generation, and Lumi was then drawn as SVG code with Claude.
- Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka) and [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand), SIL Open Font License.
- Sounds are synthesized in the browser with the Web Audio API. No audio files and no libraries.
