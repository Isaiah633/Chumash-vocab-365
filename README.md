# Chumash Vocab 365 — Multi-User Edition

A mobile-friendly Biblical Hebrew flashcard app with real spaced repetition
(SM-2), email sign-in, and per-user progress tracking. Each person signs in
with their email (a magic link — no passwords), and their streak, reviews,
and settings are saved to their own account.

**Stack:** Next.js (App Router + TypeScript) · Supabase (Auth + Postgres) ·
deployed on Vercel + Supabase Cloud, all on free tiers.

---

## Part 1 — Create your Supabase project (about 10 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
   (you can sign up with GitHub or email).
2. Click **New project**. Give it a name like `chumash-vocab-365`, set a
   database password (save it somewhere safe — you won't need it for this
   app, but Supabase asks for one), pick a region near you, and click
   **Create new project**. Wait a minute or two while it provisions.
3. **Create the database table.** In the left sidebar click **SQL Editor**,
   then **New query**. Open the file `supabase/migrations/001_study_state.sql`
   from this project, copy its entire contents, paste into the query box,
   and click **Run** (or press Ctrl/Cmd+Enter). You should see
   "Success. No rows returned."
   - This creates a `study_state` table (one row per user) and turns on
     Row Level Security so users can only ever read or change their own row.
4. **Check email sign-in is on.** In the sidebar click **Authentication**,
   then **Providers**. Make sure **Email** is enabled (it is by default).
   Nothing else to change — magic links work out of the box.
5. **Copy your API keys.** Go to **Project Settings** (gear icon) →
   **API**. Copy two values into a safe note:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (The `service_role` key is secret — the app never needs it. Don't
     paste it anywhere in this project.)

## Part 2 — Deploy to Vercel (about 10 minutes)

6. Put this project on GitHub: create a new repository at
   [github.com/new](https://github.com/new) and push this folder to it
   (`git init`, `git add .`, `git commit -m "initial"`,
   `git remote add origin <your-repo-url>`, `git push -u origin main`).
   Never commit a `.env` file — `.gitignore` already excludes it.
7. Go to [vercel.com](https://vercel.com), sign up (GitHub works well),
   and click **Add New → Project**. Import your GitHub repository.
8. Before deploying, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL from step 5
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key from step 5
9. Click **Deploy**. After a minute or two you'll get a public URL like
   `https://chumash-vocab-365.vercel.app`.

## Part 3 — Connect the sign-in redirect (2 minutes)

10. Back in Supabase, go to **Authentication → URL Configuration**.
    Under **Redirect URLs**, click **Add URL** and paste:
    `https://YOUR-APP-URL.vercel.app/auth/callback`
    (replace with your real Vercel URL from step 9), then **Save**.
    - Without this, Supabase will refuse to send users back to your app
      after they tap the email link.
11. Open your app URL. Enter your email, tap the magic link in the
    email, and you're in — study away. Your progress saves to your
    account automatically.

## Running locally (optional)

```bash
npm install
cp .env.example .env.local   # then fill in your two Supabase values
npm run dev                  # open http://localhost:3000
```

For local sign-in links to work, also add
`http://localhost:3000/auth/callback` to the Supabase Redirect URLs
(step 10).

## How it works

- **Auth:** Supabase email OTP (magic link). No passwords are stored
  anywhere. Routes are protected by `middleware.ts` — signed-out visitors
  are redirected to `/login`.
- **Data:** one `study_state` row per user (`user_id` → `auth.users.id`),
  storing `{ started, lastStudy, streak, newPerDay, cards, gradeLog }`.
  Row Level Security guarantees users can only access their own row.
- **Study engine:** `lib/srs.ts` implements SM-2 exactly:
  Again (relearn in 10 min, requeued up to 5×/session), Hard, Good, Easy,
  ease floor 1.3, intervals 1 → 6 → ivl × ease.
- **Content:** `lib/deck.ts` holds the 95-word starter deck (Genesis 1–2,
  Exodus 20). Hebrew spellings verified against Sefaria's public-domain
  Masoretic text; English glosses are original to this app.

## Costs

Supabase free tier and Vercel Hobby tier are both free and comfortably
cover a study group. Supabase's free tier includes enough monthly
magic-link emails for typical use; if you outgrow it, their pay-as-you-go
email is inexpensive.
