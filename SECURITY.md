# Security model

## Public hosting
This is a static GitHub Pages project. Treat the deployed URL as public. `robots` metadata is a crawler/indexing hint only; it is not access control.

Never commit passport data, payment data, live credentials, booking codes or verification numbers.

## Session-only private values
The Pocket secret-reveal UI does not use `localStorage` or `sessionStorage`. Values entered there exist only in React state for the current page session and disappear on reload.

## Dependency policy
CI runs `npm audit --omit=dev` through `scripts/check-npm-audit.mjs`. Unapproved **High** or **Critical** production findings block deployment.

The allowlist is deliberately advisory-specific. A package name alone is never enough to bypass the gate: each accepted leaf finding must match an explicitly listed GHSA ID. Aggregate findings such as `next -> postcss/sharp` are accepted only when every High/Critical transitive path resolves exclusively to already accepted leaf advisories. A new direct or transitive High/Critical advisory therefore fails CI by default.

### Temporarily accepted upstream findings

#### `sharp`
Accepted advisory: `GHSA-F88M-G3JW-G9CJ`.

Rationale for this static project:
- no `next/image` import;
- no direct `sharp` import or call;
- no image-upload endpoint;
- no processing of untrusted/user-supplied images;
- GitHub Pages receives only the generated static export, not an image-processing server runtime.

#### `nanoid`
Accepted advisories: `GHSA-28WG-GHJ8-5HJV` and `GHSA-2V37-7H3G-55P8`.

Rationale for this static project:
- the vulnerable behavior requires an attacker-controlled zero or negative generator size;
- application source does not import or call `nanoid`;
- `nanoid` is present only as a transitive build dependency through the CSS toolchain;
- the deployed GitHub Pages site has no server-side Nano ID generation runtime.

#### `postcss`
Accepted advisories: `GHSA-6G55-P6WH-862Q` and `GHSA-R28C-9Q8G-F849`.

Rationale for this static project:
- the accepted advisories require PostCSS to process attacker-controlled CSS/source-map annotations;
- this project builds only repository-controlled CSS;
- there is no user CSS upload, theme editor, CSS-processing API or other runtime PostCSS endpoint;
- PostCSS runs during the trusted CI build, while GitHub Pages serves only the resulting static files.

### Upstream removal policy
These are temporary upstream exceptions, not permanent package-wide exemptions. Dependabot remains enabled. Remove an exception as soon as the Next.js dependency tree permits patched transitive versions without overriding Next.js's own exact internal dependency pins.

Do not add a new GHSA to the allowlist solely to make CI green. First verify the advisory's exploit prerequisites against this project's architecture and document the rationale here.

## PWA/offline integrity
The Service Worker is generated from a content hash that includes both static output and the worker template. A new precache is staged before it is committed, so a failed update does not delete the currently usable offline copy.
