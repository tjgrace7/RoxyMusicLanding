# Roxy Music Signup Page — Setup & Deploy

This folder is a ready-to-deploy static site + one serverless function. Everything below is a one-time setup step on your end (I don't have access to your Mailchimp, GitHub, or Netlify accounts).

## 0. Push this folder to GitHub

1. If `git` isn't set up yet, running any `git` command will prompt "install Xcode Command Line Tools" — click **Install** in that dialog and wait for it to finish (a few minutes), then continue.
2. On [github.com](https://github.com), click **New repository** (don't initialize it with a README/gitignore — this folder already has one).
3. In Terminal:
   ```
   cd "/Users/roxystudio/Public/MailChimp Page/site"
   git init
   git add .
   git commit -m "Roxy Music signup page"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
   (Swap in your actual GitHub username/repo name in the `remote add` line — GitHub shows you this exact URL right after creating the repo.)
4. If prompted to log in, GitHub will walk you through browser-based auth (or a personal access token) — follow its prompts.

The `.gitignore` in this folder already excludes `.env`, `.netlify/`, and `.DS_Store`, so nothing sensitive gets committed. The PDF books live outside this folder and were never part of it, so they won't be swept in either.

## 1. Mailchimp merge field (already set up)

Your audience already has a **GTRLEVEL** dropdown merge field with 8 choices, one per color level. `subscribe.js` maps the color picked on the site to the exact matching phrase before sending it to Mailchimp:

| Color  | GTRLEVEL value sent |
|--------|----------------------|
| Gold   | I've Never Played Guitar |
| Green  | I Know Some Chords, But Can't Play Songs |
| Purple | I Can't Play Barre Chords |
| Blue   | I Wanna Play Lead Guitar |
| Orange | I'm Tired of Pentatonic Scales |
| Red    | I Want to Play in More Keys |
| Brown  | I want to learn about Sweep Picking |
| Black  | I'm Ready to Learn About Modes |

These strings must match your Mailchimp dropdown choices **exactly** (spelling, punctuation, capitalization). If you ever edit the wording of a choice in Mailchimp, update the matching line in `netlify/functions/subscribe.js` (`LEVEL_TO_GTRLEVEL`) to match, or Mailchimp will reject that field.

## 2. Mailchimp API key + Audience ID

You already have these:
- API key: `71f62ba4...-us13` (data center `us13`, extracted automatically from the part after the dash)
- Audience ID: `4a355de051`

**Important:** that specific key was shared in this chat, so treat it as exposed — you've already regenerated it in Mailchimp, good. Use the **new** key below in step 3, not the one above.

**Where it goes:** never in a file in this project — only in Netlify's environment variables (step 3 below). Netlify injects it into the function at runtime via `process.env.MAILCHIMP_API_KEY`, so it's never visible in the browser or committed to git.

## 3. Deploy to Netlify (from GitHub)

1. In Netlify: **Add new site > Import an existing project > Deploy with GitHub**, authorize Netlify to access your GitHub account if prompted, then pick the repo you pushed in step 0.
2. Netlify should auto-detect the settings from `netlify.toml` (publish directory `.`, functions directory `netlify/functions`) — just confirm and click **Deploy**.
3. Once deployed, go to **Site configuration > Environment variables** and add:
   - `MAILCHIMP_API_KEY` = your **new**, regenerated key
   - `MAILCHIMP_AUDIENCE_ID` = `4a355de051`
4. Trigger a redeploy (**Deploys > Trigger deploy**) so the function picks up the env vars.

From now on, any `git push` to `main` auto-deploys the site — no need to re-upload manually.

**Alternative — CLI path, or drag-and-drop at [app.netlify.com/drop](https://app.netlify.com/drop) for one-off deploys without GitHub:**
```
npm install -g netlify-cli
cd site
netlify login
netlify init
netlify env:set MAILCHIMP_API_KEY "your-key-here"
netlify env:set MAILCHIMP_AUDIENCE_ID "your-audience-id"
netlify deploy --prod
```

## 4. Book delivery is handled by your Mailchimp automation

You already have the PDFs hosted with custom paths and an automation that sends the right book based on the GTRLEVEL merge field, so this site doesn't host or link the PDFs at all. `netlify/functions/subscribe.js` just needs to write GTRLEVEL correctly (it does — see step 1), and your automation takes it from there. The thank-you page simply confirms the signup and tells them to check email.

Make sure your automation's trigger fires for `status: "subscribed"` contacts (that's what the function sends) — if your automation is scoped to a specific signup source, form, or tag instead of "any new subscriber with a LEVEL set," double check it'll still fire for contacts added via this API call.

## 5. Test end to end

1. Visit your live Netlify URL.
2. Submit the form with a real email you can check.
3. Confirm: you land on the thank-you page, the contact shows up in Mailchimp with the right GTRLEVEL merge field, and your automation actually sends the matching PDF.

## Notes on choices made

- **Single opt-in**: the function subscribes people immediately (`status: "subscribed"`) rather than sending a confirmation email first, since your automation needs a confirmed GTRLEVEL right away to send the correct book. If you switch this to `"pending"` (double opt-in), confirm your automation still fires after the confirmation click, not on initial signup.
- **Fonts**: the brand guide calls for Galderglynn Titling Bold and Olivia Dhorgent, which are premium fonts not bundled here. I substituted free equivalents (Anton for headings, Dancing Script for the script accent) that match the mood. If you own the actual font files, send them over and I'll swap them in for an exact match.
