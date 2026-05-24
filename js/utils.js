/**
 * PrivBatch shared utilities.
 * All functions are pure or depend only on LicenseManager (loaded separately).
 */

/**
 * Convert a byte count to a human-readable size string.
 *   formatFileSize(1023)        → "1023 B"
 *   formatFileSize(1024)        → "1.0 KB"
 *   formatFileSize(1536)        → "1.5 KB"
 *   formatFileSize(2097152)     → "2.0 MB"
 */
function formatFileSize(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1048576)     return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824)  return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

/**
 * Return a watermark string for free-tier output files.
 * Appended as a plain-text comment AFTER the closing bracket,
 * completely outside the JSON/CSV structure.
 * @param {'json'|'csv'|'xml'} [type='json']
 */
function generateWatermark(type) {
  const url = 'privbatch.gumroad.com/l/Privbatch-Pro';
  if (type === 'xml')  return `\n<!-- Converted with PrivBatch.com | ${url} -->`;
  if (type === 'csv')  return `\n# Converted with PrivBatch.com | ${url}`;
  return `\n// Converted with PrivBatch.com | ${url}`;
}

/**
 * Track a free-tier batch-limit hit and show a nudge modal on the 3rd hit.
 * Counter stored in localStorage as `privbatch_limit_hits`.
 * "Maybe later" dismisses and resets to 0 so the cycle repeats after 3 more hits.
 */
function trackLimitHit() {
  let hits = 0;
  try { hits = parseInt(localStorage.getItem('privbatch_limit_hits') || '0', 10) || 0; } catch (_) {}
  hits += 1;
  try { localStorage.setItem('privbatch_limit_hits', String(hits)); } catch (_) {}
  if (hits === 3) _showLimitNudge();
}

function _showLimitNudge() {
  /* Inject styles once */
  if (!document.getElementById('pb-nudge-css')) {
    const s = document.createElement('style');
    s.id = 'pb-nudge-css';
    s.textContent = `
      .pb-nudge-backdrop {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(8,6,20,0.72);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        animation: pb-fade-in 0.18s ease;
      }
      @keyframes pb-fade-in { from { opacity: 0 } to { opacity: 1 } }
      .pb-nudge-box {
        background: #1a1726;
        border: 1px solid rgba(167,139,250,0.28);
        border-radius: 16px;
        padding: 32px 28px 24px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 24px 64px rgba(0,0,0,0.6);
        font-family: system-ui, -apple-system, sans-serif;
        animation: pb-slide-up 0.2s ease;
      }
      @keyframes pb-slide-up { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      .pb-nudge-icon { font-size: 24px; margin-bottom: 12px; }
      .pb-nudge-title {
        font-size: 17px; font-weight: 700; color: #f4f3f8;
        letter-spacing: -0.3px; margin-bottom: 10px;
      }
      .pb-nudge-body {
        font-size: 13px; color: #a09ab8; line-height: 1.65; margin-bottom: 16px;
      }
      .pb-nudge-plan {
        font-family: ui-monospace, monospace;
        font-size: 11px; font-weight: 600;
        color: rgba(167,139,250,0.9);
        background: rgba(167,139,250,0.08);
        border: 1px solid rgba(167,139,250,0.2);
        border-radius: 6px;
        padding: 8px 12px;
        margin-bottom: 20px;
      }
      .pb-nudge-actions { display: flex; gap: 10px; }
      .pb-nudge-upgrade {
        flex: 1; display: block;
        text-align: center; text-decoration: none;
        background: #a78bfa; color: #13111c;
        font-size: 13px; font-weight: 700;
        padding: 10px 16px; border-radius: 8px;
        border: none; cursor: pointer;
        transition: opacity 0.15s;
      }
      .pb-nudge-upgrade:hover { opacity: 0.88; }
      .pb-nudge-later {
        flex: 1; background: transparent;
        border: 1px solid rgba(167,139,250,0.22);
        color: #a09ab8; font-size: 13px; font-weight: 500;
        padding: 10px 16px; border-radius: 8px;
        cursor: pointer; transition: border-color 0.15s, color 0.15s;
      }
      .pb-nudge-later:hover { border-color: rgba(167,139,250,0.45); color: #c4b8f0; }
    `;
    document.head.appendChild(s);
  }

  /* Remove stale modal */
  document.getElementById('pb-nudge')?.remove();

  /* Build modal */
  const backdrop = document.createElement('div');
  backdrop.id = 'pb-nudge';
  backdrop.className = 'pb-nudge-backdrop';
  backdrop.innerHTML = `
    <div class="pb-nudge-box" role="dialog" aria-modal="true" aria-labelledby="pb-nudge-title">
      <div class="pb-nudge-icon">&#128075;</div>
      <div class="pb-nudge-title" id="pb-nudge-title">You've hit the batch limit 3 times</div>
      <div class="pb-nudge-body">
        Looks like PrivBatch is part of your workflow.<br>
        Upgrade once and never think about it again.
      </div>
      <div class="pb-nudge-plan">Pro &middot; &euro;49 &middot; lifetime access</div>
      <div class="pb-nudge-actions">
        <a class="pb-nudge-upgrade"
           href="https://privbatch.gumroad.com/l/Privbatch-Pro"
           target="_blank" rel="noopener">Upgrade now &rarr;</a>
        <button class="pb-nudge-later">Maybe later</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  /* Dismiss helpers */
  const dismiss = () => {
    backdrop.remove();
    try { localStorage.setItem('privbatch_limit_hits', '0'); } catch (_) {}
  };

  backdrop.querySelector('.pb-nudge-later').addEventListener('click', dismiss);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) dismiss(); });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', onKey); }
  });
}

/**
 * Returns the current Pro tier from localStorage.
 * Does NOT re-validate against Gumroad; reads the cached tier only.
 * Returns: 'free' | 'pro' | 'business'
 */
function checkProStatus() {
  /* Delegate to LicenseManager if available */
  if (typeof LicenseManager !== 'undefined') {
    return LicenseManager.getStatus();
  }

  /* Fallback: read localStorage directly */
  try {
    const raw = localStorage.getItem('privbatch_license');
    if (!raw) return 'free';
    const { tier } = JSON.parse(raw);
    /* Migrate the retired 'personal' tier name to 'pro'. */
    return (tier === 'personal' ? 'pro' : tier) || 'free';
  } catch (_) {
    return 'free';
  }
}

/**
 * Generate a GDPR-style compliance certificate PDF.
 * Requires jsPDF to be loaded on the page (Business tier only).
 *
 * @param {Array<{name: string, size: number}>} files - list of processed files
 * @param {string} tool - tool name, e.g. "CSV → JSON Converter"
 */
function generateComplianceCert(files, tool) {
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
    console.error('generateComplianceCert: jsPDF not loaded');
    return;
  }

  const { jsPDF } = window.jspdf || jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const now       = new Date();
  const dateStr   = now.toUTCString();
  const certId    = 'PB-' + now.getFullYear()
                  + String(now.getMonth() + 1).padStart(2, '0')
                  + String(now.getDate()).padStart(2, '0')
                  + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  /* ── Page layout ── */
  const MARGIN = 20;
  const W      = doc.internal.pageSize.getWidth();
  let   y      = MARGIN;

  /* Header bar */
  doc.setFillColor(167, 139, 250);
  doc.rect(0, 0, W, 12, 'F');

  doc.setTextColor(8, 6, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PRIVBATCH · GDPR COMPLIANCE CERTIFICATE', MARGIN, 8);

  y = 24;

  /* Title */
  doc.setTextColor(19, 17, 28);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Processing Certificate', MARGIN, y);
  y += 10;

  /* Subtitle */
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 100);
  doc.text('Confirming 100% local, offline file processing', MARGIN, y);
  y += 14;

  /* Divider */
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 10;

  /* Key fields */
  const fields = [
    ['Certificate ID',    certId],
    ['Issued',            dateStr],
    ['Tool',              tool],
    ['Files Processed',   String(files.length)],
    ['Processing Method', '100% local - browser-only, zero network uploads'],
    ['Data Retention',    'None - files are never stored or transmitted'],
    ['GDPR Compliance',   'No personal data transmitted - 100% local processing'],
  ];

  doc.setFontSize(10);
  fields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 80);
    doc.text(label + ':', MARGIN, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(19, 17, 28);
    doc.text(value, MARGIN + 52, y);
    y += 8;
  });

  y += 4;

  /* File list */
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 80);
  doc.text('Processed Files', MARGIN, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 60);
  files.forEach((f, i) => {
    const line = (i + 1) + '.  ' + f.name + '  (' + formatFileSize(f.size) + ')';
    doc.text(line, MARGIN + 4, y);
    y += 6;
    if (y > 260) {
      doc.addPage();
      y = MARGIN;
    }
  });

  y += 8;

  /* Footer statement */
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 120);
  const statement =
    'This certificate confirms that the above files were processed entirely within the user\'s web browser ' +
    'using PrivBatch (privbatch.com). No file content, metadata, or personal data was transmitted to any ' +
    'server or third party. Processing was performed offline using client-side JavaScript only.';
  const lines = doc.splitTextToSize(statement, W - MARGIN * 2);
  doc.text(lines, MARGIN, y);

  /* Save */
  doc.save('privbatch-compliance-cert-' + certId + '.pdf');
}
