# Japan 2026 — technical audit after IA rebuild and content-integrity correction · 05.09.2026

## PASS
- Source IA audit: exact five semantic top-level sections; `/china` removed; 15 chronological days present.
- Content-routing audit: Beijing/Chengdu are in the main stream; Food/Shopping/Pocket/Preparation ownership checked.
- Content integrity: stale protected-Imaasa semantics removed from day route and gastronomy; no Imaasa To Do exists.
- 21.09 chronology contains Fairfield → PEK T2 and concise PEK → KIX events; detailed HU473/terminal data remains in Transport.
- Hiroshige/TNM and Edo-Tokyo are restored only as Tokyo Plan-B/watch tasks.
- Shiunso private-bath wording is synchronized with the confirmed rule; taxi/DiDi global rule restored.
- Beijing primary-route Amap coverage includes Forbidden City, Jingshan and Jingmo.
- Contextual cross-links: move → Transport; Guides → Food/Shopping; Pocket → Transport/Plan B; Preparation → offline setup.
- Privacy source audit: public day secrets remain empty; SecretReveal is session-only.
- Source content/IA/regression suite for the correction pass: **29/29 PASS**.
- PDF validation: **102 pages, 39 outline entries, 442 URI annotations, 243 Google Maps links, 9 Amap links — PASS**.
- PDF preflight: openable, unencrypted, non-scanned.
- All 102 PDF pages rendered; critical correction pages visually inspected with no clipping/overlap/broken glyphs observed.

## NOT EXECUTED IN THIS RUNTIME
`npm ci --offline` cannot complete because the local npm cache is missing `zod-validation-error-4.0.2.tgz`; the previously present node_modules directories are incomplete placeholders without runnable binaries. Therefore the following executable checks cannot be honestly marked PASS here:
- dependency/security audit;
- ESLint with project dependencies;
- strict TypeScript with project dependencies;
- Next.js production export under `/JPN26`;
- generated-output link/asset/manifest checks;
- Playwright online/offline full-route matrix;
- portrait/landscape browser visual regression;
- live PWA upgrade/cache migration test.

These checks remain encoded in `.github/workflows/pages.yml` and the project test suite. No stale `out/`, `.next/`, `node_modules/` or generated PDF output is included in the deployment ZIP.
