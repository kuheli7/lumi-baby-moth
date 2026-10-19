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

One calm screen at a time on a starry night. Five tabs at the bottom (home, hobbies, play, story, guestbook) and a menu for every other page. The URL hash picks the screen, so every page can be linked to.

### Pages

| Page | What it is |
| --- | --- |
| **Home** | Lumi itself, flying around its patch of night sky |
| **Talk to Lumi** | a chat page where Lumi answers in its own voice |
| **About Lumi** | the 5-point character sheet above, with a portrait |
| **Character sheet** | everything needed to draw Lumi again |
| **Hobbies** | six half-finished projects, with a filter and a suggestion box |
| **Lumi's attic** | a lit 3D diorama of Lumi's attic that leans with your pointer |
| **Dress up Lumi** | string a bead necklace for Lumi to wear |
| **Play (Star Catch)** | a five-level mini game, plus a space level hidden in the attic |
| **Story** | six scenes with a lantern finale |
| **Guestbook** | notes from visitors, shared between everyone |
| **Museum of useless facts** | 14 facts, each with its own illustration |
| **Credits** | who made what, plus counters and secrets |

### Home

- Lumi flies around its patch of sky. Tap the sky and it chases the light (it's a moth). Tap Lumi to poke it, but not too much: it gets hurt, then **flops**.
- **Feed a cookie** drops one from the sky and Lumi swoops to catch it (phones buzz a little). A row of slots shows the cookies eaten today.
- A **mood picker** with 18 moods. The sky changes with the mood: warm, pink, sleepy or rainy.
- Lumi lands on its cloud to sleep when it is sleepy, sad, hurt or flopped, or if you leave the screen quiet for 40 seconds.
- Its eyes follow your cursor or finger everywhere on the site.
- It remembers your visits and greets you differently the first time, when you come back, and after days away.
- It notices when you **resize the window or turn your phone**: the site has seven "editions" (pocket, phone, nap mode, storybook, widescreen, CinemaScope and tower), each with its own scenery, tagline and line from Lumi. The home page shows which edition you are in, and the "best viewed at" badge shows your window size.
- A visitor counter (an odometer) and a "cookies eaten" total.

### Talk to Lumi

Not an AI. Lumi answers by rules: the first topic whose words show up in what you typed picks the reply, and Lumi's face changes to match. It covers hellos and goodbyes, how it feels, cookies, hobbies, its lantern, the attic, sleep and the time of day, jokes, facts, games, songs, kind words and rude ones (those hurt). It remembers your name if you tell it. Suggestion chips below the chat show what you could say, and a few take you to other pages. A flopped Lumi only wants cookies and apologies.

### Hobbies

- Six hobbies as picture cards with a status, a progress bar and an "under construction" badge: watercolor moons, a resin jar of stars, dew-drop bead jewellery, the guitar (one string), the museum of useless facts, and this very website.
- **Filter chips** by category (all, creative, crafty, collecting, music, exploring).
- **Suggest a new hobby** and it joins the list at 0%. Lumi has not started it.
- A sleepy Lumi rests on top of the panel (it scales with the screen).
- Pluck the one guitar string. Pluck it three times quickly for Lumi's Greatest Hit.
- A banner leads into the attic.

### Lumi's attic

The attic as a little 3D diorama. The room is cut into flat layers at different depths and the whole stage leans toward your pointer, so near things slide over far ones while Lumi follows the pointer. Find the five hobbies (the paint easel, the guitar, the bead rack, the jar of stars and the museum shelf); each opens in its own card.

- **Paint** at the easel. The painting hangs framed on the attic wall and is remembered.
- **Learn the guitar** with short lessons: Lumi plays a phrase and you play it back, and the guitar grows from one string to six. Click the strings, or press `A S D F G H` (or `1`–`6`) on a keyboard.
- **Dress up Lumi** from the bead rack (its own page): string a bead necklace, and Lumi wears it all over the site, here too.
- Tap the **matchbox bed** and the lullaby starts (Brahms, made with Web Audio): Lumi shrinks to bed size, curls up on the pillow and the lights go down.
- Flick the **light switch**: in the dark, Lumi's antennae are the only light.
- Fly out of **the window** to the space level.
- On a phone it goes full-screen: drag to look around, tap to send Lumi flying.

The first attic, a dark room where a lantern followed your cursor, has been retired: its link (`#room`) now opens this one, but its code is still in `js/hobbies.js` and `index.html`.

### Play: Star Catch

A mini game in five short levels: First Light, Drizzle, Cookie Clouds, Windy Night and Starstorm. Catch falling stars, dodge raindrops, catch cookies to heal, hold on in the wind. Three drops and Lumi flops. Clearing the last level fills the lantern. Drag, or use the ← → keys; the game can be paused, and the levels you have unlocked are remembered. A sixth level, **Space Critters**, only opens from the attic window: the stars are lost (friendly) space critters and the raindrops are space rocks.

### Story

The "about me" book: six scenes that turn with a swipe, the scroll wheel or the arrow keys. Only the page turns: the back and next buttons and the page dots sit below the book, not on it. The last scene is a button that lights the lantern, and the light spreads over the whole site (the menu can switch it off again).

### Guestbook

Leave a name and a note (160 characters). Notes are shared between every visitor and kept in a Supabase table that visitors can only read and add to. If that can't be reached, notes go in a jar on your own device instead, so the page always works.

### Museum of useless facts

14 facts, each with its own little illustration drawn in the site's style (`js/fact-art.js`). "Next exhibit" moves along and the museum remembers where you were. The museum shelf in the attic shows a random fact and its picture in its card.

### Character sheet

One page with everything needed to draw Lumi again: the facts, four views (front, three-quarter, peeking and resting), the colour palette, the rules for drawing Lumi, and a sticker of all eighteen moods.

### Little things

- A **moth-dust** sparkle trail that follows your pointer (a button in the menu turns it off).
- Soft click sounds on every button, all made with the Web Audio API, and a mute button that is remembered.
- **Three hidden secrets** (the credits page keeps count): one for typing `cookie` anywhere, one for Lumi's Greatest Hit on the one string, and one for flying out of the attic window.
- Retro web badges on the credits page ("best viewed at 3 AM").
- It respects *reduce motion*, works with a keyboard, and uses real buttons, labels and live regions.
- Your name, painting, necklace, cookies, game progress, hobbies and chat are saved in your browser's storage, and the site still works if that is blocked.

## Made to run well

- Plain HTML, CSS and JS: no libraries and no build step.
- Tested on a real phone while building, plus tablet and desktop sizes, keyboard-only use and *reduce motion*; the browser console stays free of errors.
- Every page keeps to about 150 words or fewer. The story is told with pictures and motion, not walls of text.
- The mute button is always on screen, and sound never starts until you tap something.

## Run it

No build step. Open `index.html`, or serve the folder:

```
py -m http.server 8000
```

## Files

- `index.html`: every screen (the URL hash picks which one shows)
- `css/lumi.css`: Lumi's motion. `css/style.css`: the layout and look. `css/attic2.css`, `css/sheet.css` and `css/chaos.css` style the attic, the character sheet and the background scenery.
- `js/lumi.js`: Lumi's art. `sticker(mood)` draws Lumi in 18 moods. It is copied from `design/lumi-stickers.html` by `node tools/sync-art.mjs`.
- `js/core.js`: storage, sound, toasts, counters, the necklace, eye-follow, secrets and the router
- `js/chaos.js`: the screen-shape editions and their scenery
- `js/home.js`: Lumi flying, moods, cookies, dozing and remembering you
- `js/chat.js`: Talk to Lumi (rule-based replies)
- `js/hobbies.js`: the hobbies page, and the retired lantern attic
- `js/dress.js`: the dress-up page
- `js/attic2.js` and `js/attic2-quests.js`: the attic (the diorama, and its easel, guitar and lesson cards)
- `js/sheet.js`: the character sheet page
- `js/game.js`: Star Catch
- `js/pages.js`: the story, guestbook, museum, about, credits, menu, moth dust and the cookie secret
- `js/fact-art.js`: the 14 museum illustrations, as SVG strings
- `design/`: Lumi's reference art and the pages the SVG was drawn and checked in (`lumi-stickers.html` is the source the site's art is copied from; the others are style pickers and emote sets), plus expression references and inspiration boards
- `tools/sync-art.mjs`: copies the art from `design/lumi-stickers.html` into the site
- `og.png` and `favicon.svg`: the link preview and the tab icon
- `writeup-draft.md` and `haX.baby-brief-and-audit.docx`: the hackathon write-up draft and the brief

## Credits

- Lumi is an original character by Lumi's human.
- Lumi's reference sketches were made with ChatGPT image generation, and Lumi was then drawn as SVG code with Claude. The attic, the hobby icons, the necklace and the museum illustrations are hand-written SVG code too (no generated images).
- Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka) and [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand), SIL Open Font License.
- Sounds are synthesized in the browser with the Web Audio API. No audio files and no libraries. The lullaby is Brahms' Lullaby and the guitar lessons teach Twinkle, Twinkle (both traditional, public domain).
- The shared guestbook runs on [Supabase](https://supabase.com).
