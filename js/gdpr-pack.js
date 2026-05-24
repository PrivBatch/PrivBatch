/*
 * gdpr-pack.js - open-source stub
 *
 * In the hosted version this auto-injects a "Download + GDPR Pack" button
 * on every tool that produces a download, then bundles the output with a
 * per-batch compliance certificate (Article 30 RoPA entry, Consent
 * Receipt, source-identity audit log). Pro Business only.
 *
 * The OSS build has no GDPR Pack feature - the button never injects, and
 * this file is a no-op.
 *
 * Exists only so the `<script src="../js/gdpr-pack.js">` tag in each tool
 * HTML resolves (no 404). Tool code that reads PrivbatchGDPRPack gets
 * no-op methods that return safe defaults.
 */
window.PrivbatchGDPRPack = {
  init() { /* no-op */ },
  runPack:        () => Promise.resolve(null),
  currentTool:    () => null,
  sourceIdentityFor: () => 'oss',
};
