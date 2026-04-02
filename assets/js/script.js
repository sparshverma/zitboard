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

// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

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

// SECTION 1: Interactive Feature Cards
const featureCardsSection = document.getElementById('feature-cards');

if (featureCardsSection) {
  const growthTrack = featureCardsSection.querySelector('[data-feature-track="growth"]');
  const operationsTrack = featureCardsSection.querySelector('[data-feature-track="operations"]');
  const growthViewport = featureCardsSection.querySelector('#feature-track-growth');
  const operationsViewport = featureCardsSection.querySelector('#feature-track-operations');
  const viewports = featureCardsSection.querySelectorAll('.feature-track-viewport');

  const featureData = {
    growth: [
      {
        icon: '🎯',
        title: 'The "Game-On" CRM Pipeline',
        description: 'Drag, drop, and win. Our visual pipeline turns closing deals into a satisfying game. Watch your progress bars fill up and celebrate every victory.',
        benefit: 'Close deals 30% faster.'
      },
      {
        icon: '🔮',
        title: 'AI Lead Clairvoyance',
        description: 'Stop guessing who to call. Our built-in Machine Learning automatically scores your leads, pointing you directly to the ones ready to buy today.',
        benefit: 'Focus only on hot leads.'
      },
      {
        icon: '📊',
        title: 'Metrics That Look Like Art',
        description: 'Say goodbye to endless, ugly spreadsheets. Get gorgeous, real-time analytics dashboards that make understanding your business growth actually enjoyable.',
        benefit: 'Know your numbers instantly.'
      },
      {
        icon: '💸',
        title: '"Set It & Forget It" Billing',
        description: 'Automated invoicing, subscription management, and webhook triggers mean the money keeps flowing in, even while you’re on vacation.',
        benefit: 'Get paid while you sleep.'
      },
      {
        icon: '✍️',
        title: 'Frictionless Deal Contracts',
        description: 'Generate, send, and securely store deal contracts in seconds. Get signatures before your morning coffee even has a chance to get cold.',
        benefit: 'Zero paperwork headaches.'
      },
      {
        icon: '📈',
        title: 'The Cashflow Crystal Ball',
        description: 'Effortlessly predict your upcoming quarters. Our sales module analyzes your pipeline to give you pinpoint-accurate revenue forecasts without the math anxiety.',
        benefit: 'Plan your future with confidence.'
      },
      {
        icon: '🤖',
        title: 'Smart AI Follow-Ups',
        description: 'Never let a warm lead go cold again. Your dashboard gently nudges you at the exact right moment to follow up, keeping your relationships thriving.',
        benefit: 'Perfect timing, zero memory required.'
      },
      {
        icon: '🚀',
        title: 'Real-Time Revenue Alerts',
        description: 'We turned our enterprise-grade monitoring into your personal hype machine. Get instant, satisfying notifications the second a big deal crosses the finish line.',
        benefit: 'Celebrate wins in real-time.'
      },
      {
        icon: '🌌',
        title: 'The Universal Sales Command Center',
        description: 'Your inbox, calendar, and contacts, all blended into one beautiful interface. No more tab-switching fatigue—rule your sales universe from a single screen.',
        benefit: 'Reclaim 2 hours every day.'
      }
    ],
    operations: [
      {
        icon: '🌟',
        title: 'Hiring That Feels Like Magic',
        description: 'Sifting through resumes is a thing of the past. Our ATS organizes candidates beautifully so you can find your next superstar seamlessly.',
        benefit: 'Build your dream team stress-free.'
      },
      {
        icon: '🦄',
        title: 'AI Applicant Matchmaker',
        description: 'Need a unicorn candidate? Our ML scoring pipeline reads between the lines of every application to highlight the absolute best fits for your company culture.',
        benefit: 'Skip the resume black hole.'
      },
      {
        icon: '✅',
        title: 'Zen-Mode Task Management',
        description: 'Turn daily chaos into a satisfying checklist. Create, assign, and clear tasks with smooth animations that make getting things done feel like a reward.',
        benefit: 'Clear your mind and your desk.'
      },
      {
        icon: '🧩',
        title: 'Plays Nice With Everyone (Plugins)',
        description: 'Bring your favorite tools to the party. Our one-click integrations meaning your dashboard talks effortlessly to the apps you already know and love.',
        benefit: 'No more copy-pasting between apps.'
      },
      {
        icon: '🛡️',
        title: 'Fort Knox Security',
        description: 'Enterprise-grade authentication, SSO, and comprehensive audit logs wrap your business in an invisible shield. Sleep soundly knowing your data is locked down.',
        benefit: 'Total peace of mind.'
      },
      {
        icon: '⚙️',
        title: 'Invisible Robot Assistants',
        description: 'Routine tasks are for robots. Set up automated workflows that trigger actions across your dashboard so you can focus on high-impact, creative work.',
        benefit: 'Automate the boring stuff.'
      },
      {
        icon: '⚡',
        title: '"Always On" Reliability',
        description: 'Built on robust, auto-scaling Kubernetes architecture. While you\'re logging off for the weekend, your platform is scaling up to handle traffic spikes flawlessly.',
        benefit: '99.99% uptime, 0% stress.'
      },
      {
        icon: '🔑',
        title: 'One-Click VIP Access',
        description: 'Smart Role-Based Access Control means you can hand out the right "keys" to the right employees instantly. No IT degree required to keep things secure.',
        benefit: 'Easy, safe delegation.'
      },
      {
        icon: '🌍',
        title: 'Timezone-Defying Collaboration',
        description: 'Shared views, notes, and activity streams keep your entire team in sync, whether they are sitting across the desk or across the globe. High-fives everywhere.',
        benefit: 'Sync up without the meetings.'
      }
    ]
  };

  const createCardMarkup = (item, setName, index) => `
    <button class="feature-track-card" type="button" data-feature-set="${setName}" data-feature-index="${index}" style="--feature-order:${index};">
      <span class="feature-track-icon" aria-hidden="true">${item.icon}</span>
      <h4 class="feature-track-title">${item.title}</h4>
      <p class="feature-track-description">${item.description}</p>
      <p class="feature-track-benefit">Lifestyle Benefit<span>${item.benefit}</span></p>
    </button>
  `;

  const growthLoop = [...featureData.growth, ...featureData.growth];
  const operationsLoop = [...featureData.operations, ...featureData.operations];

  if (growthTrack) {
    growthTrack.innerHTML = growthLoop
      .map((item, index) => createCardMarkup(item, 'growth', index % featureData.growth.length))
      .join('');
  }

  if (operationsTrack) {
    operationsTrack.innerHTML = operationsLoop
      .map((item, index) => createCardMarkup(item, 'operations', index % featureData.operations.length))
      .join('');
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const railState = [
    growthViewport && growthTrack
      ? { viewport: growthViewport, track: growthTrack, direction: 1, speed: 1.05, paused: false }
      : null,
    operationsViewport && operationsTrack
      ? { viewport: operationsViewport, track: operationsTrack, direction: -1, speed: 1.05, paused: false }
      : null
  ].filter(Boolean);

  const syncRailGeometry = () => {
    railState.forEach((state) => {
      state.loopWidth = state.track.scrollWidth / 2;

      if (!state.loopWidth) return;

      if (state.viewport.scrollLeft < 1) {
        state.viewport.scrollLeft = state.loopWidth / 2;
      }

      if (state.viewport.scrollLeft >= state.loopWidth) {
        state.viewport.scrollLeft -= state.loopWidth;
      }
    });
  };

  railState.forEach((state) => {

    const pause = () => {
      state.paused = true;
    };

    const resume = () => {
      state.paused = false;
    };

    state.viewport.addEventListener('pointerenter', pause);
    state.viewport.addEventListener('pointerleave', resume);
    state.viewport.addEventListener('focusin', pause);
    state.viewport.addEventListener('focusout', resume);
    state.viewport.addEventListener('touchstart', pause, { passive: true });
    state.viewport.addEventListener('touchend', resume, { passive: true });
    state.viewport.addEventListener('touchcancel', resume, { passive: true });
  });

  let featureRailsRaf = 0;

  const tickFeatureRails = () => {
    railState.forEach((state) => {
      if (state.paused || !state.loopWidth) return;

      state.viewport.scrollLeft += state.direction * state.speed;

      if (state.direction > 0 && state.viewport.scrollLeft >= state.loopWidth) {
        state.viewport.scrollLeft -= state.loopWidth;
      }

      if (state.direction < 0 && state.viewport.scrollLeft <= 0) {
        state.viewport.scrollLeft += state.loopWidth;
      }
    });

    featureRailsRaf = window.requestAnimationFrame(tickFeatureRails);
  };

  if (!prefersReducedMotion && railState.length) {
    window.requestAnimationFrame(() => {
      syncRailGeometry();
      tickFeatureRails();
    });
  }

  viewports.forEach((viewport) => {
    viewport.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const state = railState.find((item) => item.viewport === viewport);
      if (state) {
        state.paused = true;
      }

      viewport.scrollLeft += event.deltaY;
      event.preventDefault();

      if (state) {
        window.clearTimeout(state.resumeTimer);
        state.resumeTimer = window.setTimeout(() => {
          state.paused = false;
        }, 240);
      }
    }, { passive: false });
  });

  const interactiveCards = featureCardsSection.querySelectorAll('.feature-track-card');
  const canHover = window.matchMedia('(pointer: fine)').matches;

  if (canHover) {
    interactiveCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * 10;
        const rotateX = (0.5 - y) * 8;

        card.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
        card.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
        card.style.setProperty('--glow-x', `${(x * 100).toFixed(2)}%`);
        card.style.setProperty('--glow-y', `${(y * 100).toFixed(2)}%`);
      });

      card.addEventListener('pointerenter', () => {
        card.classList.add('is-hovering');
      });

      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-hovering');
        card.style.setProperty('--card-rotate-x', '0deg');
        card.style.setProperty('--card-rotate-y', '0deg');
        card.style.setProperty('--glow-x', '50%');
        card.style.setProperty('--glow-y', '18%');
      });
    });
  }

  featureCardsSection.addEventListener('click', (event) => {
    const card = event.target.closest('.feature-track-card');
    if (!card) return;

    if (typeof trackEvent === 'function') {
      trackEvent('feature_card_select', {
        set: card.getAttribute('data-feature-set'),
        index: Number(card.getAttribute('data-feature-index'))
      });
    }
  });

  window.addEventListener('resize', () => {
    syncRailGeometry();
  });
}

// SECTION FAQ: Category switcher and smooth accordion
const faqSection = document.getElementById('faq');
const faqAccordion = document.getElementById('faq-accordion');
const faqCategoryButtons = faqSection
  ? faqSection.querySelectorAll('.faq-pill[data-faq-category]')
  : [];

const faqContentMap = {
  'getting-started': [
    {
      q: 'What is ZitBoard and who is it designed for?',
      a: 'ZitBoard is an all-in-one dashboard SaaS platform that combines CRM, task management, and business analytics in a single workspace. It is built for startups, agencies, and growing businesses that want to replace multiple disconnected tools with one unified platform and get a real-time view of their sales pipeline, team tasks, and KPIs without switching tabs.',
    },
    {
      q: 'How do I create a ZitBoard account?',
      a: 'Creating a ZitBoard account takes under two minutes. Click the "Sign Up" button on the homepage and register with your email address, or use one-click login via Google or GitHub. No credit card is required to get started.',
    },
    {
      q: 'Can I import data from other CRM tools into ZitBoard?',
      a: 'Yes. ZitBoard supports CSV imports for contacts, leads, and tasks, making it easy to migrate from tools like HubSpot, Notion, or Trello without losing existing data. The import wizard maps your columns automatically to reduce setup time.',
    },
    {
      q: 'Is ZitBoard easy to use for non-technical teams?',
      a: 'Absolutely. ZitBoard is designed with a clean, intuitive interface that requires no technical background. The built-in onboarding wizard walks new users through workspace setup, team invites, and dashboard creation in minutes.',
    },
    {
      q: 'Can I use ZitBoard on mobile and desktop?',
      a: 'Yes. ZitBoard is fully responsive and works seamlessly across desktop browsers, tablets, and smartphones, so your team can manage CRM records and tasks from anywhere, on any device.',
    },
  ],
  'pricing-plans': [
    {
      q: 'What pricing plans does ZitBoard offer?',
      a: 'ZitBoard offers three pricing tiers to suit different team sizes: a Free plan for solo users, a Pro plan for growing teams that need advanced analytics and automation, and an Enterprise plan with custom seat limits and dedicated support. All plans include core CRM and task management features.',
    },
    {
      q: 'Can I upgrade or downgrade my ZitBoard plan anytime?',
      a: 'Yes. You can switch plans at any time from the Billing section of your dashboard. Upgrades take effect immediately and downgrades are applied at the start of your next billing cycle. All changes are prorated automatically.',
    },
    {
      q: 'How many team members can I add to ZitBoard?',
      a: 'The Free plan supports up to 3 team members. Pro and Enterprise plans use per-seat pricing, allowing you to scale your workspace as your team grows with no hard caps on the Enterprise tier.',
    },
    {
      q: 'What payment methods does ZitBoard accept?',
      a: 'ZitBoard accepts all major credit and debit cards - Visa, Mastercard, and American Express - processed securely through Stripe. All transactions are encrypted and PCI-compliant.',
    },
    {
      q: 'Does ZitBoard offer a free trial?',
      a: 'Yes. ZitBoard offers a 14-day free trial of the Pro plan with no credit card required. The trial gives you full access to advanced analytics, task automation, and integrations so you can evaluate the platform before committing.',
    },
  ],
  'features-integrations': [
    {
      q: "Does ZitBoard support automated task assignment?",
      a: "Yes. ZitBoard's automation engine lets you create rules that auto-assign tasks to team members based on CRM lead status, tags, deal stage, or client request type, eliminating manual triage and speeding up response times.",
    },
    {
      q: "How customisable are ZitBoard's analytics dashboards?",
      a: 'ZitBoard dashboards are fully customisable. You can drag and drop widgets, pin the KPIs most relevant to your business, and build custom charts for sales pipeline tracking, task completion rates, and team performance, all without writing a single line of code.',
    },
    {
      q: 'What tools and apps does ZitBoard integrate with?',
      a: 'ZitBoard currently integrates with Slack for real-time notifications and Google Workspace for calendar and document syncing. New integrations are added regularly based on user feedback, with a public integration roadmap available in the product portal.',
    },
    {
      q: 'Can I export reports and CRM data from ZitBoard?',
      a: 'Yes. All analytics reports and CRM data tables can be exported as CSV or PDF files, making it easy to share insights in external meetings, client reports, or offline backups.',
    },
  ],
  'security-support': [
    {
      q: 'Is my business data safe with ZitBoard?',
      a: 'Yes. ZitBoard uses industry-standard AES-256 encryption for data at rest and TLS encryption for data in transit. The platform is built on Supabase, which provides enterprise-grade database security, automatic backups, and compliance-ready infrastructure.',
    },
    {
      q: 'How do I reset my ZitBoard password?',
      a: 'Click "Forgot Password" on the login screen and enter your registered email address. You will receive a secure password reset link within a few minutes. If the email does not arrive, check your spam folder or contact support@zitboard.com.',
    },
    {
      q: 'How do I contact ZitBoard customer support?',
      a: 'ZitBoard offers 24/7 support via the "Contact Support" button at the bottom of this page, or by emailing support@zitboard.com. Pro and Enterprise users also get access to priority support with faster response SLAs.',
    },
    {
      q: 'Does ZitBoard support Two-Factor Authentication (2FA)?',
      a: 'Yes. ZitBoard supports Two-Factor Authentication (2FA) to protect your account from unauthorised access. You can enable it in Account Settings under the Security tab. We strongly recommend enabling 2FA for all admin and billing users.',
    },
    {
      q: 'What should I do if ZitBoard is running slowly?',
      a: 'Start by checking your internet connection and clearing your browser cache. If the issue continues, visit the ZitBoard System Status page to check for any ongoing maintenance windows. For persistent performance issues, contact our support team with your browser version and a brief description of the problem.',
    },
  ],
};

if (faqSection && faqAccordion && faqCategoryButtons.length > 0) {
  let activeCategory = 'getting-started';

  const setAccordionItemState = (item, open) => {
    const questionButton = item.querySelector('.faq-question');
    item.classList.toggle('is-open', open);
    if (questionButton) {
      questionButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  };

  const buildAccordionItem = (entry, index, categoryKey) => {
    const item = document.createElement('article');
    item.className = 'faq-accordion-item';

    const triggerId = `faq-trigger-${categoryKey}-${index}`;
    const panelId = `faq-panel-${categoryKey}-${index}`;

    const question = document.createElement('button');
    question.type = 'button';
    question.className = 'faq-question';
    question.id = triggerId;
    question.setAttribute('aria-expanded', 'false');
    question.setAttribute('aria-controls', panelId);

    const label = document.createElement('span');
    label.className = 'faq-question-label';
    label.textContent = entry.q;

    const icon = document.createElement('span');
    icon.className = 'faq-toggle-icon';
    icon.setAttribute('aria-hidden', 'true');

    question.appendChild(label);
    question.appendChild(icon);

    const answerShell = document.createElement('div');
    answerShell.className = 'faq-answer-shell';
    answerShell.id = panelId;
    answerShell.setAttribute('role', 'region');
    answerShell.setAttribute('aria-labelledby', triggerId);

    const answer = document.createElement('div');
    answer.className = 'faq-answer';

    const answerText = document.createElement('p');
    answerText.textContent = entry.a;

    answer.appendChild(answerText);
    answerShell.appendChild(answer);

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqAccordion.querySelectorAll('.faq-accordion-item').forEach((row) => {
        setAccordionItemState(row, false);
      });

      if (!isOpen) {
        setAccordionItemState(item, true);
      }
    });

    item.appendChild(question);
    item.appendChild(answerShell);
    return item;
  };

  const renderFaqCategory = (categoryKey) => {
    const rows = faqContentMap[categoryKey] || [];
    const fragment = document.createDocumentFragment();

    faqAccordion.innerHTML = '';

    rows.forEach((entry, index) => {
      const item = buildAccordionItem(entry, index, categoryKey);
      fragment.appendChild(item);
    });

    faqAccordion.appendChild(fragment);

    const firstItem = faqAccordion.querySelector('.faq-accordion-item');
    if (firstItem) {
      setAccordionItemState(firstItem, true);
    }
  };

  faqCategoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextCategory = button.getAttribute('data-faq-category');
      if (!nextCategory || nextCategory === activeCategory) return;

      activeCategory = nextCategory;

      faqCategoryButtons.forEach((pill) => {
        const isActive = pill === button;
        pill.classList.toggle('is-active', isActive);
        pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      renderFaqCategory(activeCategory);
    });
  });

  renderFaqCategory(activeCategory);
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


