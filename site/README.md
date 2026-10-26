# Gianluca Zanello — sito statico

Portfolio statico (HTML/CSS/JS) che sostituisce WordPress.

## Anteprima locale

I video (pesanti) non sono in git: se mancano, dalla root del repo:

```powershell
powershell -File scripts/copy-videos.ps1
```

Poi, dalla cartella `site`:

```bash
php -S 127.0.0.1:5173
```

Apri http://127.0.0.1:5173/ (video `.mov` e PDF in iframe richiedono un server locale).

## Struttura

- `index.html`, `about.html`, `media.html`, `spartiti.html`, `momo-orchestra.html`, `extra.html`, `contacts.html` — italiano
- `en/` — versione inglese
- `assets/` — CSS, JS, immagini, audio, PDF, video

Il dump WordPress in `www.gianlucazanello.it/` è escluso da git (`.gitignore`).

## Deploy

Carica il contenuto di `site/` su qualsiasi hosting statico (Netlify, Cloudflare Pages, GitHub Pages, Aruba static, ecc.).

Il form contatti usa `mailto:`; per un invio vero collega Formspree / Netlify Forms.
