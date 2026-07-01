import os
import re
import glob

# Get the directory of the main website files
project_root = os.path.dirname(os.path.dirname(__file__))

dynamic_island = '''<header class="dynamic-island" aria-label="Primary Navigation">
      <div class="island-content">
        <div class="island-group group-left">
          <a href="/#features">Features</a>
          <a href="/product">Product</a>
          <a href="/blogs">Blogs</a>
        </div>
        
        <a class="island-logo" href="/" aria-label="Home">
          <img src="logo_nobg.webp" alt="ZitBoard Logo" class="header-logo-img">
        </a>
        
        <div class="island-group group-right">
          <a href="/pricing">Pricing</a>
          <a href="/#contact">Contact</a>
          <div class="island-actions">
            <button class="theme-toggle btn-icon" aria-label="Toggle Dark Mode">
              <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <svg class="icon-moon icon-moon-hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <a class="nav-demo-btn cta-track" data-cta="nav_login" href="/login">Login / Sign Up</a>
          </div>
        </div>

        <button class="mobile-menu-toggle" aria-label="Open Mobile Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="three-dots">
            <circle cx="5" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="19" cy="12" r="2" fill="currentColor" />
          </svg>
        </button>

        <span class="mobile-brand" aria-hidden="true">ZitBoard</span>
      </div>

      <div class="mobile-dropdown">
        <a href="/">Home</a>
        <a href="/product">Product</a>
        <a href="/blogs">Blogs</a>
        <a href="/#features">Features</a>
        <a href="/pricing">Pricing</a>
        <a href="/#contact">Contact</a>
        <a href="/privacy-and-security">Privacy &amp; Security</a>
        <div class="mobile-dropdown-actions">
          <a class="nav-demo-btn mobile-login-btn cta-track" data-cta="nav_login_mobile" href="/login">Login / Sign Up</a>
          <button class="theme-toggle btn-icon" aria-label="Toggle Dark Mode">
            <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg class="icon-moon icon-moon-hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
        </div>
      </div>
    </header>'''

footer_html = '''<footer class="site-footer">
      <div class="container">
        <div class="footer-links-grid">
          <div class="footer-col">
            <h4>Product</h4>
            <a href="/#features">Platform Features</a>
            <a href="/product">Full Capabilities</a>
            <a href="/integrations">Integrations &amp; Plugins</a>
            <a href="/pricing">Pricing Plans</a>
          </div>
          <div class="footer-col">
            <h4>Resources</h4>
            <a href="/#features">Features</a>
            <a href="/blogs">Blogs</a>
            <a href="/#faq">FAQ</a>
            <a href="/#testimonials">Testimonials</a>
          </div>
          <div class="footer-col">
            <h4>Company</h4>
            <a href="/#contact">Contact Us</a>
            <a href="/privacy-and-security">Privacy &amp; Security</a>
            <a href="/terms">Terms</a>
            <a href="/sitemap">Site Map</a>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 ZitBoard. Multi-tenant intelligence for revenue and talent.</p>
        </div>

        <div class="footer-watermark">
          <img src="logo_nobg.webp" alt="ZitBoard Logo" class="footer-logo-img">
          ZitBoard
        </div>
      </div>
    </footer>'''

# Update all HTML files except auth ones which use separate structures
for fpath in glob.glob(os.path.join(project_root, '*.html')):
    fname = os.path.basename(fpath)
    if fname in ['login.html', 'signup.html', 'forgot.html']:
        continue
        
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace header block
    content = re.sub(r'<header class="dynamic-island".*?</header>', dynamic_island, content, flags=re.DOTALL)
    
    # Replace footer block
    content = re.sub(r'<footer class="site-footer".*?</footer>', footer_html, content, flags=re.DOTALL)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated", fname)
