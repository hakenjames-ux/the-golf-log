# Backend Hardening

Bulletproofing for the Supabase backend. Three areas — apply in this order.

---

## 1. Hardening v2 migration

File: `supabase/migrations/20260630160000_backend_hardening_v2.sql`

What it does (all verified against the live schema first):
- **Storage limits** — caps `avatars` at 2 MB and `course-photos` at 10 MB, and restricts both to image types. (They previously had *no* size or type limit.)
- **Foreign-key delete rules** — 9 FKs to `auth.users` were `NO ACTION`, so deleting a user only worked because the edge function deleted those rows first. Now: community content (`courses`, `matches`, `societies`, `tournaments`) → `SET NULL` (survives, loses attribution); personal/relationship rows (`tournament_entries`, `challenges`) → `CASCADE`.
- **Unique constraints** — stops duplicate `follows` / `round_likes` / `favourites` / `society_members`.

### Apply order ⚠️
1. **Merge + deploy the web app first** (the avatar upload now sends a fallback content-type so the new image-only restriction can't reject an iOS HEIC avatar).
2. **Then** run the migration: Supabase → SQL Editor → paste the file → Run. (Or `supabase db push`.)

---

## 2. Nightly backups (free-plan DR)

File: `.github/workflows/db-backup.yml` — a nightly `pg_dump` kept as a 30-day GitHub artifact. A safety net against a bad migration or accidental delete (you're on the free plan, which has no point-in-time recovery).

### One-time setup
1. Supabase → **Settings → Database → Connection string → "Session pooler"** → copy the URI.
2. GitHub repo → **Settings → Secrets and variables → Actions** → new secret `SUPABASE_DB_URL` = that URI.
3. Actions tab → **Nightly DB backup → Run workflow** to test it now.

### To restore
Download the artifact, then:
```bash
gunzip -c backup-YYYYMMDD-HHMMSS.sql.gz | psql "$SUPABASE_DB_URL"
```

> For true production DR, **Supabase Pro ($25/mo)** adds daily backups + 7-day PITR. The nightly dump is "better than nothing"; Pro is "bulletproof."

---

## 3. Signup abuse protection

### 3a. Email confirmation (do this now — zero code)
Supabase → **Authentication → Sign In / Providers → Email** → enable **"Confirm email."**
New users must click a link before the account is active → stops fake/typo emails.

### 3b. hCaptcha (stops bot signups)
> ⚠️ **Order matters.** The moment you enable captcha in Supabase, *every* `signUp`/`signIn` is rejected unless it includes a valid `captchaToken`. So deploy the client change **first**, then enable it in the dashboard.

**Step 1 — get keys:** create a free site at [hcaptcha.com](https://www.hcaptcha.com) → copy the **sitekey** (public) and **secret** (private).

**Step 2 — client:** in `index.html` add the hCaptcha script in `<head>`:
```html
<script src="https://js.hcaptcha.com/1/api.js" async defer></script>
```
Add a widget container to the register form (in `index.html`, inside `#registerForm`):
```html
<div class="h-captcha" data-sitekey="YOUR_SITEKEY"></div>
```
Pass the token when registering (in `js/auth.js`, where `sb.auth.signUp(...)` is called):
```js
var captchaToken = window.hcaptcha ? hcaptcha.getResponse() : undefined;
var res = await sb.auth.signUp({
  email: email, password: pass,
  options: { data: { display_name: name }, captchaToken: captchaToken }
});
if (window.hcaptcha) hcaptcha.reset();
```

**Step 3 — enable in Supabase:** **Authentication → Settings → Bot and Abuse Protection** → turn on **hCaptcha**, paste the **secret**. Test a signup on the live site.

---

## Status checklist
- [ ] Merge this PR (deploys the avatar upload fix)
- [ ] Apply the v2 migration (SQL Editor)
- [ ] Add `SUPABASE_DB_URL` secret + run the backup workflow once
- [ ] Enable email confirmation
- [ ] (Optional) Wire hCaptcha, then enable it in Supabase
- [ ] (Optional, biggest DR win) Upgrade to Supabase Pro for PITR
