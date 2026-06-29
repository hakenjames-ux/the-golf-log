# Log My Golf

Track your golf scores, handicap and rounds. Follow other golfers and compete.
Live at **[logmygolf.com](https://logmygolf.com)**.

A no-build static web app (PWA) backed by Supabase, deployed on Vercel.

## Project structure

```
index.html              HTML shell (markup only) + <head> + script/style links
css/
  styles.css            All styles
js/                     App logic — plain (non-module) scripts, loaded IN ORDER.
                        They share global scope, so load order matters.
  config.js             Supabase keys + global state
  boot.js               App boot + global click event-delegation
  auth.js               Sign in / register / log-form expanders
  rounds.js             Log/edit a round, course search, data load, handicap
  courses.js            Course browser + add-course modal
  dashboard.js          Home dashboard, leaderboard, render helpers
  stats.js              Stats page + round calendar
  profile.js            Profile, profile nav, onboarding
  social.js             Social feed, societies, match play, monthly medal
  share.js              Shareable round card (canvas) + milestone celebrations
  reviews-weather.js    Course reviews, course/round photos, weather
  ui.js                 Dark mode, mobile nav, counters, print/PDF, pull-to-refresh
sw.js                   Service worker (offline + installable)
manifest.json           PWA manifest
privacy.html            Privacy policy
terms.html              Terms of service
icons/                  Generated app icons + OG share image
assets/                 Icon source SVGs + generators
supabase/
  functions/            Edge functions (delete-account)
  migrations/           SQL migrations
scripts/build.mjs       Bundles the site into dist/ for Capacitor (native apps)
capacitor.config.ts     iOS/Android wrapper config
LAUNCH.md               Launch + app-store guide
```

## Deploying

Push to `main` → Vercel auto-deploys to logmygolf.com.

> ⚠️ This is a **static site** served from the repo root. `vercel.json` pins
> that (no install, no build, `outputDirectory: "."`). Don't remove it — without
> it, Vercel sees `package.json` and tries to build, which fails.

## Local development

It's static, so just serve the folder:

```bash
npx serve .        # or: python3 -m http.server
```

`package.json` exists only for tooling (icon generation + Capacitor), not for a
web build.

### Regenerate icons
```bash
npm run icons      # from assets/icon-master.svg → icons/*.png
```

### Native apps (Capacitor)
See [LAUNCH.md](LAUNCH.md) §3. `npm run build` copies the site into `dist/`
(Capacitor's `webDir`); `npm run cap:ios` / `npm run cap:android` build the shells.

## Adding JS

Because the `js/` files are classic scripts sharing global scope:
- Functions/`var`/`const` declared in one file are visible to later files.
- If you add a new file, insert its `<script src>` tag in `index.html` in the
  right load order, and add it to `PRECACHE` in `sw.js` (and bump `VERSION`).
