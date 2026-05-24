/**
 * PrivBatch Free - Shared configuration
 * Single source of truth for the open-source tool registry.
 * Loaded in <head> before gold-standard.js.
 */
const PRIVBATCH = {

  /* In the hosted version these point at Gumroad upgrade URLs. The OSS
     build has no Pro tier - we keep the URLS block as safe stubs because
     gold-standard.js reads `PRIVBATCH.URLS.UPGRADE_PRO` at init time
     (throws "Cannot read properties of undefined" otherwise). Point them
     back to the hosted site so any errant click leads somewhere sensible. */
  URLS: {
    UPGRADE_PRO:      'https://privbatch.com',
    UPGRADE_BUSINESS: 'https://privbatch.com',
  },

  /* Used by batch-tool gating in the hosted version. Kept as a safe default
     for compatibility with shared modules (gold-standard.js reads it). */
  FREE_BATCH_LIMIT: 20,

  /* ── Tool registry ──
     To add a new tool: append one entry here. That's it.

     capabilities: kept for compatibility with shared modules, but the
     open-source build has no GDPR Pack, no Bundle Mode, and no tier
     gating. All tools are free with no limits.
  */
  TOOLS: [
    { name: 'JSON Formatter',        icon: '{ }', path: 'json-formatter.html', badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
    { name: 'Base64 Encode/Decode',  icon: '64',  path: 'base64.html',          badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
    { name: 'JWT Decoder',           icon: '🔑',  path: 'jwt-decoder.html',     badge: 'free',
      capabilities: { hasDownload: false, isBatch: false, processesPersonalData: false } },
    { name: 'YAML ⇔ JSON',           icon: '---', path: 'yaml-json.html',       badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
    { name: 'Hash Generator',        icon: '#',   path: 'hash-generator.html',  badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
    { name: 'UUID Generator',        icon: '⊕',   path: 'uuid-generator.html',  badge: 'free',
      capabilities: { hasDownload: false, isBatch: false, processesPersonalData: false } },
    { name: 'URL Encoder/Decoder',   icon: '🔗',  path: 'url-encoder.html',     badge: 'free',
      capabilities: { hasDownload: false, isBatch: false, processesPersonalData: false } },
    { name: 'Markdown Preview',      icon: 'M↓',  path: 'markdown-preview.html',badge: 'free',
      capabilities: { hasDownload: false, isBatch: false, processesPersonalData: false } },
    { name: '.env Formatter',        icon: '⚙',   path: 'env-formatter.html',   badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
    { name: 'Cron Parser',           icon: '⏱',   path: 'cron-parser.html',     badge: 'free',
      capabilities: { hasDownload: false, isBatch: false, processesPersonalData: false } },
    { name: 'Timestamp Converter',   icon: '📅',  path: 'timestamp.html',       badge: 'free',
      capabilities: { hasDownload: false, isBatch: false, processesPersonalData: false } },
    { name: 'File Detective',        icon: '🔍',  path: 'file-fixer.html',      badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
    { name: 'Diff Tool',             icon: '±',   path: 'diff-tool.html',       badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
    { name: 'Number Base Converter', icon: '01',  path: 'number-base.html',     badge: 'free',
      capabilities: { hasDownload: false, isBatch: false, processesPersonalData: false } },
    { name: 'Color Converter',       icon: '🎨',  path: 'color-converter.html', badge: 'free',
      capabilities: { hasDownload: false, isBatch: false, processesPersonalData: false } },
    { name: 'JSON Query',            icon: '?{}', path: 'json-query.html',      badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
    { name: 'AES-256 File Encryption', icon: '🔐',  path: 'aes-encrypt.html',     badge: 'free',
      capabilities: { hasDownload: true,  isBatch: false, processesPersonalData: true } },
  ],
};
