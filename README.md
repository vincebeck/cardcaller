# Card Caller

A one-page web app that draws random cards from a 52-card deck (no repeats until shuffle). Optionally show the card, speak it, or both.

Works in modern browsers on Mac and PC. No install, no account, no API keys.

## Run locally

Open `index.html` in a browser, or from this folder:

```bash
open index.html
```

Keep the `audio/` folder next to `index.html`.

## Publish (GitHub Pages / Cloudflare Pages)

This is a static site. Deploy the repo root (or at least `index.html` + `audio/`).

### GitHub Pages

1. Push to GitHub
2. Settings → Pages → Deploy from branch `main` (or your publish branch), folder `/` (root)
3. Open `https://<user>.github.io/<repo>/`

### Cloudflare Pages

1. Create a Pages project from the GitHub repo
2. Build command: leave empty (static)
3. Output directory: `/` (root)

## Controls

- **Show card** — display the drawn card face
- **Speak card** — play a pre-recorded neural voice for that card
- **Voice** — Female or Male
- **Language** — speech language (English for now; more later)
- **Volume** — speech volume
- **Delay** — optional 1–10 second countdown before the card is revealed/spoken
- **Draw card** or **Space** — draw the next card
- **Shuffle / Reset** — reshuffle the full deck

## Audio

Clips live under `audio/en/{female|male}/` (~850 KB), generated with [Piper](https://github.com/rhasspy/piper) (lessac / ryan).

To regenerate (optional, with Python + ffmpeg):

```bash
python3 scripts/generate-audio.py
```