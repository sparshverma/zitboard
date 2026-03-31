const revealItems = document.querySelectorAll('.reveal');

function readMetaContent(name) {
  const node = document.querySelector(`meta[name="${name}"]`);
  return node ? (node.getAttribute('content') || '').trim() : '';
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const counters = document.querySelectorAll('.count');
let countersStarted = false;
const DEMO_ENDPOINT = window.ZITBOARD_DEMO_ENDPOINT || readMetaContent('zitboard-demo-endpoint');
const ANALYTICS_ENDPOINT =
  window.ZITBOARD_ANALYTICS_ENDPOINT || readMetaContent('zitboard-analytics-endpoint');

function animateCounter(el) {
  const target = Number(el.getAttribute('data-target') || 0);
  const decimals = Number(el.getAttribute('data-decimals') || 0);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1300;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const currentValue = progress * target;
    const value = decimals > 0 ? currentValue.toFixed(decimals) : Math.floor(currentValue);
    el.textContent = `${value}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.dataset.started) {
        entry.target.dataset.started = 'true';
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

counters.forEach((counter) => counterObserver.observe(counter));

window.dataLayer = window.dataLayer || [];

function trackEvent(name, payload = {}) {
  const eventPayload = {
    event: name,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  window.dataLayer.push(eventPayload);

  if (ANALYTICS_ENDPOINT) {
    const body = JSON.stringify(eventPayload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
    } else {
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Avoid blocking UI if analytics endpoint is unavailable.
      });
    }
  }
}

document.querySelectorAll('.cta-track').forEach((node) => {
  node.addEventListener('click', () => {
    trackEvent('cta_click', {
      ctaId: node.getAttribute('data-cta') || 'unknown',
      text: (node.textContent || '').trim(),
    });
  });
});

document.querySelectorAll('section[id]').forEach((section) => {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          trackEvent('funnel_section_view', { sectionId: section.id });
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.45 }
  );

  sectionObserver.observe(section);
});

const leadForm = document.querySelector('#lead-form');
const formMessage = document.querySelector('#form-message');
// Replaced network logic since status bar is removed

if (leadForm && formMessage) {
  if (!DEMO_ENDPOINT) {
    formMessage.textContent =
      'Form endpoint is not configured. Set ZITBOARD_DEMO_ENDPOINT before production launch.';
  }

  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!DEMO_ENDPOINT) {
      trackEvent('lead_form_error', { reason: 'missing_endpoint' });
      formMessage.textContent =
        'Submission service is unavailable. Please contact demo@zitboard.com for access.';
      return;
    }

    if (!navigator.onLine) {
      trackEvent('lead_form_error', { reason: 'offline' });
      formMessage.textContent = 'You appear offline. Reconnect and try again.';
      return;
    }

    if (!leadForm.checkValidity()) {
      formMessage.textContent = 'Please complete all required fields.';
      trackEvent('lead_form_error', { reason: 'validation' });
      return;
    }

    const formData = new FormData(leadForm);
    const payload = Object.fromEntries(formData.entries());

    formMessage.textContent = 'Submitting your request...';

    try {
      const response = await fetch(DEMO_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'zitboard_homepage',
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      formMessage.textContent = 'Request received. A demo specialist will contact you soon.';
      trackEvent('lead_form_submit', {
        endpoint: DEMO_ENDPOINT,
        teamSize: payload.teamSize,
        goal: payload.goal,
      });
      leadForm.reset();
    } catch (error) {
      formMessage.textContent = 'Could not submit right now. Please try again or email demo@zitboard.com.';
      trackEvent('lead_form_error', {
        reason: 'network',
        endpoint: DEMO_ENDPOINT,
      });
    }
  });
}

// Parallax Interactive Hero
const interactiveHero = document.querySelector('.interactive-hero');
if (interactiveHero) {
  interactiveHero.addEventListener('mousemove', (e) => {
    if (window.innerWidth < 980) return;
    
    const rect = interactiveHero.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const elements = document.querySelectorAll('.parallax-el');
    elements.forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-speed') || '0.05');
      // Subtle opposite translation
      el.style.setProperty('--px', (x * speed).toFixed(2));
      el.style.setProperty('--py', (y * speed).toFixed(2));
    });
  });
  
  interactiveHero.addEventListener('mouseleave', () => {
    const elements = document.querySelectorAll('.parallax-el');
    elements.forEach((el) => {
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    });
  });
}

// ----------------------------------------------------
// Dark Mode Toggle & Ripple Event (View Transitions)
// ----------------------------------------------------
const themeBtns = document.querySelectorAll('.theme-toggle');
const iconSuns = document.querySelectorAll('.icon-sun');
const iconMoons = document.querySelectorAll('.icon-moon');

function applyTheme(isDark) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  iconSuns.forEach(sun => { sun.style.display = isDark ? 'none' : 'block'; });
  iconMoons.forEach(moon => { moon.style.display = isDark ? 'block' : 'none'; });
}

const storedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
  applyTheme(true);
} else {
  applyTheme(false);
}

if (themeBtns.length > 0) {
  themeBtns.forEach(themeBtn => {
    themeBtn.addEventListener('click', (e) => {
      const isDark = document.documentElement.dataset.theme !== 'dark';

      if (!document.startViewTransition) {
        applyTheme(isDark);
        return;
      }

      let x = e.clientX;
      let y = e.clientY;

      if(x === undefined || y === undefined || (x===0 && y===0)) {
         const rect = themeBtn.getBoundingClientRect();
         x = rect.left + rect.width / 2;
         y = rect.top + rect.height / 2;
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        applyTheme(isDark);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ];

        document.documentElement.animate(
          {
            clipPath: isDark ? clipPath : [...clipPath].reverse(),
          },
          {
            duration: 600,
            easing: "ease-in",
            pseudoElement: isDark ? "::view-transition-new(root)" : "::view-transition-old(root)"
          }
        );
      });
    });
  });
}





// Mobile menu logic
const mobileToggle = document.querySelector('.mobile-menu-toggle');
const mobileDropdown = document.querySelector('.mobile-dropdown');
if(mobileToggle && mobileDropdown) {
  mobileToggle.addEventListener('click', () => {
    mobileDropdown.classList.toggle('active');
  });
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.dynamic-island')) {
      mobileDropdown.classList.remove('active');
    }
  });
}

// SECTION 3: Orbit controls and motion safety
const orbitContainer = document.getElementById('integration-orbit');
const orbitToggle = document.getElementById('orbit-rotation-toggle');
const orbitMotionState = document.getElementById('orbit-motion-state');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (orbitContainer && orbitToggle) {
  let userPaused = prefersReducedMotion.matches;

  const setOrbitState = () => {
    const offscreenPaused = orbitContainer.classList.contains('is-out-of-view');
    const reducedMotionPaused = prefersReducedMotion.matches;
    const paused = userPaused || offscreenPaused || reducedMotionPaused;

    orbitContainer.dataset.orbitPaused = paused ? 'true' : 'false';
    orbitToggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
    orbitToggle.textContent = paused ? 'Resume orbit motion' : 'Pause orbit motion';

    if (orbitMotionState) {
      orbitMotionState.textContent = 'Motion: ' + (paused ? 'Paused' : 'Running');
    }
  };

  orbitToggle.addEventListener('click', () => {
    userPaused = !userPaused;
    setOrbitState();
    trackEvent('orbit_motion_toggle', { paused: userPaused });
  });

  orbitContainer.addEventListener('focusin', () => {
    if (!userPaused) {
      userPaused = true;
      setOrbitState();
    }
  });

  const orbitObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      orbitContainer.classList.toggle('is-out-of-view', !entry.isIntersecting);
      setOrbitState();
    });
  }, { threshold: 0.2 });

  orbitObserver.observe(orbitContainer);

  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener('change', setOrbitState);
  } else if (prefersReducedMotion.addListener) {
    prefersReducedMotion.addListener(setOrbitState);
  }

  setOrbitState();
}

/* =========================================================================
   FOUR NEW SECTIONS JS INTERACTIONS
   ========================================================================= */

// SECTION 1: Dual-Engine Switch
const engineRadios = document.querySelectorAll('input[name="engine-mode"]');
const engineContent = document.querySelector('.engine-content');
const engineVisual = document.querySelector('.engine-visual');
if(engineRadios && engineContent) {
  engineRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if(e.target.value === 'sales') {
        engineContent.classList.remove('hiring-active');
        engineContent.classList.add('sales-active');
        if(engineVisual) {
          engineVisual.classList.remove('hiring-active');
          engineVisual.classList.add('sales-active');
        }
      } else {
        engineContent.classList.remove('sales-active');
        engineContent.classList.add('hiring-active');
        if(engineVisual) {
          engineVisual.classList.remove('sales-active');
          engineVisual.classList.add('hiring-active');
        }
      }
    });
  });
}

// SECTION 2: Dynamic ROI Calculator
const slider = document.getElementById('team-size-slider');
const rateSlider = document.getElementById('hourly-rate-slider');
const termToggle = document.getElementById('roi-term-toggle');

const displaySize = document.getElementById('team-size-value');
const displayRate = document.getElementById('hourly-rate-value');
const displayHours = document.getElementById('roi-hours');
const displaySavings = document.getElementById('roi-savings');
const displayPayback = document.getElementById('roi-payback');
const periodState = document.getElementById('roi-period-state');

const hoursLabel = document.getElementById('roi-hours-label');
const savingsLabel = document.getElementById('roi-savings-label');

function animateValue(obj, start, end, duration) {
  if (start === end || !obj) return;
  let startTimestamp = null;

  const formatSavingsValue = (valueInK) => {
    if (valueInK >= 1000) {
      const valueInM = valueInK / 1000;
      const precision = valueInM >= 10 ? 0 : 1;
      return '$' + valueInM.toFixed(precision) + 'M';
    }
    return '$' + valueInK.toLocaleString() + 'k';
  };

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = progress * (2 - progress); // Simple easeOutQuad
    const current = Math.floor(easeProgress * (end - start) + start);

    // Formatting: If it's a dollar amount vs raw number
    if(obj.id === 'roi-savings') {
      obj.innerHTML = formatSavingsValue(current);
    } else {
      obj.innerHTML = current.toLocaleString();
    }

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function formatAxisCurrency(value) {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return '$' + millions.toFixed(millions >= 10 ? 0 : 1) + 'M';
  }
  if (value >= 1000) {
    return '$' + Math.round(value / 1000) + 'k';
  }
  return '$' + Math.round(value);
}

function roundAxisMax(value) {
  if (value <= 10000) return Math.ceil(value / 1000) * 1000;
  if (value <= 100000) return Math.ceil(value / 5000) * 5000;
  if (value <= 1000000) return Math.ceil(value / 50000) * 50000;
  return Math.ceil(value / 250000) * 250000;
}

function createSmoothPath(points) {
  if (!points || points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const dx = p1.x - p0.x;
    const cp1x = p0.x + (dx * 0.35);
    const cp2x = p1.x - (dx * 0.35);
    d += ` C ${cp1x} ${p0.y} ${cp2x} ${p1.y} ${p1.x} ${p1.y}`;
  }
  return d;
}

function createAreaPath(points, baselineY) {
  if (!points || points.length === 0) return '';
  const curve = createSmoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${curve} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

function animateGraphStroke(pathEl) {
  if (!pathEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const length = pathEl.getTotalLength();
  pathEl.style.transition = 'none';
  pathEl.style.strokeDasharray = `${length}`;
  pathEl.style.strokeDashoffset = `${length}`;
  pathEl.getBoundingClientRect();
  pathEl.style.transition = 'stroke-dashoffset 460ms cubic-bezier(0.22, 1, 0.36, 1)';
  pathEl.style.strokeDashoffset = '0';
}

if(slider) {
  // Baseline values
  let currentHours = 200;
  let currentSavings = 10;

  function updateROI() {
    const employees = parseInt(slider.value);
    const hourlyRate = rateSlider ? parseInt(rateSlider.value) : 50;
    const isAnnual = termToggle ? termToggle.checked : false;

    if(displaySize) displaySize.textContent = employees;
    if(displayRate) displayRate.textContent = hourlyRate;

    const multiplier = isAnnual ? 12 : 1;

    // ROI model assumptions used for this interactive estimate.
    const monthlyHours = employees * 4; 
    const rawMonthlySavings = monthlyHours * hourlyRate;

    const newHours = monthlyHours * multiplier;
    // Scale down to 'k' units for clean display
    const newSavings = Math.round((rawMonthlySavings * multiplier) / 1000);

    // Payback period assumption: average SaaS seat is ~$40/mo
    const monthlyCost = employees * 40;
    // Payback = Cost / Savings. 
    const paybackMonths = (monthlyCost / rawMonthlySavings).toFixed(1);
    if(periodState) periodState.textContent = isAnnual ? 'Showing annual totals' : 'Showing monthly totals';

    if(hoursLabel) hoursLabel.textContent = isAnnual ? 'Hours Saved /yr' : 'Hours Saved /mo';
    if(savingsLabel) savingsLabel.textContent = isAnnual ? 'Cost Reduced /yr' : 'Cost Reduced /mo';

    animateValue(displayHours, currentHours, newHours, 200);
    animateValue(displaySavings, currentSavings, newSavings, 200);
    if(displayPayback) displayPayback.innerHTML = paybackMonths;

    currentHours = newHours;
    currentSavings = newSavings;

    // SVG Graph Plotting Update
    const pathManual = document.getElementById('path-manual');
    const pathZB = document.getElementById('path-zitboard');
    const pathZBArea = document.getElementById('path-zitboard-area');
    const pointManual = document.getElementById('roi-point-manual');
    const pointZB = document.getElementById('roi-point-zitboard');
    const axisCaption = document.getElementById('roi-axis-caption');
    const yLabelTop = document.getElementById('roi-y-label-top');
    const yLabelHigh = document.getElementById('roi-y-label-high');
    const yLabelMid = document.getElementById('roi-y-label-mid');
    const yLabelLow = document.getElementById('roi-y-label-low');
    const yLabelBase = document.getElementById('roi-y-label-base');

    if(pathManual && pathZB && pathZBArea && pointManual && pointZB) {
      const chart = {
        left: 58,
        right: 530,
        top: 24,
        bottom: 180,
      };

      const periodSavings = rawMonthlySavings * multiplier;
      const projectedManualCost = periodSavings * 1.65;
      const projectedPlatformCost = periodSavings * 0.65;
      const axisMax = roundAxisMax(projectedManualCost * 1.12);

      const xSteps = [0, 0.25, 0.5, 0.75, 1];
      const manualStages = [0.14, 0.38, 0.62, 0.84, 1];
      const platformStages = [0.12, 0.3, 0.48, 0.68, 1];
      const chartHeight = chart.bottom - chart.top;
      const chartWidth = chart.right - chart.left;

      const toY = (val) => chart.bottom - ((val / axisMax) * chartHeight);

      const manualPoints = xSteps.map((step, idx) => ({
        x: chart.left + (chartWidth * step),
        y: toY(projectedManualCost * manualStages[idx]),
      }));
      const platformPoints = xSteps.map((step, idx) => ({
        x: chart.left + (chartWidth * step),
        y: toY(projectedPlatformCost * platformStages[idx]),
      }));

      const manualPath = createSmoothPath(manualPoints);
      const zbPath = createSmoothPath(platformPoints);
      const zbAreaPath = createAreaPath(platformPoints, chart.bottom);

      pathManual.setAttribute('d', manualPath);
      pathZB.setAttribute('d', zbPath);
      pathZBArea.setAttribute('d', zbAreaPath);

      const manualEnd = manualPoints[manualPoints.length - 1];
      const zbEnd = platformPoints[platformPoints.length - 1];
      pointManual.setAttribute('cx', manualEnd.x);
      pointManual.setAttribute('cy', manualEnd.y);
      pointZB.setAttribute('cx', zbEnd.x);
      pointZB.setAttribute('cy', zbEnd.y);

      if(axisCaption) {
        axisCaption.textContent = isAnnual ? 'Projected Annual Cost Curve' : 'Projected Monthly Cost Curve';
      }

      if(yLabelTop) yLabelTop.textContent = formatAxisCurrency(axisMax);
      if(yLabelHigh) yLabelHigh.textContent = formatAxisCurrency(axisMax * 0.75);
      if(yLabelMid) yLabelMid.textContent = formatAxisCurrency(axisMax * 0.5);
      if(yLabelLow) yLabelLow.textContent = formatAxisCurrency(axisMax * 0.25);
      if(yLabelBase) yLabelBase.textContent = '$0';

      animateGraphStroke(pathManual);
      animateGraphStroke(pathZB);

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        pathZBArea.animate(
          [{ opacity: 0.2 }, { opacity: 0.52 }],
          { duration: 420, easing: 'ease-out' }
        );
      }
    }
  }

  slider.addEventListener('input', updateROI);
  if(rateSlider) rateSlider.addEventListener('input', updateROI);
  if(termToggle) termToggle.addEventListener('change', updateROI);
  updateROI();
}

// SECTION 4: Transparent Pricing Toggle
const billingSwitch = document.getElementById('billing-switch');
const labelMonthly = document.getElementById('label-monthly');
const labelAnnual = document.getElementById('label-annual');
const prices = document.querySelectorAll('.pricing-card .price');

if(billingSwitch) {
  billingSwitch.addEventListener('change', (e) => {
    const isAnnual = e.target.checked;
    
    if(isAnnual) {
      labelAnnual.classList.add('active-toggle-label');
      labelMonthly.classList.remove('active-toggle-label');
    } else {
      labelMonthly.classList.add('active-toggle-label');
      labelAnnual.classList.remove('active-toggle-label');
    }
    
    prices.forEach(priceEl => {
      // Fade out
      priceEl.style.opacity = 0;
      setTimeout(() => {
        if(isAnnual) {
          priceEl.innerHTML = priceEl.getAttribute('data-annual') + '<span>/mo</span>';
        } else {
          priceEl.innerHTML = priceEl.getAttribute('data-monthly') + '<span>/mo</span>';
        }
        if(priceEl.innerText.includes('Custom')) {
            priceEl.innerHTML = 'Custom';
        }
        // Fade in
        priceEl.style.opacity = 1;
      }, 200); // match transition speed if added via CSS
    });
  });
}


// Initialize ROI graph strictly on load
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('team-size-slider');
  if(slider) {
    const event = new Event('input');
    slider.dispatchEvent(event);
  }
});

