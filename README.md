# currentcollectiveagency.com

The Current Collective website. Plain HTML, CSS and a little JavaScript. No framework, no build server.

## Editing a page
1. Edit the page in `_build/src/` (for example `_build/src/services.html`). The nav, footer and `<head>` are shared and live in `_build/build.py`.
2. Run `python _build/build.py` from this folder. It rebuilds every page and `sitemap.xml`.
3. Commit and push. Netlify deploys automatically.

`{R}` in a page means "path back to the site root", so links work both on Netlify and when you open the files from your computer.

## Forms
Netlify Forms picks up `audit-request` and `contact` automatically on deploy. Turn on email notifications in Netlify: Site configuration > Forms > Form notifications.
The lead system reads these fields: `name`, `phone`, `email`, `message`, `need`, plus the hidden source fields (`utm_*`, `gclid`, `fbclid`, `first_referrer`, `landing_page`).

## Folders
- `assets/` CSS, JS, fonts, images
- `_build/` page sources and the build script (blocked from the live site by `netlify.toml`)
