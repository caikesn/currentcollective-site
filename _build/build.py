"""Builds the Current Collective site.

Each page lives in _build/src/ as plain HTML with a small meta block at the top:

<!--meta
out: audit/index.html
title: Free website audit | Current Collective
description: ...
css: page.css
nav: audit
cta: no
-->

{R} in a page is replaced with the relative path back to the site root, so links
and assets work both on Netlify and when you open the files straight from your computer.

Run:  python _build/build.py
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_build", "src")
SITE = "https://currentcollectiveagency.com/"
CALENDLY = "https://calendly.com/con-aikens/30min"

NAV = [("work", "Work", "work/"), ("services", "Services", "services/"), ("about", "About", "about/"), ("contact", "Contact", "contact/")]


def head(m, R):
    css = "".join(f'<link rel="stylesheet" href="{R}assets/css/{c}">\n' for c in m.get("css", "").split())
    url = SITE + m["out"].replace("index.html", "")
    extra = m.get("head", "").replace("{R}", R)
    robots = '<meta name="robots" content="noindex">\n' if m.get("noindex") == "yes" else ""
    return f'''<!doctype html>
<html lang="en-AU" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{m["title"]}</title>
<meta name="description" content="{m["description"]}">
{robots}<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Current Collective">
<meta property="og:title" content="{m["title"]}">
<meta property="og:description" content="{m["description"]}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}assets/img/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{R}assets/img/current-textured-on-black.png">
<link rel="apple-touch-icon" href="{R}assets/img/current-textured-apple-touch-icon.png">
<meta name="theme-color" content="{m.get("theme", "#F7F4EC")}">
<link rel="preload" href="{R}assets/fonts/archivo-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
{extra}<link rel="stylesheet" href="{R}assets/css/site.css">
{css}</head>
<body class="{m.get("body", "")}">
<a class="skip" href="#main">Skip to content</a>
'''


def nav(m, R):
    here = m.get("nav", "")
    cur = ' aria-current="page"'
    links = "\n".join(
        f'        <a href="{R}{href}"{cur if key == here else ""}>{label}</a>' for key, label, href in NAV)
    solid = " solid" if m.get("navstyle") == "solid" else ""
    return f'''
<nav class="top{solid}" aria-label="Main">
  <div class="wrap" style="position:relative">
    <div class="bar">
      <a class="brand" href="{R or './'}"><img src="{R}assets/img/current-textured-on-black.png" alt="" width="28" height="28">Current Collective</a>
      <div class="links" id="nav-links">
{links}
        <a class="btn btn-ghost" href="{CALENDLY}" target="_blank" rel="noopener">Book a call</a>
        <a class="btn btn-primary" href="{R}audit/">Free audit</a>
      </div>
      <button class="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="nav-links"><span></span></button>
    </div>
  </div>
</nav>
'''


def cta(R):
    return f'''
<section class="end" data-end>
  <div class="wrap">
    <div class="cta-band rv">
      <div class="cta-grid" aria-hidden="true"></div>
      <span class="label light">[ Free website audit ]</span>
      <h2>Find out what your site is <span class="em">costing</span> you.</h2>
      <p>Send me your link and I'll send back the five things I'd fix first. Free, no contract, and you can fix them yourself if you like.</p>
      <div class="row">
        <a class="btn btn-orange" href="{R}audit/">Get a free audit <span class="arr">→</span></a>
        <a class="btn btn-ghost" href="{CALENDLY}" target="_blank" rel="noopener">Book a 15 min call</a>
      </div>
    </div>
  </div>
</section>
'''


def footer(m, R):
    mbar = "" if m.get("mbar") == "no" else f'<div class="mbar"><a class="btn btn-primary" href="{R}audit/">Get a free website audit <span class="arr">→</span></a></div>\n'
    scripts = "".join(f'<script src="{R}assets/js/{s}" defer></script>\n' for s in m.get("js", "").split())
    return f'''
<footer class="site">
  <div class="wrap">
    <div class="foot-big" aria-hidden="true">Get found. <span class="em">Get booked.</span></div>
    <div class="cols">
      <div>
        <a class="brand" href="{R or './'}"><img src="{R}assets/img/current-textured-on-black.png" alt="" width="28" height="28">Current Collective</a>
        <p style="max-width:34ch">Websites and lead systems for allied health clinics and tradies around Moreton Bay, QLD.</p>
      </div>
      <div><h4>[ Site ]</h4><ul><li><a href="{R}work/">Work</a></li><li><a href="{R}services/">Services</a></li><li><a href="{R}about/">About</a></li><li><a href="{R}concepts/landscaper/">Landscaper concept</a></li><li><a href="{R}concepts/physio/">Physio concept</a></li></ul></div>
      <div><h4>[ Start ]</h4><ul><li><a href="{R}audit/">Free audit</a></li><li><a href="{CALENDLY}" target="_blank" rel="noopener">Book a call</a></li><li><a href="{R}contact/">Contact</a></li></ul></div>
      <div><h4>[ Contact ]</h4><ul><li><a href="mailto:con.aikens@gmail.com">con.aikens@gmail.com</a></li><li><a href="https://instagram.com/currentcollectiveagency" target="_blank" rel="noopener">Instagram</a></li><li>Moreton Bay, QLD</li></ul></div>
    </div>
    <div class="base"><span>© <span data-year>2026</span> Current Collective · ABN 66 107 248 009</span><span><a href="{R}privacy/">Privacy</a></span></div>
  </div>
</footer>

{mbar}<script src="{R}assets/vendor/lenis.min.js" defer></script>
<script src="{R}assets/js/site.js" defer></script>
{scripts}</body>
</html>
'''


def parse(text):
    m = re.match(r"<!--meta\n(.*?)\n-->\n", text, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, text[m.end():]


def build():
    pages = []
    for name in sorted(os.listdir(SRC)):
        if not name.endswith(".html"):
            continue
        meta, body = parse(open(os.path.join(SRC, name), encoding="utf-8").read())
        depth = meta["out"].count("/")
        R = "/" if meta.get("abs") == "yes" else "../" * depth
        if meta.get("bare") == "yes":  # concept sites bring their own head/nav/footer
            html = body.replace("{R}", R)
        else:
            html = head(meta, R) + nav(meta, R) + '\n<main id="main">\n' + body.replace("{R}", R) + \
                (cta(R) if meta.get("cta") != "no" else "") + "\n</main>\n" + footer(meta, R)
        out = os.path.join(ROOT, meta["out"])
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8").write(html)
        pages.append(meta)
        print("built", meta["out"])
    # sitemap
    urls = "".join(f"  <url><loc>{SITE}{p['out'].replace('index.html', '')}</loc></url>\n"
                   for p in pages if p.get("noindex") != "yes" and p["out"] != "404.html")
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')


if __name__ == "__main__":
    build()
