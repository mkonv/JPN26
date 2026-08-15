# Japan 2026 — technical validation baseline · 15.08.2026

## Canonical content baseline
- Full 92-point audit supplied by the user remains the factual/operational baseline.
- Later user decisions override the former strict pork-free interpretation: pork is a **soft preference**, not a ban.
- HARUKA = ordinary discounted One-way Ticket with a physical ticket; no WEST QR.
- Hirasō remains a target lunch with direct holiday-hours verification still required.
- J.ANDO remains by name as a popup/retailer-watch; no permanent address is invented.
- Exact Nara/Himeji train selection is represented as an explicit To Do.
- Web/PDF route content is sourced from `data/trip.json` + `data/travel-enrichment.json`.
- Point-by-point content disposition: `AUDIT_2026-08-15_FIX_MAP.md`.

## Web hardening incorporated in this source release
- Next.js and `eslint-config-next` pinned to 16.2.11.
- China hotel map actions in Pocket use explicit Amap URLs; Japanese hotels retain the normal map fallback.
- Booking/verification codes are **session-only React state**: they are not written to `localStorage` or `sessionStorage` and disappear on reload.
- Search-engine indexing is discouraged via Next metadata robots directives. This is **not authentication** and does not make GitHub Pages private.
- Mobile Playwright QA is a required GitHub Actions gate alongside regression/build/offline checks.
- Service Worker build ID includes the SW template itself; install uses a staging cache before committing a new precache.
- `.ttf` assets are eligible for guaranteed precache and the rendered-output test asserts a font is in the offline manifest.
- Production dependency High/Critical findings block CI, except the explicitly documented upstream `sharp` advisory accepted only while this project has no `next/image`, `sharp`, uploads or untrusted image processing. See `SECURITY.md`.
- Dependabot is enabled for weekly npm dependency updates.
- Decision-marker contrast and accessibility semantics for To Do tabs are hardened.
- `NowStepper` distinguishes future/current/past days and refreshes the current-day position automatically.

## Source-package policy
- Raw web font assets and `scripts/generate_mobile_pdf.py` **are included** so the repository remains a complete continuation of the supplied source project.
- Generated `out/`, `.next/`, `node_modules/` and `output/` artifacts are intentionally excluded from the deploy-source ZIP; GitHub Actions regenerates the static site.
- No stale pre-audit static export is shipped as deployable output.

## Authoritative production gate
The final authority for deployability is a green `.github/workflows/pages.yml` run on GitHub, which performs:
1. `npm ci`;
2. contextual production dependency audit;
3. lint + static production build + Node regression tests;
4. offline/PWA browser tests;
5. mobile viewport QA;
6. GitHub Pages artifact upload/deploy.

If the local environment cannot reach the npm registry, a local `next build` must not be claimed as passed. Static/source-level checks may still be recorded separately, but they do not replace the GitHub Actions production gate.

## Source-level checks executed in the working environment
The following checks were actually executed after the technical hardening changes:
- JS/MJS syntax: `node --check` passed for every file under `scripts/` and `tests/`.
- TypeScript/TSX parser check: **27/27 files parsed with 0 syntax diagnostics**.
- JSON parsing: all project JSON files parsed successfully.
- Python PDF generator: `python -m py_compile scripts/generate_mobile_pdf.py` passed.
- Audit/content regression suite: **10/10 passed**.
- Canonical data check: **12 days / 12 enrichment blocks / 32 To Do tasks**, unique IDs, required task fields present, public secret slots blank.
- URL syntax check: **163 URL fields**, 0 malformed scheme/host combinations.
- YAML parse: Pages workflow and Dependabot configuration parse successfully.
- Synthetic PWA fixture: generator produced a versioned worker and offline manifest containing `.ttf`; Service Worker VM tests **2/2 passed**, including failed-update preservation of the existing precache.
- Security-audit gate was unit-exercised with synthetic npm reports: incomplete audit report fails closed, the documented `sharp` advisory is the only accepted High case, and an unapproved Critical finding fails.
- `npm ci --offline --ignore-scripts` reached `ENOTCACHED` for a missing tarball rather than a lockfile-consistency (`EUSAGE`) error. A subsequent online install attempt timed out in this sandbox. Therefore no local production `next build`/Playwright claim is made.

## Continuity with the supplied FULL source archive
File-by-file comparison against `Japan_2026_GitHub_Pages_FINAL_2026-08-15_FULL.zip` shows that no source/font/generator file was dropped. The only former file intentionally omitted is the generated `output/pdf/Japan_2026_mobile_itinerary.pdf`; it is not web source and `/output/` is ignored by Git. New source-control files are `.github/dependabot.yml`, `SECURITY.md` and `scripts/check-npm-audit.mjs`.
