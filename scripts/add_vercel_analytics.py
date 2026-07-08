#!/usr/bin/env python3
"""
Script to add Vercel Web Analytics and Speed Insights to all HTML files.
"""

import os
import re
from pathlib import Path

# Analytics scripts to add (right before </head>)
ANALYTICS_SCRIPTS = """    <!-- Vercel Web Analytics -->
    <script>
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>
    <!-- Vercel Speed Insights -->
    <script>
      window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/speed-insights/script.js"></script>
"""

def add_analytics_to_html(file_path):
    """Add Vercel Analytics scripts to an HTML file if not already present."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if analytics is already added
    if '/_vercel/insights/script.js' in content:
        print(f"  ✓ Analytics already present in {file_path}")
        return False
    
    # Find </head> tag and insert scripts before it
    if '</head>' in content:
        content = content.replace('</head>', f'{ANALYTICS_SCRIPTS}  </head>')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ Added analytics to {file_path}")
        return True
    else:
        print(f"  ✗ No </head> tag found in {file_path}")
        return False

def main():
    """Main function to process all HTML files."""
    print("Adding Vercel Analytics to HTML files...\n")
    
    # Get all HTML files in the root directory
    html_files = list(Path('.').glob('*.html'))
    
    updated_count = 0
    for html_file in html_files:
        if add_analytics_to_html(html_file):
            updated_count += 1
    
    print(f"\n✓ Updated {updated_count} HTML files")

if __name__ == '__main__':
    main()
