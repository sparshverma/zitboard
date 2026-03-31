import os
import re
import glob

footer_html = '''<footer class="site-footer">
      <div class="container">
        <div class="footer-links-grid">
          <div class="footer-col">
            <h4>Product</h4>
            <a href="index.html#features">Platform Features</a>
            <a href="product.html">Full Capabilities</a>
            <a href="integrations.html">Integrations & Plugins</a>
            <a href="index.html#pricing">Pricing Plans</a>
          </div>
          <div class="footer-col">
            <h4>Resources</h4>
            <a href="index.html#results">Case Studies</a>
            <a href="index.html#why">Why ZitBoard?</a>
            <a href="index.html#faq">FAQ</a>
            <a href="status.html">System Status</a>
          </div>
          <div class="footer-col">
            <h4>Company</h4>
            <a href="mailto:demo@zitboard.com">Contact Us</a>
            <a href="security.html">Security</a>
            <a href="privacy.html">Privacy</a>
          </div>
          <div class="footer-col">
            <h4>Sitemap</h4>
            <a href="index.html">Home</a>
            <a href="product.html">Product Detail</a>
            <a href="sitemap.xml">XML Map</a>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 ZitBoard. Multi-tenant intelligence for revenue and talent.</p>
        </div>

        <div class="footer-watermark">
          <img src="logo_nobg.jpg" alt="ZitBoard Logo" class="footer-logo-img">
          ZitBoard
        </div>
      </div>
    </footer>'''

for fpath in glob.glob('*.html'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace <footer class="site-footer">...</header>
    content = re.sub(r'<footer class="site-footer".*?</footer>', footer_html, content, flags=re.DOTALL)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated footer for", fpath)

