# Japan 2026 — verification · 05.09.2026

- Canonical source: FINAL 29.08 + confirmed delta through 05.09 + content-integrity correction pass.
- Git history reviewed before IA changes: v2 → v3.x → v4.x → v5 → v6 plus navigation/PWA/workflow hotfixes.
- Source content/IA/regression suite used for the correction pass: **29/29 PASS**.
- Explicit integrity guards now cover Imaasa semantics, 21.09 shuttle/flight chronology, Tokyo Plan-B ticket watches, Shiunso bath logic, taxi/DiDi rule and Beijing Amap coverage.
- Google Maps/Amap data regression: PASS.
- Mobile PDF generation and executable validator: PASS.
- PDF: **102 pages, 39 outline entries, 442 URI annotations, 243 Google Maps links, 9 Amap links — PASS**.
- PDF preflight: openable, unencrypted, non-scanned; all 102 pages rendered for visual QA; critical corrected pages inspected.
- `npm ci --offline`: NOT EXECUTED successfully because one dependency tarball is absent from local cache. Existing placeholder `node_modules` directories do not contain runnable project binaries.
- Therefore production Next export and browser/Playwright/PWA checks remain NOT EXECUTED in this runtime; the GitHub Pages workflow retains those gates.
