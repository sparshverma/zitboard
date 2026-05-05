(function () {
  'use strict';

  /* ── 1. Generic scroll-reveal ───────────────────────── */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('vis');
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '-60px 0px -40px 0px', threshold: 0.1 });
  document.querySelectorAll('.feat-row, .agent-tile').forEach(function (el) {
    revealIO.observe(el);
  });

  /* ── 3. Feat-row stagger delay ──────────────────────── */
  document.querySelectorAll('.feat-row').forEach(function (el) {
    var i = parseInt(el.getAttribute('data-fi') || '0', 10);
    el.style.transitionDelay = (i * 110) + 'ms';
  });

  /* ── 4. CRM Kanban entrance ─────────────────────────── */
  var crmFired = false;
  var crmIO = new IntersectionObserver(function (entries) {
    if (crmFired || !entries[0].isIntersecting) return;
    crmFired = true;
    var cards = document.querySelectorAll('.kanban-card');
    cards.forEach(function (c, i) {
      setTimeout(function () { c.classList.add('kc-vis'); }, i * 110);
    });
    setTimeout(function () {
      var ind = document.querySelector('.kc-move-indicator');
      if (ind) ind.classList.add('kc-pulse');
    }, cards.length * 110 + 220);
  }, { threshold: 0.25 });
  var crmEl = document.getElementById('crm-core');
  if (crmEl) crmIO.observe(crmEl);

  /* ── 5. Hiring pipeline entrance ────────────────────── */
  var hireFired = false;
  var hireIO = new IntersectionObserver(function (entries) {
    if (hireFired || !entries[0].isIntersecting) return;
    hireFired = true;
    document.querySelectorAll('.hire-stage').forEach(function (s, i) {
      setTimeout(function () { s.classList.add('hs-vis'); }, i * 180);
    });
  }, { threshold: 0.25 });
  var hireEl = document.getElementById('hiring-core');
  if (hireEl) hireIO.observe(hireEl);

  /* ── 6. AI arc entrance ──────────────────────────────── */
  var aiFired = false;
  var aiIO = new IntersectionObserver(function (entries) {
    if (aiFired || !entries[0].isIntersecting) return;
    aiFired = true;
    var arc = document.querySelector('.ai-arc-fill');
    var num = document.querySelector('.ai-arc-num');
    if (arc) arc.classList.add('arc-vis');
    if (num) num.classList.add('arc-vis');
    document.querySelectorAll('.ai-signal').forEach(function (s, i) {
      setTimeout(function () { s.classList.add('sig-vis'); }, i * 140 + 700);
    });
  }, { threshold: 0.25 });
  var aiEl = document.getElementById('ai-core');
  if (aiEl) aiIO.observe(aiEl);

  /* ── 7. Platform Capabilities sequential reveal ─────── */
  var bentoFired = false;
  var bentoIO = new IntersectionObserver(function (entries) {
    if (bentoFired || !entries[0].isIntersecting) return;
    bentoFired = true;
    document.querySelectorAll('.cap-card').forEach(function (tile, i) {
      setTimeout(function () { tile.classList.add('vis'); }, i * 85);
    });
  }, { threshold: 0.08 });
  var bentoEl = document.getElementById('bento-grid');
  if (bentoEl) bentoIO.observe(bentoEl);

  /* ── 8. The Difference — pile-up scroll-step engine ────── */
  var compareScene   = document.getElementById('compare-scene');
  var compareCounter = document.getElementById('compare-counter');
  var compareHint    = document.getElementById('compare-hint');
  var compareDots    = Array.prototype.slice.call(document.querySelectorAll('.compare-top-dot'));
  var pileBeforeRows = Array.prototype.slice.call(document.querySelectorAll('#pile-before .ci-row'));
  var pileAfterRows  = Array.prototype.slice.call(document.querySelectorAll('#pile-after .ci-row'));
  var N_CMP  = pileBeforeRows.length;
  var curCmp = -1;

  function applyCompareStep(step) {
    step = Math.max(0, Math.min(N_CMP - 1, step));
    if (step === curCmp) return;
    curCmp = step;

    /* dots + counter */
    compareDots.forEach(function (d, i) { d.classList.toggle('active', i === step); });
    if (compareCounter) compareCounter.textContent = (step + 1) + ' / ' + N_CMP;
    if (compareHint) compareHint.style.opacity = step === N_CMP - 1 ? '0' : '';

    /* update each row: visible rows get ci-past or ci-current */
    function updatePile(rows) {
      rows.forEach(function (row, i) {
        row.classList.remove('ci-past', 'ci-current');
        if (i < step)  row.classList.add('ci-past');
        if (i === step) row.classList.add('ci-current');
      });
    }
    updatePile(pileBeforeRows);
    updatePile(pileAfterRows);
  }

  /* dot clicks → scroll to that step */
  compareDots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      if (!compareScene) return;
      var totalH = compareScene.offsetHeight - window.innerHeight;
      var pct = N_CMP > 1 ? i / (N_CMP - 1) : 0;
      window.scrollTo({ top: compareScene.offsetTop + pct * totalH, behavior: 'smooth' });
    });
  });

  /* scroll-driven step calculation */
  var cmpRaf = null;
  function updateCmpOnScroll() {
    cmpRaf = null;
    if (!compareScene) return;
    var rect     = compareScene.getBoundingClientRect();
    var totalH   = compareScene.offsetHeight - window.innerHeight;
    if (totalH <= 0) return;
    var scrolled = Math.max(0, -rect.top);
    var progress = Math.min(scrolled / totalH, 1);
    /* map progress to step; add small dead-zone at each end */
    var adjusted = Math.max(0, Math.min(1, (progress - 0.02) / 0.96));
    var rawStep  = Math.floor(adjusted * N_CMP);
    applyCompareStep(Math.min(rawStep, N_CMP - 1));
  }
  window.addEventListener('scroll', function () {
    if (!cmpRaf) cmpRaf = requestAnimationFrame(updateCmpOnScroll);
  }, { passive: true });
  /* init — show first item immediately on load */
  applyCompareStep(0);

  /* ── 9. Animated stat counters ───────────────────────── */
  function animateCounter(el) {
    var target  = parseFloat(el.getAttribute('data-count'));
    var suffix  = el.getAttribute('data-suffix') || '';
    var prefix  = el.getAttribute('data-prefix') || '';
    var decimal = parseInt(el.getAttribute('data-decimal') || '0', 10);
    var dur = 1800, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = eased * target;
      el.textContent = prefix + (decimal ? val.toFixed(decimal) : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var statsFired = false;
  var statsIO = new IntersectionObserver(function (entries) {
    if (statsFired || !entries[0].isIntersecting) return;
    statsFired = true;
    document.querySelectorAll('.stat-num[data-count]').forEach(animateCounter);
  }, { threshold: 0.4 });
  var statsEl = document.getElementById('prd-stats');
  if (statsEl) statsIO.observe(statsEl);

  /* ── 10. Module tab scrollspy ────────────────────────── */
  var tabs   = document.querySelectorAll('.prd-tab');
  var panels = ['crm-core', 'hiring-core', 'ai-core'];
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = document.getElementById(tab.getAttribute('data-tab'));
      if (target) {
        var top = target.getBoundingClientRect().top + window.pageYOffset - 140;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });
  var spyIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var id = e.target.id;
      tabs.forEach(function (t) {
        var active = t.getAttribute('data-tab') === id;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    });
  }, { rootMargin: '-130px 0px -55% 0px', threshold: 0 });
  panels.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) spyIO.observe(el);
  });

})();
