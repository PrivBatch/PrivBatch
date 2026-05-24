/**
 * PrivBatch - Toast + Confirm modal primitives.
 *
 * PrivbatchToast.show(message, options) -> { dismiss }
 *   options.type:     'info' | 'success' | 'warning' | 'error' (default 'info')
 *   options.duration: ms before auto-dismiss (default 3000; 0 = sticky, dismiss on click only)
 *
 * PrivbatchConfirm.show(options) -> Promise<boolean>
 *   options.title:        modal title (default 'Confirm')
 *   options.message:      body text
 *   options.confirmLabel: confirm button text (default 'Confirm')
 *   options.cancelLabel:  cancel button text (default 'Cancel')
 *   options.type:         'default' | 'destructive' (default 'default'; destructive uses red accent)
 *
 * Self-contained. Idempotent CSS injection. Used in place of native alert()
 * and confirm() across gdpr-pack, bundle-mode, profile. Available globally as
 * window.PrivbatchToast + window.PrivbatchConfirm.
 *
 * Loaded on every page where bundle-mode.js might trigger UI (tool pages via
 * gold-standard.js loader, plus the homepage + gdpr-suite via direct script tag).
 */
(function () {
  'use strict';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function injectCSS() {
    if (document.getElementById('pb-ui-toast-styles')) return;
    const s = document.createElement('style');
    s.id = 'pb-ui-toast-styles';
    s.textContent = `
      /* ── Toast host + items ── */
      .pb-toast-host {
        position: fixed; bottom: 24px; right: 24px;
        z-index: 9999;
        display: flex; flex-direction: column-reverse; gap: 8px;
        pointer-events: none;
        max-width: calc(100% - 48px);
      }
      .pb-toast {
        pointer-events: auto;
        background: #1A1730; color: #f4f3f8;
        border: 1px solid rgba(167,139,250,0.3);
        border-left: 3px solid #A78BFA;
        border-radius: 8px;
        padding: 11px 14px;
        font-family: var(--mono, ui-monospace, monospace);
        font-size: 12px; line-height: 1.55;
        min-width: 240px; max-width: 380px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.5);
        cursor: pointer;
        animation: pb-toast-in 0.22s ease-out;
      }
      .pb-toast.pb-toast-out { animation: pb-toast-out 0.18s ease-in forwards; }
      .pb-toast-success { border-left-color: #2DD4BF; }
      .pb-toast-warning { border-left-color: #F59E0B; }
      .pb-toast-error   { border-left-color: #EF4444; }
      @keyframes pb-toast-in  { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes pb-toast-out { to { transform: translateX(20px); opacity: 0; } }

      [data-theme="light"] .pb-toast {
        background: #ffffff; color: #1a1730;
        border-color: rgba(167,139,250,0.4);
        box-shadow: 0 12px 32px rgba(20,15,40,0.18);
      }

      @media (max-width: 640px) {
        .pb-toast-host { top: 12px; right: 12px; left: 12px; bottom: auto; max-width: none; }
        .pb-toast { min-width: 0; max-width: none; }
      }

      /* ── Confirm modal ── */
      .pb-confirm-overlay {
        position: fixed; inset: 0; z-index: 9998;
        background: rgba(0,0,0,0.72);
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(3px);
        opacity: 0; transition: opacity 0.15s;
        padding: 16px;
      }
      .pb-confirm-overlay.open { opacity: 1; }
      .pb-confirm-modal {
        background: #1A1730; color: #f4f3f8;
        border: 1px solid rgba(167,139,250,0.3);
        border-radius: 12px; overflow: hidden;
        width: 100%; max-width: 420px;
        box-shadow: 0 24px 64px rgba(0,0,0,0.65);
        transform: translateY(8px); transition: transform 0.18s ease-out;
      }
      .pb-confirm-overlay.open .pb-confirm-modal { transform: translateY(0); }
      [data-theme="light"] .pb-confirm-modal { background: #ffffff; color: #1a1730; border-color: rgba(167,139,250,0.4); }

      .pb-confirm-hdr {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 20px; border-bottom: 1px solid rgba(167,139,250,0.12);
      }
      .pb-confirm-title { font-size: 14px; font-weight: 700; letter-spacing: -0.2px; }
      .pb-confirm-close {
        background: none; border: none; color: #a09ab8;
        font-size: 15px; cursor: pointer; padding: 2px 6px;
        border-radius: 4px; line-height: 1;
        transition: color 0.15s, background 0.15s;
      }
      .pb-confirm-close:hover { color: #f4f3f8; background: rgba(255,255,255,0.06); }
      [data-theme="light"] .pb-confirm-close:hover { color: #1a1730; background: rgba(0,0,0,0.05); }

      .pb-confirm-body {
        padding: 16px 20px; font-size: 13px; color: #c4b8f0; line-height: 1.6;
      }
      [data-theme="light"] .pb-confirm-body { color: #3a3550; }

      .pb-confirm-actions {
        display: flex; gap: 8px; padding: 12px 20px 16px;
        justify-content: flex-end; flex-wrap: wrap;
        border-top: 1px solid rgba(167,139,250,0.1);
      }
      .pb-confirm-cancel, .pb-confirm-ok {
        font-family: var(--mono, ui-monospace, monospace);
        font-size: 11px; font-weight: 600;
        padding: 8px 14px; border-radius: 6px; cursor: pointer;
        transition: opacity 0.15s, background 0.15s, border-color 0.15s;
        white-space: nowrap;
      }
      .pb-confirm-cancel {
        background: transparent; color: #c4b8f0;
        border: 1px solid rgba(167,139,250,0.25);
      }
      .pb-confirm-cancel:hover { color: #f4f3f8; border-color: rgba(167,139,250,0.5); }
      [data-theme="light"] .pb-confirm-cancel { color: #3a3550; }
      [data-theme="light"] .pb-confirm-cancel:hover { color: #1a1730; }

      .pb-confirm-ok {
        background: #A78BFA; color: #13111C;
        border: 1px solid #A78BFA;
      }
      .pb-confirm-ok:hover { opacity: 0.9; }
      .pb-confirm-ok.pb-confirm-destructive {
        background: #EF4444; border-color: #EF4444; color: #ffffff;
      }
      .pb-confirm-ok:focus-visible, .pb-confirm-cancel:focus-visible {
        outline: 2px solid rgba(167,139,250,0.6); outline-offset: 2px;
      }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════
     TOAST
  ══════════════════════════════════ */
  let _host = null;
  function ensureHost() {
    if (_host && document.body.contains(_host)) return _host;
    _host = document.createElement('div');
    _host.className = 'pb-toast-host';
    _host.setAttribute('aria-live', 'polite');
    _host.setAttribute('aria-atomic', 'true');
    document.body.appendChild(_host);
    return _host;
  }

  function showToast(message, options) {
    injectCSS();
    const opts = options || {};
    const type = opts.type || 'info';
    const duration = opts.duration === undefined ? 3000 : opts.duration;
    const el = document.createElement('div');
    el.className = 'pb-toast pb-toast-' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = String(message == null ? '' : message);
    ensureHost().appendChild(el);
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      el.classList.add('pb-toast-out');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    };
    el.addEventListener('click', dismiss);
    if (duration > 0) setTimeout(dismiss, duration);
    return { dismiss };
  }

  /* ══════════════════════════════════
     CONFIRM
  ══════════════════════════════════ */
  function showConfirm(options) {
    injectCSS();
    options = options || {};
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'pb-confirm-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      const isDestructive = options.type === 'destructive';
      const title = options.title || 'Confirm';
      const message = options.message || '';
      const okLabel = options.confirmLabel || 'Confirm';
      const cancelLabel = options.cancelLabel || 'Cancel';
      overlay.innerHTML =
        '<div class="pb-confirm-modal" role="document" aria-labelledby="pb-confirm-title">' +
          '<div class="pb-confirm-hdr">' +
            '<span class="pb-confirm-title" id="pb-confirm-title">' + esc(title) + '</span>' +
            '<button class="pb-confirm-close" aria-label="Cancel">&#10005;</button>' +
          '</div>' +
          '<div class="pb-confirm-body">' + esc(message) + '</div>' +
          '<div class="pb-confirm-actions">' +
            '<button class="pb-confirm-cancel">' + esc(cancelLabel) + '</button>' +
            '<button class="pb-confirm-ok' + (isDestructive ? ' pb-confirm-destructive' : '') + '">' + esc(okLabel) + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('open'));

      let resolved = false;
      const done = val => {
        if (resolved) return;
        resolved = true;
        document.removeEventListener('keydown', onKey);
        overlay.classList.remove('open');
        setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
        resolve(val);
      };
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); done(false); }
        else if (e.key === 'Enter') { e.preventDefault(); done(true); }
      };
      document.addEventListener('keydown', onKey);
      overlay.querySelector('.pb-confirm-close').addEventListener('click', () => done(false));
      overlay.querySelector('.pb-confirm-cancel').addEventListener('click', () => done(false));
      overlay.querySelector('.pb-confirm-ok').addEventListener('click', () => done(true));
      overlay.addEventListener('click', e => { if (e.target === overlay) done(false); });
      setTimeout(() => { const ok = overlay.querySelector('.pb-confirm-ok'); if (ok) ok.focus(); }, 50);
    });
  }

  if (typeof window !== 'undefined') {
    window.PrivbatchToast = { show: showToast };
    window.PrivbatchConfirm = { show: showConfirm };
  }
})();
