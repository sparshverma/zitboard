(() => {
  const testimonialRows = [
    [
      {
        name: 'Arjun Mehta',
        role: 'Founder · Rootline Agency',
        rating: 5,
        quote: 'The sales plugin alone paid for itself in month one. I can finally see deal velocity and forecasted close in one place.'
      },
      {
        name: 'Lena Hoffman',
        role: 'Co-founder · Beryl Creative',
        rating: 5,
        quote: 'We cut our project kickoff time from two days to four hours. That\'s meant two extra clients this quarter without hiring anyone new.'
      },
      {
        name: 'Marcus Teo',
        role: 'Sales Director · Vantiv Labs',
        rating: 5,
        quote: 'My CEO finally trusts our forecast slides because the numbers come from ZitBoard, not a spreadsheet I built.'
      },
      {
        name: 'Sanya Kapoor',
        role: 'Boutique Studio Owner',
        rating: 4,
        quote: 'ZitBoard replaced four separate subscriptions. I used to spend Sunday evenings doing admin. Now I don\'t.'
      },
      {
        name: 'Rishi Patel',
        role: 'Founder · Loopstack',
        rating: 5,
        quote: 'We went from seed to Series A and never had to migrate to a different tool. That continuity is priceless.'
      }
    ],
    [
      {
        name: 'Priya Nair',
        role: 'Operations Lead · Stackly',
        rating: 5,
        quote: 'Roles and permissions are actually intuitive. It removed a whole category of "wait, what does X see?" questions from our weekly calls.'
      },
      {
        name: 'Daniel Osei',
        role: 'Freelance Product Consultant',
        rating: 4,
        quote: 'I haven\'t had a late payment in three months. Invoicing doesn\'t feel like a chore anymore.'
      },
      {
        name: 'Tom Aguilar',
        role: 'Head of Revenue · Driftwave',
        rating: 5,
        quote: 'I get notified before deals go cold — not after. That shift has changed how our team runs pipeline reviews entirely.'
      },
      {
        name: 'Aisha Balogun',
        role: 'Project Manager · Forefront Consulting',
        rating: 4,
        quote: 'Tasks, deals, and timelines all talk to each other. We cut the number of status update meetings in half.'
      },
      {
        name: 'Claire Beaumont',
        role: 'Freelance Brand Strategist',
        rating: 5,
        quote: 'Clients comment on how professional everything looks. One asked which agency tool I was using — now they\'ve signed up too.'
      }
    ]
  ];

  const getInitials = (name) => {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => {
      const isFilled = index < rating;
      return `<span class="zitboard-testimonials__star${isFilled ? '' : ' is-empty'}" aria-hidden="true">★</span>`;
    }).join('');
  };

  const renderCard = (item, isClone = false) => {
    const initials = getInitials(item.name);
    const ariaHidden = isClone ? ' aria-hidden="true"' : '';

    return `
      <article class="zitboard-testimonials__card" role="listitem"${ariaHidden}>
        <div class="zitboard-testimonials__stars" aria-label="${item.rating} out of 5 stars">
          ${renderStars(item.rating)}
        </div>
        <p class="zitboard-testimonials__quote">
          <span class="zitboard-testimonials__quote-mark" aria-hidden="true">&quot;</span>
          <span class="zitboard-testimonials__quote-text">${item.quote}</span>
        </p>
        <div class="zitboard-testimonials__author">
          <div class="zitboard-testimonials__avatar" aria-hidden="true">${initials}</div>
          <div class="zitboard-testimonials__author-copy">
            <h3>${item.name}</h3>
            <p>${item.role}</p>
          </div>
        </div>
      </article>
    `;
  };

  const initTestimonials = () => {
    const section = document.getElementById('testimonials');
    if (!section) {
      return;
    }

    const rows = section.querySelectorAll('[data-testimonial-row]');
    if (rows.length < 2) {
      console.warn('[ZitBoard] Testimonials rows missing; expected 2 rows.');
      return;
    }

    try {
      rows.forEach((row, index) => {
        const rowData = testimonialRows[index];
        if (!rowData) {
          return;
        }

        const cards = rowData.map((item) => renderCard(item));
        const clones = rowData.map((item) => renderCard(item, true));
        row.innerHTML = [...cards, ...clones].join('');
      });
    } catch (error) {
      console.error('[ZitBoard] Testimonial rendering failed:', error);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonials, { once: true });
  } else {
    initTestimonials();
  }
})();
