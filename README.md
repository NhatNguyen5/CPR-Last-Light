# CPR-Last-Light · Helix Meridian character terminal

A GitHub Pages-ready, read-only React/Vite viewer for Nathan Guen's **Cyberpunk RED** campaign. Styled as a Helix Meridian personnel terminal with responsive pages for attributes, skills, inventory, cyberware, contacts and records.

**Authoritative state:** private `CAMPAIGN_STATE.json` in Drive (campaign `CPR-HELIX-LAST-LIGHT-001`). **Viewer data:** a separate private `PLAYER_SHEET.json` (Drive file ID `1aDYZX-cWZYem0yO5-KAqH4VwUUYg1f8e`). No character data, access tokens, canonical saves, or GM-only truth are bundled into the website.

## What is already done

- A private player-safe JSON projection of canonical revision 1 has been uploaded to the campaign folder on Drive.
- The viewer performs Google sign-in via Google Identity Services, asks for per-file Drive scope (`drive.file`), and uses Google Picker to grant this OAuth application access to the selected existing JSON file.
- The page downloads that private JSON from Drive in memory with `files.get?alt=media`. It rejects a full canonical save, wrong campaign ID, or wrong character.
- The deployment workflow builds and publishes just `dist/` with GitHub Pages. It does not copy any JSON character data into the repository.

## 1. GitHub repository and source deployment

Repository: **[NhatNguyen5/CPR-Last-Light](https://github.com/NhatNguyen5/CPR-Last-Light)** (created by the repository owner). The project URL after a successful Pages deployment is:

`https://nhatnguyen5.github.io/CPR-Last-Light/`

The Vite build uses base path `/CPR-Last-Light/`. Commits to `main` trigger the included Pages workflow; it publishes only `dist/`, never the private JSON files.

To work locally:

```bash
git clone https://github.com/NhatNguyen5/CPR-Last-Light.git
cd CPR-Last-Light
npm install
npm test && npm run build
```

## 2. Google Cloud configuration

Visit https://console.cloud.google.com/ and create/use a Google Cloud project. Google Cloud requires you to perform these configuration steps; the connected Drive API is not the same as the OAuth web app you're registering.

1. Enable **Google Drive API** and **Google Picker API**.
2. Configure **Google Auth Platform / OAuth consent screen**. For a personal app, set it to **External** / **Testing**, add your Google account as a test user. In Testing mode, test-user authorization may expire after seven days, so you may need to sign in again. In production, verification requirements depend on usage and scopes.
3. Create an OAuth Client ID of type **Web application**. Add these **Authorized JavaScript origins** (origins only, **no path**):
   - `https://nhatnguyen5.github.io`
   - `http://localhost:5173` (local development)
4. Create a **browser API key**, and restrict it to allowed HTTP referrers `https://nhatnguyen5.github.io/*` **and** `https://docs.google.com/*` (Picker iframe requirement); add `http://localhost:5173/*` for local testing; restrict API usage to the Google Picker API where supported.
5. Note your **Google Cloud project NUMBER** (numeric project ID), the **OAuth Web Client ID**, and the **browser API key**.
6. In the GitHub repo's **Settings → Secrets and variables → Actions → Variables**, create:

   | Repository variable | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | OAuth web client ID (ends `.apps.googleusercontent.com`) |
   | `GOOGLE_PICKER_API_KEY` | browser API key, referrer restricted |
   | `GOOGLE_PROJECT_NUMBER` | numeric Cloud project number |

These are **public browser configuration values**, not secret credentials. Never add OAuth client secrets, service account JSON, refresh tokens, or campaign JSON files to this repository. Restrict the API key by referrer, use minimal scopes, and do not expose your canonical state file.

Local development: `cp .env.example .env`, fill values, then `npm run dev` and visit http://localhost:5173/CPR-Last-Light/.

## 3. Enable GitHub Pages

In repo **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Push to `main` or trigger the `Deploy character viewer to GitHub Pages` workflow manually. The Vite configuration already uses base `/CPR-Last-Light/`. GitHub Pages is public; **the website code only** is public.

## 4. First authorization and private syncing

1. Open your GitHub Pages site and press **Connect Google Drive**. Authorize the single-file `drive.file` scope with the Google account that owns the character projection.
2. If the first download is denied (expected for an existing file not yet opened by the OAuth app), use **Select Drive file** and select `PLAYER_SHEET.json`, **not** `CAMPAIGN_STATE.json`.
3. The file picker grants this OAuth client per-file access. The viewer validates the selected file and remembers **only the file ID** in localStorage. The short-lived OAuth access token and sheet contents remain in memory and disappear on reload/sign-out; access token is not saved locally.
4. Press **Refresh** to fetch the current private projection again. Refreshing does not change fictional time or game resources.
5. If sign-in is unavailable, **Open local export** loads `PLAYER_SHEET.json` from your computer entirely in-browser without sending its contents to a server. That view is clearly marked **LOCAL SNAPSHOT**, not synced.

**Important:** `drive.file` cannot automatically see a pre-existing arbitrary Drive file by ID until it is selected using Picker for this app. We explicitly avoid requesting broad `drive.readonly` access.

## 5. Updating the player projection at checkpoints

The canonical save remains the **only source of truth**. Every time the GM commits and verifies a new canonical revision, regenerate the player-only derivative and **replace the existing Drive file in place**, preserving ID `1aDYZX-cWZYem0yO5-KAqH4VwUUYg1f8e`.

A strict allowlist CLI generator is included:

```bash
npm run project -- /private/CAMPAIGN_STATE.json /private/PLAYER_SHEET.json
```

The generator reads locally; it never touches Google Drive. Updating that remote file requires the Drive API `files.update` call, or the connected Drive tool with a verified, user-authorized update operation. The GM should do this as a *dependent cache update after canonical verification* and label the projection with the canonical revision. If the projection update fails, the viewer will show an **older revision**, not a false success. Avoid overwriting the canonical with the player JSON.

A full automation can later be added with a privileged Apps Script or other server-side worker under your Google account. That is deliberately not embedded in GitHub Pages or given broad Drive access: it would need read access to the canonical data and edit access to the projection.

## Security notes

- The character's private data **never appears in the GitHub repository or GitHub Pages build artifact**. `VITE_*` config is public, but the Drive file remains protected by Google's OAuth access controls.
- **Do not share the player JSON with “Anyone with the link.”** The viewer is able to read it only after a real account authorizes it.
- OAuth scope is `https://www.googleapis.com/auth/drive.file`, not unrestricted Drive access. File access is granted with Picker. **This per-file scope technically permits writes to the selected projection; the application itself makes GET requests only.** Never select the canonical file.
- The viewer does **not** perform writes, roll dice, or change campaign state.
- A static-site browser cannot securely hold an OAuth client secret; the GIS token model is used with a public client ID and short-lived access tokens.
- **Projection contents are visible to any collaborator who can view that Drive file.** The schema excludes `gm_only` at source; the app also rejects full campaign state. The app cannot guarantee every arbitrarily authored field is free of spoilers, so keep the projection generator's allowlist tight.
- Use `npm test` to verify that GM-only content and hidden inventory do not escape the generator.

## Developer commands

```bash
npm install
npm test
npm run dev
npm run build
npm run preview
```

Maintained for Campaign Red. All character history and the 2045 fictional clock remain unchanged by website maintenance.
