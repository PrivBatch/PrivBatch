/*
 * bundle-mode.js - open-source stub
 *
 * In the hosted version this is "Bundle Mode" - the cross-tool workflow
 * that lets Pro users stack operations on the homepage, run them in
 * sequence, and download every step's output as a single audit-ready ZIP.
 * It also handles the internal-navigation guard for beforeunload.
 *
 * The OSS build has no Pro tier and no Bundle Mode, so this file is a
 * no-op.
 *
 * Exists only so the `<script src="../js/bundle-mode.js">` tag in each
 * tool HTML resolves (no 404). Tool code that reads PrivbatchBundle gets
 * no-op methods, and `isActive()` always returns false so Bundle-Mode
 * code paths are skipped cleanly.
 */
window.PrivbatchBundle = {
  init()       { /* no-op */ },
  isActive:    () => false,
  addCurrent() { /* no-op */ },
};
