/*
 * profile.js - open-source stub
 *
 * In the hosted version this powers the "Profile" modal (company name,
 * RoPA controller details, branding) which Pro Business users fill in
 * once and which the GDPR Documentation Suite reads at PDF generation
 * time. The open-source build has no Pro Business tier and no GDPR
 * Suite, so this file is a no-op.
 *
 * Exists only so the `<script src="../js/profile.js">` tag in each tool
 * HTML resolves (no 404). Tool code that reads PrivbatchProfile gets
 * empty defaults.
 */
window.PrivbatchProfile = {
  init() { /* no-op */ },
  open() { /* no-op */ },
  close() { /* no-op */ },
  load:  () => null,
  save:  () => false,
};
