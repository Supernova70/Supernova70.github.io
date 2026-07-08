# supernova70.github.io

My personal site — writeups, blog, and projects. Built with [VitePress](https://vitepress.dev).

## Run locally

```sh
npm install
npm run dev      # http://localhost:5173
```

## Add or edit content

All content lives in `docs/` as plain markdown:

- Writeups → `docs/writeups/`
- Blog → `docs/blog/`
- Projects → `docs/projects/`

**To add a page:** create a `.md` file in the right folder, then add a `<Card>`
linking to it inside that folder's `index.md`.

**Labs** live under `docs/writeups/`. Use filenames like `htb-<slug>.md`. Tags:
platform (`htb`, `tryhackme`, …) and difficulty (`very-easy` | `easy` | `medium` | `hard`),
plus 1–3 technique tags (e.g. `sqli`, `ftp-anon`, `rsync`, `mongodb`, `port-forward`).

The landing-page category boxes are edited in `docs/.vitepress/data/homeCards.ts`.

## Deploy

Push to `main` — GitHub Actions builds the site and publishes it to GitHub Pages
automatically. Live at https://supernova70.github.io
