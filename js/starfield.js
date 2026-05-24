/**
 * Starfield - canvas particle system extracted from homepage mockup.
 *
 * Usage: include this script on any page that has:
 *   <div class="bg-layer">
 *     <canvas id="starfield"></canvas>
 *   </div>
 *
 * Stars drift slowly in random directions. Cursor within ATTRACT_R pulls
 * them toward it; a spring force returns each star to its drifting origin.
 */
(function () {
  'use strict';

  const COUNT      = 200;
  const ATTRACT_R  = 80;
  const ATTRACT_R2 = ATTRACT_R * ATTRACT_R;
  const ATTRACT_F  = 0.75;
  const SPRING     = 0.014;
  const DAMP       = 0.91;
  const EPS        = 0.06;
  const TWK_AMP    = 0.13;

  const COLS = [
    '255,255,255',
    '255,255,255',
    '224,215,255',
    '255,255,255',
    '210,200,255',
  ];

  let canvas, ctx;
  let stars = [];
  let mx = -9999, my = -9999;
  let t = 0;
  let rafId;

  function buildStar(W, H) {
    const roll = Math.random();
    const r = roll < 0.55 ? Math.random() * 0.35 + 0.25   // tiny   0.25 to 0.6
            : roll < 0.80 ? Math.random() * 0.45 + 0.60   // small  0.6 to 1.05
            : roll < 0.94 ? Math.random() * 0.65 + 1.05   // medium 1.05 to 1.7
                          : Math.random() * 0.80 + 1.70;  // bright 1.7 to 2.5

    const angle = Math.random() * Math.PI * 2;
    const spd   = Math.random() * 0.07 + 0.01;
    const x     = Math.random() * W;
    const y     = Math.random() * H;

    return {
      ox: x, oy: y,
      x,     y,
      vx: 0, vy: 0,
      dvx: Math.cos(angle) * spd,
      dvy: Math.sin(angle) * spd,
      r,
      col:    COLS[Math.floor(Math.random() * COLS.length)],
      baseO:  r > 1.7  ? Math.random() * 0.25 + 0.65
            : r > 1.05 ? Math.random() * 0.30 + 0.38
                       : Math.random() * 0.30 + 0.18,
      tPhase: Math.random() * Math.PI * 2,
      tSpeed: Math.random() * 0.012 + 0.004,
    };
  }

  function init() {
    const W = canvas.width, H = canvas.height;
    stars = [];
    for (let i = 0; i < COUNT; i++) {
      stars.push(buildStar(W, H));
    }
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
  }

  function tick() {
    t++;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      /* Drift origin - wraps seamlessly at edges */
      s.ox += s.dvx;
      s.oy += s.dvy;
      if      (s.ox < -2)    s.ox += W + 4;
      else if (s.ox > W + 2) s.ox -= W + 4;
      if      (s.oy < -2)    s.oy += H + 4;
      else if (s.oy > H + 2) s.oy -= H + 4;

      /* Spring toward drifting origin */
      s.vx += (s.ox - s.x) * SPRING;
      s.vy += (s.oy - s.y) * SPRING;

      /* Cursor attraction */
      const dx = mx - s.x, dy = my - s.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < ATTRACT_R2 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = (1 - d / ATTRACT_R) * ATTRACT_F;
        s.vx += (dx / d) * f;
        s.vy += (dy / d) * f;
      }

      /* Dampen and integrate */
      s.vx *= DAMP;
      s.vy *= DAMP;

      if (Math.abs(s.vx) > EPS || Math.abs(s.vy) > EPS) {
        s.x += s.vx;
        s.y += s.vy;
      } else {
        s.x = s.ox; s.y = s.oy;
        s.vx = 0;   s.vy = 0;
      }

      /* Twinkle */
      const o = Math.max(0.06, s.baseO + Math.sin(t * s.tSpeed + s.tPhase) * TWK_AMP);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.col},${o})`;
      ctx.fill();
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    canvas = document.getElementById('starfield');
    if (!canvas) return;

    /* ── Mobile: skip canvas, use static CSS stars instead ── */
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      canvas.style.display = 'none';
      document.body.classList.add('static-starfield');
      return;
    }

    ctx = canvas.getContext('2d');

    window.addEventListener('resize',     resize);
    window.addEventListener('mousemove',  e => { mx = e.clientX; my = e.clientY; });
    window.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

    resize();
    rafId = requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
