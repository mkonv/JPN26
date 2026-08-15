# Security model

## Public hosting
This is a static GitHub Pages project. Treat the deployed URL as public. `robots` metadata is a crawler/indexing hint only; it is not access control.

Never commit passport data, payment data, live credentials, booking codes or verification numbers.

## Session-only private values
The Pocket secret-reveal UI does not use `localStorage` or `sessionStorage`. Values entered there exist only in React state for the current page session and disappear on reload.

## Dependency policy
CI runs a production dependency audit. Unapproved **High** or **Critical** findings block deployment.

One narrow upstream exception is documented for `sharp` advisory `GHSA-f88m-g3jw-g9cj` while the installed Next.js dependency range still permits an affected optional `sharp` version. The exception is accepted only because this project:
- does not import `next/image`;
- does not import or call `sharp`;
- has no image-upload endpoint;
- does not process untrusted/user-supplied images;
- is exported as a static site with no image-processing server runtime.

The audit gate is intentionally conservative: any other High/Critical production finding fails CI. Dependabot is enabled so this exception can be removed as soon as the upstream dependency path permits a patched `sharp`.

## PWA/offline integrity
The Service Worker is generated from a content hash that includes both static output and the worker template. A new precache is staged before it is committed, so a failed update does not delete the currently usable offline copy.
