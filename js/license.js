/*
 * license.js - open-source stub
 *
 * In the hosted version at privbatch.com, this file talks to the Gumroad
 * license-verification API and sets the user's tier to 'pro' or 'business'
 * when a valid key is present. The open-source build does NOT include the
 * license server or any Gumroad integration - every tool runs in free-tier
 * mode for everyone, with no batch limit or watermark gating.
 *
 * This stub exists so the `<script src="../js/license.js">` tag in each
 * tool HTML resolves cleanly (no 404) and any `LicenseManager.*` call
 * returns the free-tier default. If you want to add tier gating to a
 * self-hosted fork, replace this file with your own implementation.
 */
window.LicenseManager = {
  init() { /* no-op */ },
  isPro: () => false,
  isProBusiness: () => false,
  getStatus: () => 'free',
  getTier: () => 'free',
  verify: () => Promise.resolve(false),
};
