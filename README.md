# Open Archive — independent Archive search

An independent interface by Shohail Mahmud. Not affiliated with, endorsed by, or operated by the Internet Archive. Live factual records use archive.org's Advanced Search and Metadata endpoints. Credits are in the footer, Terms page and THIRD-PARTY-NOTICES.txt.

## Run or publish

Use Node 22.12+ (or 20.19+): `npm ci && npm run build`. For a static deployment (including Vercel), publish `dist/`. `dist/index.html` is also the standalone version. For the optional Node metadata/file relay, run `npm start`. Both modes request cover art, selected previews, and the official book and media players directly from archive.org. The optional Node server relays catalogue JSON only. Pages use clean URLs, including /item/<identifier>. The Node server and the included vercel.json serve these paths on direct visits and refresh. For another static host, rewrite these page routes to /index.html. Legacy #/ links are upgraded automatically. A downloaded HTML file still uses hash navigation; without a public site origin its copy button shares the Archive source instead.

## Media access

- Covers are loaded lazily on collection cards. The image gallery uses the exact public filename; the Files tab supports filtering and previews. Read, Watch and Listen load the official Archive reader/player only after activation. The original record remains available if a browser blocks embedding.
- Downloads open on archive.org. There is no download mirror or bulk ZIP, and the old local file/thumbnail endpoints return 403. Restricted or lending records do not get local readers, players, file previews or direct-download controls.
- A dismissible first-visit homepage cookie and media banner links the Terms and Privacy Policy. Public availability, link notices, and third-party hosting do not establish permission to use or redistribute copyrighted works. Monitor complaints and remove links or previews where appropriate.

## Owner checks before launch

1. Confirm you own or have permission for the original project and the portrait logo. No new project-wide licence is granted by this package. Preserve any applicable upstream notices.
2. The Alexandria illustration is credited to Ambrose Dudley/The Stapleton Collection. Check the Wikimedia Commons licensing page linked in the caption for your publication territories. Replace the artwork if its status does not cover your use. Keep the artwork source and credits with your distribution.
3. Review the Internet Archive Terms at https://archive.org/about/terms for your intended use. Monitor the site-operator contact linked in Terms (or replace it with a monitored email); source-file removals go through the Archive. Confirm hosting, log retention, analytics settings and the Privacy Policy match the actual deployment. Consult appropriate legal advice if needed. This checklist is not legal clearance.
4. Preserve `THIRD-PARTY-NOTICES.txt`; `npm run build` regenerates it from installed packages and embeds the notices in the Terms page in the single-file build. Recheck notices when adding libraries, fonts or media.
5. Replace older deployments containing the permissive file relay, and invalidate any old proxy/CDN cache of previously served files and thumbnails. Do not publish an older build alongside this one.

## Checks

`npx tsc --noEmit`, `npm run build`; `npm start` then `npm run test:live` and `node tests/rights.mjs`. Set `CHROME_BIN` if using a system Chromium executable. Live tests require network access; no sample data is substituted.
