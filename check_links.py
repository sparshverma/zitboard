import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]
all_links = []
all_srcs = []

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        links = re.findall(r'href="(.*?)"', content)
        srcs = re.findall(r'src="(.*?)"', content)
        
        for link in links:
            if not link.startswith(('http', 'mailto:', '#', 'javascript:')):
                # Split off hash fragments for local files
                filepath = link.split('#')[0]
                if filepath and not os.path.exists(filepath):
                    print(f"Broken link in {file}: {link}")

        for src in srcs:
            if not src.startswith(('http', 'data:')):
                if not os.path.exists(src):
                    print(f"Missing src in {file}: {src}")
print("Check complete.")
