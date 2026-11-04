# Ujkine Vesti

Filtered Serbian news on your phone: N1, Nova.rs, B92, Blic, Politika, RTS in one feed.
Filter by outlet and category, hide sponsored/betting items, mute words, read articles without page ads.

Zero dependencies. Needs Node 18+.

## Try it

    node test/demo.js        # full UI on sample feeds, no internet needed -> http://127.0.0.1:8099
    npm test                 # 4 tests: parsing, categories, ad flags, reader mode, SSRF guard
    npm start                # real feeds on :8080 (PORT env var to change)

## Put it on your Pixel

The phone needs a URL to reach the server. Pick one:

1. **Mac at home**: `npm start`, open `http://<mac-ip>:8080` on the phone (same Wi-Fi only; Chrome needs HTTPS to offer "Install app", so this path gives you a bookmark, not an installed app).
2. **Small host (recommended)**: deploy this folder to any Node host (Render, Fly.io, Railway). Start command `npm start`. HTTPS comes with it. On the phone: Chrome > menu > "Install app".

## Android app (built by GitHub, no Android Studio needed)

The app is the same UI, but the feeds are fetched on the phone itself (native HTTP, so no server and no CORS). Nothing to host.

1. Create an empty **private** GitHub repo and push this folder to `main`.
2. GitHub Actions (`.github/workflows/android.yml`) builds a signed `UjkineVesti.apk` (about 5 min) and publishes it as a **Release**. Re-run any time from the Actions tab > "Run workflow".
3. On the Samsung: open the repo's Releases page in Chrome, download `UjkineVesti.apk`, open it. Android asks once to allow "install unknown apps" for Chrome; allow it.
4. Updates: push a change, wait for the new release, download and open the new APK. It installs over the old one and keeps his settings (same signing key, rising version number).

Text size: the big **A-** / **A+** buttons at the top (6 levels, default already larger than normal). Remembered.

### Signing (read once)
`keystore/vesti.keystore` is committed so every build is signed with the same key; that is what lets an update install over the previous one. Its password is in `android/app/build.gradle`, so **keep the repo private**. This is fine for a family sideload app and not suitable for the Play Store. If you ever lose or change the keystore, the uncle has to uninstall before installing the next APK.

### If the build fails
Open the failed run in the Actions tab and send me the red step's log.

## Front page: "Najvažnije danas"

No outlet publishes a "most read" feed, so importance is estimated (`lib/top.js`): stories covered by several of the six outlets rank highest, then how prominently each outlet places them in its own feed, then recency. Single-outlet stories only make the list if the outlet puts them at the very top. Shown only when no filter or search is active.

## Reading articles

Tapping a story opens the **in-app reader**: headline, text and photos with scripts, ad blocks and "read also" teasers removed. "Otvori original" opens the real page as an in-app overlay (it still has the outlet's ads; use it only when the reader shows too little text).

## Video tab

Latest videos from each outlet's official YouTube channel (public channel feeds, no API key; channel ids in `lib/videos.js`). Tapping a video opens it in the YouTube app. None of the outlets' news feeds contain YouTube links; videos embedded in an article show up in the reader as a red "Pogledaj video na YouTube-u" button.

## Made for an older reader

Photos and one-line summaries are off by default (Settings switches), "Teme i pretraga" is folded behind one button, text has 7 sizes (default 1.3x) with A-/A+ also inside the article, and the screen shows nothing but the news while everything is healthy. Settings > "Pismo" converts the whole app, including article text, between Latin and Cyrillic (`public/cyr.js`; search works in both scripts). "Podeli" in an article, and under each video, opens the phone's share sheet (Viber, Line, ...). The Video tab includes YouTube Shorts.

Settings > "Javi problem Dušanu" opens the share sheet with a pre-filled message (app version, screen, which outlets are failing, last refresh), so the uncle only picks Viber and the contact.

## Outlet icons (family version)

Each outlet's own small icon is shown next to its name (`icon` in `lib/sources.js`). They are loaded from the outlets' websites when the app runs, never bundled, and fall back to a colored dot if they fail. Settings has a switch. These are the outlets' trademarks: fine for a private family app, but **remove them (set `logos` default to false or delete the `icon` fields) before any public Play listing**, and do not use them in store screenshots. The daily health report checks that every icon address still works.

## Screen theme

Follows the phone's light/dark setting by default. Settings > "Izgled ekrana" lets the reader force Light or Dark.

## B92

B92's feeds are thin ("Info" = world news for ~5h, "Najnovije" = last hour) and miss what B92 puts at the top of its homepage. The app merges both feeds and reads the homepage story blocks too (`lib/b92.js`: photo, description, "45 min" age).

## Review agents

Two read-only Claude agents live in `.claude/agents/`:
- `vesti-reviewer`: feed health, ad flags, categories, front page, build status, from the daily CI reports.
- `mobile-news-reviewer`: an experienced mobile-news product lead. Runs the app on phone-sized screens (tap targets, contrast, largest text, offline states, Serbian wording) and returns ranked fixes. Ask Claude Code in this repo: *"use the mobile-news-reviewer agent"*.

### Daily health reports

- GitHub Actions runs the **health report twice a day** (03:30 UTC = early morning in Serbia, 16:00 UTC = early morning in Hawaii) and on every push: feeds up/stale, images, uncategorized share, ad false positives/misses, front-page sanity. It lands on the `ci-logs` branch (`health.md`, `history/`).
- Ask Claude Code in this repo: *"use the vesti-reviewer agent"* and it reads those reports plus the code and returns a verdict, up to 5 ranked recommendations with proposed changes, and what to ignore.

## Browser / PWA version (optional)

Needs the Node server (`npm start`) on a host with HTTPS. Same UI, same filters, installs via "Add to Home screen".

## How it works

- `lib/sources.js` the six outlets and their feed URLs. If a feed URL stops working the server tries the alternates, then auto-discovers the feed from the outlet's homepage. Override with an env var, e.g. `FEED_B92=https://...`.
- `lib/classify.js` category tagging (URL section > feed tags > keywords) and ad detection (sponsored / promo / self-promo / betting).
- `app/engine.js` on-device version of the server (bundled into the APK by `scripts/build-web.js`).
- `lib/article.js` reader mode (best effort; paywalled or JS-rendered pages will say so and link to the original).
- Settings > "Stanje izvora" shows which feed URL each outlet is using, or what failed.

## Known limits

- Ads are removed at the **headline level** (sponsored items) and **article level** (reader mode). Banner ads on the outlets' own pages are only avoided when you read in-app.
- Categories are heuristic. Wrong ones are fixed by adding keywords in `lib/classify.js`.
- Nothing de-duplicates the same story across outlets yet.

## Daily schedule at a glance

| What | UTC | Serbia (winter / summer) | Hawaii |
|---|---|---|---|
| Health report 1 (before the relative's morning) | 03:30 | 04:30 / 05:30 | 17:30 (day before) |
| Health report 2 | 16:00 | 17:00 / 18:00 | 06:00 |
| Claude morning review (scheduled task) | 18:15 | 19:15 / 20:15 | 08:15 |

Serbia moves between UTC+1 and UTC+2 on the last Sundays of March and October; Hawaii never changes.
