/**
 * oss-page-chrome.js - OSS-only header/footer enhancements
 *
 * Injects "Hosted version" + "GitHub" links into every page so visitors
 * landing directly on a deep link (e.g. /tools/json-formatter.html) can
 * always find privbatch.com (the hosted full version) and the OSS source.
 *
 * Loaded ONLY in the open-source repo. Not present in the hosted site.
 */
(function () {
  'use strict';
  const GITHUB_URL = 'https://github.com/privbatch/privbatch';
  const HOSTED_URL = 'https://privbatch.com';

  function injectLinks() {
    // Find the page header (tool pages use .header-tool .header-inner;
    // homepage uses .header > anything-flex)
    const header = document.querySelector('.header-tool .header-inner, .header');
    if (!header) return;

    // Don't inject twice if the script is somehow loaded multiple times
    if (header.querySelector('.oss-hosted-link')) return;

    const hosted = document.createElement('a');
    hosted.className = 'oss-hosted-link';
    hosted.href = HOSTED_URL;
    hosted.target = '_blank';
    hosted.rel = 'noopener';
    hosted.textContent = 'Hosted version →';
    hosted.setAttribute('aria-label', 'Open privbatch.com - the full hosted version');
    Object.assign(hosted.style, {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      color: '#A78BFA',
      textDecoration: 'none',
      padding: '5px 10px',
      border: '1px solid rgba(167,139,250,0.3)',
      borderRadius: '5px',
      whiteSpace: 'nowrap',
      marginLeft: '8px',
    });

    const github = document.createElement('a');
    github.className = 'oss-github-link';
    github.href = GITHUB_URL;
    github.target = '_blank';
    github.rel = 'noopener';
    github.textContent = 'GitHub';
    github.setAttribute('aria-label', 'View source on GitHub');
    Object.assign(github.style, {
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      color: '#c7d3e3',
      textDecoration: 'none',
      padding: '5px 10px',
      border: '1px solid rgba(167,139,250,0.18)',
      borderRadius: '5px',
      whiteSpace: 'nowrap',
      marginLeft: '6px',
    });

    /* Tool pages: hide the license input (no licence verification in OSS),
       then append the OSS links at the end. */
    const licenseInput = header.querySelector('.license-input');
    if (licenseInput) licenseInput.style.display = 'none';
    const licenseUnlocked = header.querySelector('.license-unlocked');
    if (licenseUnlocked) licenseUnlocked.style.display = 'none';

    header.appendChild(github);
    header.appendChild(hosted);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLinks);
  } else {
    injectLinks();
  }
})();
