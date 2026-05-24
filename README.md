# PrivBatch Free

The open-source core of [privbatch.com](https://privbatch.com): 17 developer tools that run 100% in the browser. No uploads, no accounts, no telemetry.

```
0 bytes transmitted during processing.
0 trackers.
0 accounts required.
```

## What's included

17 free-tier tools, all browser-only:

| Tool | What it does |
|------|--------------|
| JSON Formatter | Pretty-print, minify, validate JSON |
| Base64 | Encode / decode |
| JWT Decoder | Inspect a JWT's header, payload, expiry |
| YAML ⇔ JSON | Two-way conversion |
| Hash Generator | MD5 / SHA-1 / SHA-256 / SHA-512 |
| UUID Generator | v4 UUIDs in bulk |
| URL Encoder/Decoder | Live conversion |
| Markdown Preview | MD → HTML rendering |
| .env Formatter | Sort, dedupe, validate |
| Cron Parser | Cron expression to English + next 10 fires |
| Timestamp Converter | Unix ↔ ISO ↔ human |
| File Detective | Auto-detect + repair broken JSON/CSV/XML |
| Diff Tool | Two-file line diff |
| Number Base Converter | Binary / octal / decimal / hex |
| Color Converter | Hex / RGB / HSL / HSV |
| JSON Query | Path-based JSON extraction |
| AES-256 File Encryption | AES-256-GCM with PBKDF2 600k via Web Crypto API |

Plus the homepage chrome, design tokens, shared utilities, and 3 of the 5 "vs. competitor" comparison pages from the hosted site.

## What's NOT included

This repo is the free-tier core. The hosted version at privbatch.com adds:

- Pro batch processing across multiple files (CSV/XML/Excel/SQL converters, Data Anonymiser, Regex Batch)
- GDPR Documentation Suite (DPA generator, Consent Receipts, Records of Processing)
- Browser CLI (xterm.js terminal that runs the tools as Unix commands)
- License-key verification (Gumroad integration)
- Per-batch compliance certificates

These either require server-coordinated infrastructure (license verification) or represent paid R&D investment and stay closed. The free-tier code you see here is the same code that runs on privbatch.com for free users - nothing has been downgraded.

## Run it locally

No build step. No npm install. Just open the file.

```
git clone https://github.com/PrivBatch/PrivBatch.git
cd privbatch
python3 -m http.server 8000
# then open http://localhost:8000
```

Or any static file server. The HTML files are the deployable artifacts. There is nothing to compile.

## Tech stack

- Pure HTML5, CSS3, vanilla JavaScript
- CDN libraries loaded directly via `<script>` tags (Papa Parse, jsPDF, JSZip, crypto-js, marked, js-yaml, cronstrue, SheetJS, jsonpath - all auditable, all open source)
- AES uses the native Web Crypto API, not a third-party crypto library
- Service worker for full offline support after first load (`sw.js`)

If you can read the source of any tool in your browser's DevTools, you have read the entire shipped code. That is the design.

## How to contribute

Issues and pull requests welcome for:

- Bug fixes in any of the 17 free tools
- New free tools that match the privacy-first design (browser-only processing, no telemetry, no tracking)
- Documentation improvements
- Accessibility fixes
- Cross-browser compatibility fixes

Out of scope (won't merge):

- Telemetry, analytics, or any network call during processing
- Paid / premium / Pro features - those belong in the hosted version
- npm dependencies or build steps - vanilla JS only
- Anything that prevents a tool from working fully offline after first load

## License

MIT. See [LICENSE](LICENSE).

## Related

- Hosted site with Pro features: [privbatch.com](https://privbatch.com)
- Verify the "0 bytes during processing" claim yourself: [privbatch.com/privacy-audit.html](https://privbatch.com/privacy-audit.html)
- Every CDN library listed openly: [privbatch.com/built-with.html](https://privbatch.com/built-with.html)
