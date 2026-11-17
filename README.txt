STOKFEED STATIC GITHUB PAGES — Browser GUI deployment (v17)

This folder is the entire website. NO GitHub Actions, NO workflows, NO Python,
NO build command, NO D1, and NO Turnstile. It does not touch Zeos/KV.

1) In GitHub open your existing Stokfeed website repository.
2) Upload all files from this folder into the REPOSITORY ROOT (not a nested folder).
   Keep any additional manual articles and media you already uploaded.
3) Settings > Pages > Build and deployment > Source: Deploy from a branch.
4) Choose branch main, folder /(root). Save.
5) Confirm index.html, style.css, and live-archive.js exist in repository root.
6) Your domain is www.stokfeed.us (CNAME is included). Allow HTTPS and DNS to settle.

Home and category HTML always exist as actual committed files, even if Zeos is down.
Articles load directly from https://zeos.stokfeed.us/v1/{desk}/articles.
Clicking any dynamically loaded card opens /article.html?desk=...&id=... and
retrieves the full article body from the existing Worker, with social reactions.
No rebuild is necessary when Zeos publishes new reports.

Already published static story HTML pages and GitHub Markdown are preserved.
If Zeos fails, the website remains available and offers a Retry control.
For security, never put PUBLISH_TOKEN, CHRONOS_TOKEN, SOCIAL_SALT or other secrets here.

NOTE: Static GitHub Pages cannot convert raw post-*.md files into fully designed
HTML articles without a build. Preserve/manual-create article HTML when adding
new manual posts; automated Zeos reports are loaded in real time.

TESTS: See separately reported local validation. A passing local check does not
verify that the deployed Cloudflare Worker, its KV contents, and GitHub DNS work.
