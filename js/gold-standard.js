/**
 * PrivBatch - Gold Standard features
 *
 * Provides ALL 7 Gold Standard features for every tool page.
 * Load in <head> (no defer/async) so network interception fires early.
 *
 * Usage in each tool page:
 *   // At end of body, after tool logic is defined:
 *   GoldStandard.init({
 *     toolName : 'CSV ↔ JSON',          // shown in History entries
 *     tier     : 'batch',               // 'batch' | 'free'
 *     onConvert: () => convertAll(),    // Ctrl+Enter (omit if not applicable)
 *     onDownload: () => downloadAll(),  // Ctrl+S    (omit if not applicable)
 *     shortcuts: [                      // custom rows in the shortcuts overlay
 *       { keys: ['Ctrl','Enter'], desc: 'Convert all files' },
 *       { keys: ['Ctrl','S'],     desc: 'Download all output' },
 *     ],
 *   });
 *
 * Public API:
 *   GoldStandard.History.save({ tool, timestamp, inputSize })
 *   GoldStandard.History.close()
 */

/* ══════════════════════════════════════════════════════════
   1. NETWORK INTERCEPTION
   Runs immediately (before DOMContentLoaded) so every
   fetch/XHR made during page load is counted.
   ══════════════════════════════════════════════════════════ */
window._pbNetCount = 0;
(function () {
  function bump() {
    window._pbNetCount++;
    var el = document.getElementById('pi-requests');
    if (el) el.textContent = window._pbNetCount;
  }
  /* Wrap fetch */
  if (window.fetch) {
    var _origFetch = window.fetch;
    window.fetch = function () { bump(); return _origFetch.apply(this, arguments); };
  }
  /* Wrap XHR */
  var _origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () { bump(); return _origOpen.apply(this, arguments); };
})();


/* ══════════════════════════════════════════════════════════
   2. GOLD STANDARD MODULE
   ══════════════════════════════════════════════════════════ */
const GoldStandard = (function () {
  'use strict';

  /* ── Internal options (set by init) ── */
  let _opts = {};

  /* ── Shorthand helpers ── */
  const $ = id => document.getElementById(id);
  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ══════════════════════════════════
     CSS INJECTION
     All Gold Standard styles live here.
     Tools no longer need to copy these.
  ══════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('pb-gs-styles')) return;
    const s = document.createElement('style');
    s.id = 'pb-gs-styles';
    s.textContent = `
      /* ── Settings bar baseline ──
         Several older tool files set "overflow-x: auto" on .settings-bar,
         which created a clipping context that hid native <select> popups
         (only the first <option> visible) AND clipped the Recent dropdown
         behind the output panel. Overriding here fixes every tool at once.
         Loaded later than tool-inline styles, so it wins the cascade. */
      .settings-bar { overflow: visible !important; }

      /* ── Toolbar horizontal scroll (overflow-driven, any width) ──
         When the toolbar is wider than the viewport, JS adds .sbar-scrollable
         and the bar scrolls horizontally with sticky edge arrows. When it fits,
         the class is absent and overflow stays visible so native <select>
         popups + the Recent dropdown are never clipped. The Recent dropdown is
         pinned with position:fixed in JS so the scroll container cannot clip it.
         Works on desktop (narrow windows / busy toolbars) and mobile alike. */
      .sbar-arrow { display: none; }
      .settings-bar.sbar-scrollable {
        overflow-x: auto !important; overflow-y: hidden !important;
        scrollbar-width: none; -ms-overflow-style: none;
        scroll-snap-type: x proximity; position: relative;
      }
      .settings-bar.sbar-scrollable::-webkit-scrollbar { display: none; }
      .settings-bar.sbar-scrollable > *:not(.sbar-arrow) { scroll-snap-align: start; }
      .settings-bar.sbar-scrollable .sbar-arrow {
        position: sticky; z-index: 6; flex: 0 0 auto;
        width: 24px; align-self: stretch; padding: 0;
        border: none; cursor: pointer;
        background: rgba(22,19,34,0.98); color: var(--accent);
        font-family: var(--mono); font-size: 16px; line-height: 1;
      }
      [data-theme="light"] .settings-bar.sbar-scrollable .sbar-arrow { background: rgba(245,239,230,0.98); }
      .sbar-arrow-l { left: 0;  box-shadow: 7px 0 9px -5px rgba(0,0,0,0.5); }
      .sbar-arrow-r { right: 0; box-shadow: -7px 0 9px -5px rgba(0,0,0,0.5); }
      .settings-bar.sbar-scrollable .sbar-arrow.visible { display: flex; align-items: center; justify-content: center; }
      /* M2: hide arrows on touch viewports - swipe is the natural gesture.
         The toolbar still scrolls horizontally via touch; only the
         mouse-affordance arrows go away. */
      @media (max-width: 768px) {
        .sbar-arrow,
        .settings-bar.sbar-scrollable .sbar-arrow.visible { display: none !important; }
      }

      /* ── Native <select> options - force dark surface ──
         Without this, browsers (esp. Chrome on Windows) render <option>
         elements with the OS default (white background, white text on
         our dark theme) making the dropdown menu effectively invisible
         until each row is hovered. */
      .settings-bar select option,
      select option {
        background-color: #1E1B2E;
        color: #E2E8F0;
      }

      /* ── Theme toggle (injected into tool-page header) ──
         Matches the inline .theme-toggle on index.html so the control
         looks and feels identical across homepage and tools. */
      .theme-toggle {
        font-family: var(--mono); font-size: 11px; font-weight: 600;
        padding: 5px 11px; cursor: pointer;
        border: 1px solid var(--border); border-radius: 6px;
        background: transparent; color: var(--text-3);
        transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
      }
      .theme-toggle:hover { color: var(--text-1); border-color: var(--border-h); }

      /* ── Settings bar GS buttons ── */
      .sbar-btn {
        font-family: var(--mono); font-size: 10px; font-weight: 600;
        padding: 4px 10px; cursor: pointer;
        border: 1px solid var(--border); border-radius: 6px;
        background: transparent; color: var(--text-3);
        transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
      }
      .sbar-btn:hover  { color: var(--text-1); border-color: rgba(167,139,250,0.4); }
      .sbar-btn.active { background: rgba(167,139,250,0.15); color: var(--accent); border-color: rgba(167,139,250,0.4); }

      /* ── Tier notice bar ── */
      .pb-tier-notice {
        background: rgba(167,139,250,0.04);
        border-bottom: 1px solid rgba(167,139,250,0.08);
        padding: 5px 24px;
        font-family: var(--mono); font-size: 10px; color: var(--text-3);
        display: flex; align-items: center; gap: 10px; flex-shrink: 0;
      }
      .pb-tier-notice a { color: var(--accent); text-decoration: none; opacity: 0.8; }
      .pb-tier-notice a:hover { opacity: 1; }

      /* ── Prove It panel ── */
      .pb-prove-it-panel {
        display: none; position: fixed; bottom: 24px; right: 24px;
        z-index: 1000; background: #1A1730;
        border: 1px solid rgba(167,139,250,0.4); border-radius: 10px;
        padding: 14px 16px; min-width: 230px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.55);
      }
      .pb-prove-it-panel.active { display: block; }
      .pb-pi-header {
        display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
        color: var(--free); font-family: var(--mono);
        font-size: 9px; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.08em;
      }
      .pb-pi-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: var(--free); flex-shrink: 0;
        animation: pb-pi-pulse 1.6s ease-in-out infinite;
      }
      @keyframes pb-pi-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      .pb-pi-rows  { display: flex; flex-direction: column; gap: 6px; }
      .pb-pi-row   { display: flex; justify-content: space-between; gap: 20px; font-family: var(--mono); font-size: 11px; }
      .pb-pi-label { color: var(--text-3); }
      .pb-pi-value { color: var(--text-1); font-weight: 600; }
      .pb-pi-local { color: var(--free) !important; }

      /* ── History dropdown ── */
      .pb-history-wrap { position: relative; }
      .pb-history-drop {
        position: absolute; top: calc(100% + 8px); left: 0; z-index: 10001;
        background: #1E1B2E; border: 1px solid rgba(167,139,250,0.3);
        border-radius: 8px; min-width: 270px;
        display: none; overflow: hidden; box-shadow: 0 8px 28px rgba(0,0,0,0.5);
      }
      .pb-history-drop.open { display: block; }
      .pb-history-hdr {
        padding: 9px 14px; border-bottom: 1px solid var(--border);
        font-family: var(--mono); font-size: 9px; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3);
      }
      .pb-history-item {
        display: block; width: 100%; text-align: left;
        padding: 9px 14px; background: none; border: none;
        border-bottom: 1px solid rgba(167,139,250,0.07);
        cursor: pointer; transition: background 0.12s;
      }
      .pb-history-item:last-child { border-bottom: none; }
      .pb-history-item:hover { background: rgba(167,139,250,0.08); }
      .pb-hi-name { font-family: var(--mono); font-size: 11px; color: var(--text-1); font-weight: 600; }
      .pb-hi-meta { font-family: var(--mono); font-size: 10px; color: var(--text-3); margin-top: 2px; }
      .pb-history-empty {
        padding: 16px 14px; font-family: var(--mono);
        font-size: 11px; color: var(--text-3); text-align: center;
      }

      /* ── Shared overlay backdrop ── */
      .pb-overlay {
        position: fixed; inset: 0; z-index: 2000;
        background: rgba(0,0,0,0.72);
        display: none; align-items: center; justify-content: center;
        backdrop-filter: blur(3px);
      }
      .pb-overlay.open { display: flex; }

      /* ── Shared modal shell ── */
      .pb-modal {
        background: #1A1730; border: 1px solid rgba(167,139,250,0.3);
        border-radius: 12px; overflow: hidden;
        min-width: 360px; max-width: 92vw;
        box-shadow: 0 24px 64px rgba(0,0,0,0.65);
      }
      .pb-modal-hdr {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 20px; border-bottom: 1px solid rgba(167,139,250,0.12);
      }
      .pb-modal-title { font-size: 13px; font-weight: 700; color: var(--text-1); letter-spacing: -0.2px; }
      .pb-modal-close {
        background: none; border: none; color: var(--text-3);
        font-size: 15px; cursor: pointer; padding: 2px 6px;
        border-radius: 4px; line-height: 1; transition: color 0.15s, background 0.15s;
      }
      .pb-modal-close:hover { color: var(--text-1); background: rgba(255,255,255,0.06); }
      .pb-modal-footer {
        padding: 10px 20px; border-top: 1px solid rgba(167,139,250,0.1);
        font-family: var(--mono); font-size: 9px; color: var(--text-3); text-align: center;
      }

      /* ── Keyboard shortcuts overlay ── */
      .pb-kbd-rows { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
      .pb-kbd-row  { display: flex; align-items: center; gap: 12px; }
      .pb-kbd-keys { display: flex; align-items: center; gap: 4px; min-width: 160px; }
      kbd {
        font-family: var(--mono); font-size: 10px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15); border-bottom-width: 2px;
        border-radius: 4px; padding: 2px 7px; color: var(--text-2); line-height: 1.4;
      }
      .pb-kbd-plus { font-family: var(--mono); font-size: 10px; color: var(--text-3); }
      .pb-kbd-desc { font-family: var(--mono); font-size: 11px; color: var(--text-3); }

      /* ── Tool switcher overlay ── */
      .pb-switcher { min-width: 420px; }
      .pb-search-wrap { padding: 12px 14px; border-bottom: 1px solid rgba(167,139,250,0.1); }
      .pb-search-input {
        width: 100%; box-sizing: border-box;
        background: rgba(0,0,0,0.25); border: 1px solid rgba(167,139,250,0.2);
        border-radius: 6px; color: var(--text-1);
        font-family: var(--mono); font-size: 12px;
        padding: 8px 12px; outline: none; transition: border-color 0.15s;
      }
      .pb-search-input:focus { border-color: rgba(167,139,250,0.5); }
      .pb-tool-list { max-height: 340px; overflow-y: auto; padding: 4px 0; }
      .pb-tool-item {
        display: flex; align-items: center; gap: 12px;
        padding: 8px 14px; cursor: pointer;
        background: none; border: none; width: 100%;
        text-align: left; transition: background 0.1s;
      }
      .pb-tool-item:hover, .pb-tool-item.pb-selected { background: rgba(167,139,250,0.1); }
      .pb-tool-icon  { font-family: var(--mono); font-size: 12px; color: var(--accent); min-width: 28px; text-align: center; flex-shrink: 0; }
      .pb-tool-name  { font-size: 13px; font-weight: 500; color: var(--text-2); }
      .pb-tool-item.pb-selected .pb-tool-name,
      .pb-tool-item:hover .pb-tool-name { color: var(--text-1); }
      .pb-tool-badge { margin-left: auto; font-family: var(--mono); font-size: 8px; font-weight: 600; text-transform: uppercase; color: var(--text-3); flex-shrink: 0; }
      .pb-no-results { padding: 24px 14px; font-family: var(--mono); font-size: 11px; color: var(--text-3); text-align: center; }
      .pb-switcher-hint { padding: 9px 14px; border-top: 1px solid rgba(167,139,250,0.08); font-family: var(--mono); font-size: 9px; color: var(--text-3); text-align: center; }
    `;
    document.head.appendChild(s);
  }


  /* ══════════════════════════════════
     HTML INJECTION
     Appends all GS chrome into <body>:
       • GS buttons at end of settings bar
       • Tier notice (batch tools only)
       • Prove It panel
       • Shortcuts overlay
       • Tool switcher overlay
  ══════════════════════════════════ */
  function _injectHTML() {
    const TOOLS = (typeof PRIVBATCH !== 'undefined') ? PRIVBATCH.TOOLS : [];
    const PERSONAL_URL = (typeof PRIVBATCH !== 'undefined')
      ? PRIVBATCH.URLS.UPGRADE_PRO
      : 'https://privbatch.gumroad.com/l/Privbatch-Pro';
    const FREE_LIMIT = (typeof PRIVBATCH !== 'undefined')
      ? PRIVBATCH.FREE_BATCH_LIMIT
      : 20;

    /* ── 1. GS buttons at end of settings bar ── */
    const settingsBar = document.querySelector('.settings-bar');
    if (settingsBar && !settingsBar.querySelector('#pb-btn-recent')) {
      const wrap = document.createElement('div');
      wrap.className = 'pb-gs-sbar-group';
      wrap.style.cssText = 'display:contents';
      wrap.innerHTML = `
        <div class="sbar-sep" aria-hidden="true"></div>
        <div class="sbar-group pb-history-wrap">
          <button class="sbar-btn" id="pb-btn-recent"
                  aria-haspopup="true" aria-expanded="false">Recent &#9662;</button>
          <div class="pb-history-drop" id="pb-history-drop" role="menu">
            <div class="pb-history-hdr">Last 5 operations</div>
            <div id="pb-history-list"></div>
          </div>
        </div>
        <div class="sbar-sep" aria-hidden="true"></div>
        <div class="sbar-group">
          <button class="sbar-btn" id="pb-btn-prove-it"
                  aria-pressed="false">&#128274; Prove It</button>
        </div>
        <div class="sbar-sep" aria-hidden="true"></div>
        <div class="sbar-group">
          <!-- Both buttons always in DOM; CSS media query (.pb-btn-desktop-only /
               .pb-btn-mobile-only in components.css) toggles which one shows.
               Init-time width check broke when window was resized after load
               (file-fixer.html bug report 2026-05-24). -->
          <button class="sbar-btn pb-btn-desktop-only" id="pb-btn-shortcuts">? Shortcuts</button>
          <button class="sbar-btn pb-btn-mobile-only" id="pb-btn-switcher" aria-label="Switch tool">&#8644; Tools</button>
        </div>`;
      settingsBar.appendChild(wrap);
    }

    /* ── 1b. Theme toggle in tool-page header (before license input) ── */
    const themeHdr = document.querySelector('header.header-tool .header-inner')
                  || document.querySelector('header .header-inner');
    if (themeHdr && !themeHdr.querySelector('#pb-theme-toggle')) {
      const tbtn = document.createElement('button');
      tbtn.className = 'theme-toggle';
      tbtn.id = 'pb-theme-toggle';
      tbtn.setAttribute('aria-label', 'Toggle light/dark mode');
      tbtn.textContent = '☀ Light';
      const licenseInput = themeHdr.querySelector('#license-input');
      if (licenseInput) {
        themeHdr.insertBefore(tbtn, licenseInput);
      } else {
        themeHdr.appendChild(tbtn);
      }
    }

    /* ── 2. Tier notice (batch tier only) ── */
    if (_opts.tier === 'batch' && !document.getElementById('pb-tier-notice')) {
      const notice = document.createElement('div');
      notice.className = 'pb-tier-notice';
      notice.id = 'pb-tier-notice';
      notice.innerHTML =
        `&#128274; Free tier &middot; ${FREE_LIMIT} files per batch &middot; watermark on output &nbsp;` +
        `<a href="${PERSONAL_URL}" target="_blank" rel="noopener">` +
        `Upgrade to Pro &middot; &euro;49 &middot; lifetime access &rarr;</a>`;
      const bar = document.querySelector('.settings-bar');
      if (bar && bar.nextSibling) {
        bar.parentNode.insertBefore(notice, bar.nextSibling);
      } else if (bar) {
        bar.parentNode.appendChild(notice);
      }
    }

    /* ── 3. Prove It panel ── */
    if (!document.getElementById('pb-prove-it-panel')) {
      const panel = document.createElement('div');
      panel.className = 'pb-prove-it-panel';
      panel.id = 'pb-prove-it-panel';
      panel.setAttribute('role', 'status');
      panel.setAttribute('aria-live', 'polite');
      panel.innerHTML = `
        <div class="pb-pi-header">
          <span class="pb-pi-dot"></span><span>Privacy Shield Active</span>
        </div>
        <div class="pb-pi-rows">
          <div class="pb-pi-row">
            <span class="pb-pi-label">Network requests</span>
            <span class="pb-pi-value" id="pi-requests">0</span>
          </div>
          <div class="pb-pi-row">
            <span class="pb-pi-label">Data sent</span>
            <span class="pb-pi-value">0 bytes</span>
          </div>
          <div class="pb-pi-row">
            <span class="pb-pi-label">Processing</span>
            <span class="pb-pi-value pb-pi-local">100% local</span>
          </div>
        </div>`;
      document.body.appendChild(panel);
    }

    /* ── 4. Shortcuts overlay ── */
    if (!document.getElementById('pb-shortcut-overlay')) {
      const rows = (_opts.shortcuts || [
        { keys: ['Ctrl', 'Enter'], desc: 'Run / process' },
        { keys: ['Ctrl', 'S'],     desc: 'Download output' },
        { keys: ['Ctrl', 'K'],     desc: 'Open tool switcher' },
        { keys: ['Escape'],        desc: 'Close overlay / clear' },
        { keys: ['?'],             desc: 'Toggle this overlay' },
      ]).map(r =>
        `<div class="pb-kbd-row">
          <div class="pb-kbd-keys">${r.keys.map(k => `<kbd>${esc(k)}</kbd>`).join('<span class="pb-kbd-plus">+</span>')}</div>
          <span class="pb-kbd-desc">${esc(r.desc)}</span>
        </div>`
      ).join('');

      const overlay = document.createElement('div');
      overlay.className = 'pb-overlay';
      overlay.id = 'pb-shortcut-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = `
        <div class="pb-modal" role="document">
          <div class="pb-modal-hdr">
            <span class="pb-modal-title">Keyboard Shortcuts</span>
            <button class="pb-modal-close" id="pb-shortcut-close">&#10005;</button>
          </div>
          <div class="pb-kbd-rows">${rows}</div>
          <div class="pb-modal-footer">Click outside or press Escape to close</div>
        </div>`;
      document.body.appendChild(overlay);
    }

    /* ── 5. Tool switcher overlay ── */
    if (!document.getElementById('pb-switcher-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'pb-overlay';
      overlay.id = 'pb-switcher-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = `
        <div class="pb-modal pb-switcher" role="document">
          <div class="pb-modal-hdr">
            <span class="pb-modal-title">Switch Tool</span>
            <button class="pb-modal-close" id="pb-switcher-close">&#10005;</button>
          </div>
          <div class="pb-search-wrap">
            <input class="pb-search-input" id="pb-switcher-search"
                   type="text" placeholder="Search tools…" autocomplete="off">
          </div>
          <div class="pb-tool-list" id="pb-switcher-list" role="listbox"></div>
          <div class="pb-switcher-hint">&#8593;&#8595; navigate &nbsp;&middot;&nbsp; Enter open &nbsp;&middot;&nbsp; Esc close</div>
        </div>`;
      document.body.appendChild(overlay);
    }
  }


  /* ══════════════════════════════════
     PROVE IT
  ══════════════════════════════════ */
  function _initProveIt() {
    const btn   = $('pb-btn-prove-it');
    const panel = $('pb-prove-it-panel');
    if (!btn || !panel) return;

    function toggle() {
      const active = panel.classList.toggle('active');
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
      localStorage.setItem('pb_prove_it', active ? '1' : '0');
      if (active) {
        const el = $('pi-requests');
        if (el) el.textContent = window._pbNetCount;
      }
    }

    btn.addEventListener('click', toggle);

    /* Restore state */
    if (localStorage.getItem('pb_prove_it') === '1') {
      panel.classList.add('active');
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      const el = $('pi-requests');
      if (el) el.textContent = window._pbNetCount;
    }
  }


  /* ══════════════════════════════════
     HISTORY  (last 5 operations)
  ══════════════════════════════════ */
  const History = (function () {
    const STORAGE_KEY = 'pb_history';
    const MAX = 5;

    function _load() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    }

    function _fmtSize(b) {
      if (!b) return '0 B';
      if (b < 1024) return b + ' B';
      if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
      return (b / 1048576).toFixed(1) + ' MB';
    }

    function _fmtTime(ts) {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function save(entry) {
      const items = _load();
      items.unshift(entry);
      if (items.length > MAX) items.length = MAX;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (_) {}
    }

    function _renderList() {
      const items = _load();
      const list = $('pb-history-list');
      if (!list) return;
      if (!items.length) {
        list.innerHTML = '<div class="pb-history-empty">No recent operations yet</div>';
        return;
      }
      const TOOLS = (typeof PRIVBATCH !== 'undefined') ? PRIVBATCH.TOOLS : [];
      list.innerHTML = items.map((item, i) =>
        `<button class="pb-history-item" data-i="${i}" role="menuitem">
          <div class="pb-hi-name">${esc(item.tool || '')}</div>
          <div class="pb-hi-meta">${_fmtTime(item.timestamp)} · ${_fmtSize(item.inputSize)}</div>
        </button>`
      ).join('');
      list.querySelectorAll('.pb-history-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = _load()[+btn.dataset.i];
          const t = TOOLS.find(x => x.name === item?.tool);
          if (t) window.location.href = t.path;
          close();
        });
      });
    }

    function toggle() {
      const drop = $('pb-history-drop');
      const btn  = $('pb-btn-recent');
      if (!drop || !btn) return;
      const isOpen = drop.classList.contains('open');
      if (!isOpen) {
        _renderList();
        /* Pin with fixed positioning so a horizontally-scrolling toolbar
           (mobile) cannot clip the dropdown. Works in both themes/orientations. */
        const r = btn.getBoundingClientRect();
        drop.style.position = 'fixed';
        drop.style.top = (r.bottom + 6) + 'px';
        drop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 280)) + 'px';
      }
      drop.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    }

    function close() {
      const drop = $('pb-history-drop');
      const btn  = $('pb-btn-recent');
      if (drop) drop.classList.remove('open');
      if (btn)  btn.setAttribute('aria-expanded', 'false');
    }

    return { save, toggle, close };
  })();


  /* ══════════════════════════════════
     SHORTCUTS OVERLAY
  ══════════════════════════════════ */
  function _toggleShortcuts() {
    const o = $('pb-shortcut-overlay');
    if (o) o.classList.toggle('open');
  }
  function _closeShortcuts() {
    const o = $('pb-shortcut-overlay');
    if (o && o.classList.contains('open')) { o.classList.remove('open'); return true; }
    return false;
  }

  function _initShortcutsOverlay() {
    const closeBtn = $('pb-shortcut-close');
    const overlay  = $('pb-shortcut-overlay');
    if (closeBtn) closeBtn.addEventListener('click', _closeShortcuts);
    if (overlay)  overlay.addEventListener('click', e => {
      if (e.target === overlay) _closeShortcuts();
    });
    $('pb-btn-shortcuts')?.addEventListener('click', _toggleShortcuts);
  }


  /* ══════════════════════════════════
     TOOL SWITCHER
  ══════════════════════════════════ */
  const Switcher = (function () {
    const TOOLS = () => (typeof PRIVBATCH !== 'undefined') ? PRIVBATCH.TOOLS : [];
    let _selIdx = 0;
    let _filtered = [];

    function _renderList() {
      const list = $('pb-switcher-list');
      if (!list) return;
      if (!_filtered.length) {
        list.innerHTML = '<div class="pb-no-results">No tools match</div>';
        return;
      }
      list.innerHTML = _filtered.map((t, i) =>
        `<button class="pb-tool-item${i === _selIdx ? ' pb-selected' : ''}"
                 data-i="${i}" role="option">
          <span class="pb-tool-icon">${esc(t.icon)}</span>
          <span class="pb-tool-name">${esc(t.name)}</span>
          <span class="pb-tool-badge">${t.badge === 'pro' ? 'PRO' : ''}</span>
        </button>`
      ).join('');
      list.querySelectorAll('.pb-tool-item').forEach((btn, i) => {
        btn.addEventListener('click', () => window.location.href = _filtered[i].path);
        btn.addEventListener('mouseenter', () => { _selIdx = i; _updateSel(); });
      });
      const sel = list.querySelector('.pb-selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function _updateSel() {
      document.querySelectorAll('.pb-tool-item').forEach((el, i) =>
        el.classList.toggle('pb-selected', i === _selIdx)
      );
      const sel = $('pb-switcher-list')?.querySelector('.pb-selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }

    function open() {
      const overlay = $('pb-switcher-overlay');
      if (!overlay) return;
      overlay.classList.add('open');
      _filtered = TOOLS().slice();
      _selIdx = 0;
      const search = $('pb-switcher-search');
      if (search) search.value = '';
      _renderList();
      setTimeout(() => $('pb-switcher-search')?.focus(), 40);
    }

    function close() {
      $('pb-switcher-overlay')?.classList.remove('open');
    }

    function onSearch(q) {
      const lq = q.toLowerCase().trim();
      _filtered = lq
        ? TOOLS().filter(t => t.name.toLowerCase().includes(lq))
        : TOOLS().slice();
      _selIdx = 0;
      _renderList();
    }

    function onKey(e) {
      const overlay = $('pb-switcher-overlay');
      if (!overlay?.classList.contains('open')) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _selIdx = Math.min(_selIdx + 1, _filtered.length - 1);
        _updateSel();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _selIdx = Math.max(_selIdx - 1, 0);
        _updateSel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (_filtered[_selIdx]) window.location.href = _filtered[_selIdx].path;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }

    function init() {
      $('pb-switcher-search')?.addEventListener('input', e => onSearch(e.target.value));
      $('pb-switcher-close')?.addEventListener('click', close);
      $('pb-switcher-overlay')?.addEventListener('click', e => {
        if (e.target === $('pb-switcher-overlay')) close();
      });
      /* Mobile toolbar button (M3 - replaces the "? Shortcuts" button at
         widths < 768px; opens the same overlay as Ctrl+K does on desktop). */
      $('pb-btn-switcher')?.addEventListener('click', open);
    }

    return { open, close, onKey, onSearch, init };
  })();


  /* ══════════════════════════════════
     TIER NOTICE VISIBILITY
     Listens to privbatch:tierchange and
     hides the notice for Pro/Business.
  ══════════════════════════════════ */
  function _initTierListener() {
    document.addEventListener('privbatch:tierchange', e => {
      const notice = $('pb-tier-notice');
      if (notice) notice.style.display = e.detail.tier !== 'free' ? 'none' : '';
    });
    /* Restore on load */
    try {
      const raw = localStorage.getItem('privbatch_license');
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored?.tier && stored.tier !== 'free') {
          const notice = $('pb-tier-notice');
          if (notice) notice.style.display = 'none';
        }
      }
    } catch (_) {}
  }


  /* ══════════════════════════════════
     GLOBAL KEYBOARD HANDLER
  ══════════════════════════════════ */
  function _initKeyboard() {
    document.addEventListener('keydown', function (e) {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      /* Let Switcher handle arrow/enter keys when open */
      Switcher.onKey(e);
      if (e.defaultPrevented) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter' && _opts.onConvert) {
          e.preventDefault(); _opts.onConvert();
        } else if (e.key === 's' && _opts.onDownload) {
          e.preventDefault(); _opts.onDownload();
        } else if (e.key === 'k') {
          e.preventDefault(); Switcher.open();
        }
        return;
      }

      if (e.key === 'Escape') {
        if ($('pb-switcher-overlay')?.classList.contains('open'))  { Switcher.close();    return; }
        if ($('pb-shortcut-overlay')?.classList.contains('open'))  { _closeShortcuts();   return; }
        if ($('pb-history-drop')?.classList.contains('open'))      { History.close();     return; }
        if (_opts.onEscape) _opts.onEscape();
        return;
      }

      if (e.key === '?' && !inInput) { _toggleShortcuts(); return; }
    });

    /* Close history on any outside click */
    document.addEventListener('click', () => History.close());
  }


  /* ══════════════════════════════════
     HISTORY BUTTON
  ══════════════════════════════════ */
  function _initHistoryBtn() {
    const btn = $('pb-btn-recent');
    if (btn) btn.addEventListener('click', e => { e.stopPropagation(); History.toggle(); });
  }


  /* ══════════════════════════════════
     THEME TOGGLE
     Mirrors the inline IIFE on index.html so the toggle behaves
     identically across homepage and tool pages. Key shared via
     localStorage('pb_theme'), so toggling on one page persists to
     the next. Default (no saved pref) leaves the page on its
     authored default theme (dark) - same as index.html.
  ══════════════════════════════════ */
  function _initThemeToggle() {
    const btn = $('pb-theme-toggle');
    if (!btn) return;
    const html = document.documentElement;
    const PREF_KEY = 'pb_theme';
    function apply(theme) {
      html.setAttribute('data-theme', theme);
      btn.textContent = theme === 'light' ? '🌙 Dark' : '☀ Light';
      try { localStorage.setItem(PREF_KEY, theme); } catch (_) {}
    }
    btn.addEventListener('click', () =>
      apply(html.getAttribute('data-theme') === 'light' ? 'dark' : 'light'));
    let saved = null;
    try { saved = localStorage.getItem(PREF_KEY); } catch (_) {}
    if (saved) apply(saved);
  }


  /* ══════════════════════════════════
     STATS BAR (shared)
     Canonical "Processed in… saved vs cloud" line.
     Used by data-conversion tools (json-formatter,
     yaml-json, url-encoder, env-formatter, etc.).
     Tools with different verbs ("Fixed in",
     "Converted in", "Hashed in" etc.) keep their
     own local implementations on purpose.
  ══════════════════════════════════ */
  function _fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function showStatsBar(el, ms, inBytes, outBytes) {
    if (!el) return;
    const saved = Math.max(500, ms * 200);
    el.textContent =
      `Processed in ${ms}ms locally · ${_fmtSize(inBytes)} in → ${_fmtSize(outBytes)} out · ` +
      `0 bytes sent to any server · ~${saved}ms saved vs cloud`;
    if (!el.classList.contains('stats-bar')) el.classList.add('stats-bar');
    el.classList.add('visible');
  }


  /* ══════════════════════════════════
     TOOLBAR HORIZONTAL SCROLL + ARROWS
     Sticky arrow buttons appear at the bar edges only when it overflows
     (narrow screens). Touch swipe works natively; the arrows serve mouse
     users on narrow windows. CSS gates the actual scroll to <=720px.
  ══════════════════════════════════ */
  function _initToolbarScroll() {
    const bar = document.querySelector('.settings-bar');
    if (!bar || bar.dataset.pbScroll) return;
    bar.dataset.pbScroll = '1';

    const mk = dir => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sbar-arrow sbar-arrow-' + dir;
      b.setAttribute('aria-label', dir === 'l' ? 'Scroll toolbar left' : 'Scroll toolbar right');
      b.textContent = dir === 'l' ? '‹' : '›';   /* ‹ › */
      return b;
    };
    const left = mk('l'), right = mk('r');
    bar.insertBefore(left, bar.firstChild);
    bar.appendChild(right);

    left.addEventListener('click',  () => bar.scrollBy({ left: -180, behavior: 'smooth' }));
    right.addEventListener('click', () => bar.scrollBy({ left:  180, behavior: 'smooth' }));

    function update() {
      const overflow = bar.scrollWidth - bar.clientWidth > 4;
      bar.classList.toggle('sbar-scrollable', overflow);   /* enables scroll + arrows at any width */
      left.classList.toggle('visible',  overflow && bar.scrollLeft > 2);
      right.classList.toggle('visible', overflow && bar.scrollLeft < bar.scrollWidth - bar.clientWidth - 2);
    }
    bar.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    /* run after layout settles + once more for late-injected toolbar buttons */
    setTimeout(update, 120);
    setTimeout(update, 600);
    update();
  }


  /* ══════════════════════════════════
     SHARED-MODULE LOADER
     Injects profile.js + gdpr-pack.js on every tool page (zero edits to the
     tool HTML files). Guarded so a page that already loads them (gdpr-suite)
     is not double-loaded. Local <script> tags are not fetch/XHR, so they do
     not count against Prove It.
  ══════════════════════════════════ */
  function _jsBase() {
    const me = document.querySelector('script[src*="gold-standard.js"]');
    if (me) return me.src.replace(/gold-standard\.js.*$/, '');
    return '../js/';
  }
  function _loadOnce(src, alreadyDefined) {
    if (alreadyDefined) return;
    if (document.querySelector('script[data-pbmod="' + src + '"]')) return;
    const s = document.createElement('script');
    s.src = src; s.dataset.pbmod = src;
    s.async = false;   /* preserve execution order: gdpr-pack before bundle-mode */
    document.head.appendChild(s);
  }
  function _loadSharedModules() {
    const base = _jsBase();
    /* Versioned so returning users get the current modules (cache bust).
       ui-toast must load first so profile/gdpr-pack/bundle-mode can call its
       PrivbatchToast + PrivbatchConfirm helpers. gdpr-pack must load before
       bundle-mode (bundle-mode reuses its capture + ensureLibs); both auto-init
       on DOMContentLoaded so order is for availability, not init timing. */
    _loadOnce(base + 'ui-toast.js?v=1',    typeof window.PrivbatchToast !== 'undefined');
    _loadOnce(base + 'profile.js?v=7',     typeof PrivbatchProfile !== 'undefined');
    _loadOnce(base + 'gdpr-pack.js?v=9',   typeof PrivbatchGDPRPack !== 'undefined');
    _loadOnce(base + 'bundle-mode.js?v=10', typeof PrivbatchBundle !== 'undefined');
  }

  /* ══════════════════════════════════
     PUBLIC INIT
  ══════════════════════════════════ */
  function init(opts) {
    _opts = opts || {};
    _injectCSS();
    _injectHTML();
    _initProveIt();
    _initShortcutsOverlay();
    Switcher.init();
    _initHistoryBtn();
    _initThemeToggle();
    _initTierListener();
    _initKeyboard();
    _initToolbarScroll();
    _loadSharedModules();
  }

  return { init, History, Switcher, showStatsBar };

})();
