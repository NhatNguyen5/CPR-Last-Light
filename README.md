# CPR-Last-Light · Helix Meridian character terminal

A GitHub Pages-ready, read-only React/Vite viewer for Nathan Guen's **Cyberpunk RED** campaign. Styled as a Helix Meridian personnel terminal with responsive pages for attributes, skills, inventory, cyberware, contacts and records.

**Authoritative state:** private `CAMPAIGN_STATE.json` in Drive (campaign `CPR-HELIX-LAST-LIGHT-001`). **Viewer data:** a separate private `PLAYER_SHEET.json` (Drive file ID `1aDYZX-cWZYem0yO5-KAqH4VwUUYg1f8e`). No character data, access tokens, canonical saves, or GM-only truth are bundled into the website.

## What is already done

- A private player-safe JSON projection of canonical revision 1 has been uploaded to the campaign folder on Drive.
- The viewer performs Google sign-in via Google Identity Services, asks for per-file Drive scope (`drive.file`), and uses Google Picker to grant this OAuth application access to the selected existing JSON file.
- The page downloads that private JSON from Drive with `files.get?alt=media`. It rejects a full canonical save, wrong campaign ID, or wrong character. After you connect, it caches the player-only projection in browser localStorage (never the OAuth token) for immediate offline reopening.
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
3. The file picker grants this OAuth client per-file access. The viewer remembers the file ID and saves a **player-only offline snapshot** in the current browser profile, clearly marked as potentially outdated. **No OAuth token, refresh token, or canonical GM state is cached.**
4. Later visits show the last cached player sheet immediately, without sign-in. Tap **Connect & refresh** to request the latest Drive data. The token request reuses existing Google consent when possible (`prompt: ""`), but Google may still show an account chooser or consent UI. Testing-mode authorizations can expire. Refreshing does not advance the campaign.
5. Tap **Remove saved offline copy** to clear the cached character data from this device without changing Drive. **Sign out** also deletes the cached snapshot. Local JSON import remains available and is not automatically saved offline.

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

- The character's private data **never appears in the GitHub repository or GitHub Pages build artifact**. After Drive connection the viewer stores a player-only copy in the visiting browser's localStorage for convenience. Anyone with access to that unlocked browser profile may read it. Remove the offline copy on shared devices. `VITE_*` config is public, but the Drive file remains protected by Google's OAuth access controls.
- **Do not share the player JSON with “Anyone with the link.”** The viewer is able to read it only after a real account authorizes it.
- OAuth scope is `https://www.googleapis.com/auth/drive.file`, not unrestricted Drive access. File access is granted with Picker. **This per-file scope technically permits writes to the selected projection; the application itself makes GET requests only.** Never select the canonical file.
- The viewer does **not** write to Drive or change campaign state. Dice checks and inventory drafts remain local browser operations.
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

## Mobile navigation, player-known NPCs, and local dice

- The mobile viewer uses six persistent bottom tabs: **Bio**, **Skills**, **Gear**, **Agent**, **Combat**, **Exec**. The Agent tab opens the **Contacts**, **Known NPCs**, **Records**, and **Cyberware** subpages; desktop retains a sidebar.
- The offline/sync warning is condensed into a top-right cloud icon. Open it to see the current source (Drive vs offline), revision and last download, to connect/refresh, pick a Drive file, or delete the offline cache. A cached snapshot is never claimed to be the authoritative or latest Drive version.
- Contacts and Known NPCs include only family, friends, and explicitly player-visible introduced NPCs from `PLAYER_SHEET.json`. Unknown driver/boss identities and scenario-prepared NPCs are never inserted by the viewer.
- The projection generator can include future canonical `people_and_relationships.player_known_npcs` entries **only** if each record is marked `visibility: "player-known"` and `known_to_pc: true`. Only approved descriptive fields are copied; no private/GM narrative notes are transferred.
- The roll terminal is available from trained Skill Base buttons and the Combat page. It uses browser `crypto.getRandomValues` and rejection sampling for unbiased results. Cyberpunk RED Skill checks apply one additional d10 (added on natural 10, subtracted on natural 1; no recursive criticals); Initiative uses REF + 1d10; damage dice are summed normally. A provided DV is informational and checked using the strict `roll > DV` rule.
- Roll results, modifiers, and timestamps stay in a **local browser-only history** (latest 30), separate from cached character data and from the private campaign save. Clicking Roll does **not** move in-world time, count ammunition, harm characters, grant IP, adjudicate a check, or commit a GM campaign event. Use Copy Result when sharing a consequential roll with the GM. Clearing history affects only this browser.

**Privacy caution:** offline snapshots and roll history are saved in browser `localStorage` for convenience. Avoid using them on shared devices, and use the app's clear controls when needed. Google OAuth tokens remain memory-only, never persisted in localStorage or GitHub.

### Mobile improvements (November 2026)

- The mobile menu has been retired in favor of the six-tab bottom navigation. The sticky header displays the latest saved eurobuck balance from the private player projection, alongside Drive sync status.
- All ten current STATs fit in a two-row, five-column grid on mobile (no horizontal scrolling).
- Core Skills at Level 0 can launch untrained `STAT + 0 + 1d10` checks. Skills whose *type* requires a chosen specialization (e.g. an unrecorded Language or Science discipline) prompt for a descriptive field before rolling. Whether a task requires training, equipment, or GM permission remains a GM ruling. No local roll commits to campaign history.
- The logo SVG is a **proposed visual emblem** inspired by Helix Meridian's known cybertechnology and medical-technology industry. No official emblem has been established in the canonical campaign state; the site does not establish one as an in-world fact.

### Contacts and inventory interface (November 2026)

- **Contacts** now opens a phone-style personal directory with alphabetized entries, a search bar, and All / Family / Connections tabs. Tapping a person shows only player-recorded information. A phone number is shown as not recorded unless the player projection explicitly contains one; this screen does not place calls or send messages.
- **Gear** displays eight horizontal, touch-scrollable inventory tabs in the companion-app order: Ammo, Armor, Clothing, Cyberware, Gear, Programs, Vehicles, Weapons. The Cyberware subpage opens the same view with Cyberware selected.
- Individual item cards summarize **core rulebook data** with linked reference pages, mechanics, saved custody, and saved item notes. Summaries are paraphrased rather than copied wholesale. Where the rulebook has no corresponding entry, the card identifies itself as a saved campaign record rather than guessing.
- Each personally owned item exposes **− / +** quantity buttons. These change an in-memory *proposal* only, never the verified inventory, loaded magazine, prices, money, HP, Humanity, installation status, or fictional time. The draft can be copied for GM reconciliation or reset. Company-owned assets are clearly marked and do not expose personal quantity controls. Reloading the viewer discards unsaved proposals.
- The separate `PLAYER_SHEET.json` continues to be the only data source exposed to the website; all item reference descriptions are a static rules catalog that conveys no character possessions on its own.


### Company Personnel directory (November 2026)

- **Agent → Company Personnel** displays the assigned chauffeur as an independent Helix Meridian employee. The **Exec → Teamwork** screen links to the same roster. This is separate from **Known NPCs**, because being assigned a teammate does not establish an on-screen introduction.
- The profile reads the **existing private `PLAYER_SHEET.json` projection**. No new character data or personal details are hard-coded into the public site. It lists verified attributes, HP, serious-wound threshold, Death Save, agreed fixed Loyalty and its provenance, skill tiers, cyberware package, company vehicle, and issued equipment. Driver equipment is matched by `company_driver.equipment_ids` against the already filtered player-safe items, never fetched from the canonical save.
- Identity and HR cover title remain explicitly pending. When the campaign later establishes them and refreshes the player-only projection, the roster updates without changing site code. No actions, Loyalty checks, NPC introductions, or fictional time are triggered by opening the page.
- **No Drive save was modified** to implement this view. The public repository contains interface code and tests only, not the private player projection or canonical campaign state.

### Facedown (November 2026)

- **Combat → Facedown** opens an opposed-roll dialog. Formula: **COOL + Reputation + 1d10**; this is not a Skill Check, so it does not receive a critical follow-up die. For a defining reputation for cowardice, the Reputation modifier is negative.
- Nathan's revision-1 player projection does **not** establish a Reputation score. Enter the GM-confirmed numeric value; the site does not assume it is zero. An opponent's **GM-supplied** total is optional and shown only for comparison; the viewer does not roll for NPCs.
- A tie has no effect. Otherwise, the loser may back down or take **−2 on future actions against the winner** until defeating them once. No automatic penalties, fictional time, or Drive writes result from pressing the button.
- The roll remains in this browser's local, clearable history.

### LUCK tracker and unified roll modifier (November 2026)

- Nathan's saved LUCK is **5** at campaign revision 1. The remaining/max LUCK chip is visible in the top header; tap it to open **Combat → LUCK**.
- The **Modifier** field is shared by all dice dialogs (Skills and Combat, including Facedown, Initiative, and damage). It does **not** require a separate LUCK field. All valid modifiers, positive or negative, enter through this single input.
- **LUCK can be committed before a Skill Check for +1 per point**. This includes combat Skill Checks such as Handgun, Evasion, and Brawling. Example: commit 2 LUCK, type +2 in Modifier (combined with any other situational modifiers), and click Roll. A generic Modifier cannot identify which portion came from LUCK, so the viewer does **not** automatically deduct LUCK; mark 2 points spent in the LUCK tracker before rolling.
- LUCK does **not** buy rerolls and is not applied to damage or Initiative by default. Facedown is an opposed roll; request a GM ruling on LUCK applicability rather than treating every generic modifier as LUCK.
- Manual **Mark 1 spent** / **Undo 1 spend** controls track session expenditure; **Refill for new session** requires explicit confirmation. The local counter is scoped to this campaign/player and persists across refreshes/checkpoints without automatic refill. Neither the counter nor dice writes to Drive or advances fictional time.
- Share meaningful LUCK spending with the GM for canonical reconciliation. LocalStorage data may be accessible to other users of the same browser profile.

### Skills IP and top-bar Reputation (November 2026)

- **Skills** displays a compact read-only **Available Improvement Points** strip before the attribute grid and skill matrix. It reads `player_character.ip` from the private projection; zero is displayed as **0 IP**, while absent/invalid values are shown as unknown rather than silently treated as zero. The current canonical revision has **0 unspent IP**.
- The sticky header displays **REP** next to LUCK and eurobucks. At revision 1, Nathan's Reputation score has **not been established**, so the badge reads **REP —**, not an invented zero. If a verified Reputation integer is added to the canonical character record, the strict projection generator includes that player-facing field on the next approved checkpoint. No GM-only data is published.
- Facedown prepopulates Reputation from that field when present; otherwise it requires a confirmed value. The user may still enter a GM-approved situational value. These changes add displays and tests only; no canonical data, IP, reputation, or fictional time is changed by website edits.
