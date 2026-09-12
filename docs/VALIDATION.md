# Validation record

- HTTP route crawl: 39 linked content routes returned 200 with page headings and site-specific titles. 32 referenced image/source-set paths checked; four unknown project/space/collection/experience URLs returned 404.
- TypeScript: no errors.
- Lint: authored code passed. Unmodified starter UI primitives and their mobile hook are excluded, as documented in README.
- Browser: Chrome desktop hero, introduction and asymmetric spaces composition inspected. Mobile homepage, navigation drawer, project listing, search, project detail and experience placeholder inspected. Search for “walnut” returned the correct project and material; project result navigation, menu closure and Project → Experience worked.
- Responsive measurements: homepage at 390px and 768px, and experience at 390px and 1001px reported no horizontal document overflow. Checked images were not broken. No canvas is created by the current placeholder or homepage.
- Browser console during the checked journeys: no application errors observed. Two font-preload warnings were observed in the third-party mobile-simulator wrapper; both application fonts were verified loaded in the real page.
- Dependency audit: all starter advisories addressed with compatible React, Vinext, Vite and Cloudflare toolchain updates. npm reported zero known vulnerabilities after installation.
- Final production build: passed on the patched toolchain. Production route crawl: all 39 content pages, 32 referenced image/source-set paths and four invalid routes passed.

These checks are desktop browser and emulated viewport checks, not physical-device testing. No real scene/model is installed, so GPU memory, navigation inside a model and future scene performance are not claimed to have been tested.
