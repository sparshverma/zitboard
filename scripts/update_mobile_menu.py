import os
import re
import glob

dynamic_island = '''<header class="dynamic-island" aria-label="Primary Navigation">
      <div class="island-content">
        <div class="island-group group-left">
          <a href="index.html#features">Features</a>
          <a href="index.html#why">Why Us</a>
          <a href="index.html#results">Results</a>
          <a href="product.html">Product</a>
        </div>
        
        <a class="island-logo" href="index.html" aria-label="Home">
          <img src="logo_nobg.webp" alt="ZitBoard Logo" class="header-logo-img">
        </a>
        
        <div class="island-group group-right">
          <a href="integrations.html">Integrations</a>
          <a href="index.html#faq">FAQ</a>
          <a href="pricing.html">Pricing</a>
          <div class="island-actions">
            <button class="theme-toggle btn-icon" aria-label="Toggle Dark Mode">
              <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <a class="nav-demo-btn cta-track" data-cta="nav_book_demo" href="index.html#cta">Book Demo</a>
          </div>
        </div>

        <button class="mobile-menu-toggle" aria-label="Open Mobile Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="three-dots">
            <circle cx="5" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="19" cy="12" r="2" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div class="mobile-dropdown">
        <a href="index.html">Home</a>
        <a href="product.html">Product</a>
        <a href="integrations.html">Integrations</a>
        <a href="index.html#features">Features</a>
        <a href="index.html#why">Why Us</a>
        <a href="index.html#results">Results</a>
        <a href="index.html#faq">FAQ</a>
        <a href="pricing.html">Pricing</a>
        <a href="status.html">Status</a>
        <a href="privacy.html">Privacy</a>
        <a href="security.html">Security</a>
        <div class="mobile-dropdown-actions">
          <button class="theme-toggle btn-icon" aria-label="Toggle Dark Mode">
            <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
        </div>
      </div>
    </header>'''

for fpath in glob.glob(os.path.join(os.path.dirname(os.path.dirname(__file__)), '*.html')):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace the existing header
    content = re.sub(r'<header class="dynamic-island".*?</header>', dynamic_island, content, flags=re.DOTALL)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated header to include mobile menu on", fpath)

