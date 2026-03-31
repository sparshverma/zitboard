import glob
import re

preload_script = """    <!-- Preload Theme to avoid flash -->
    <script>
      if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.dataset.theme = 'dark';
      }
    </script>
"""

for fpath in glob.glob('ZitBoard/*.html'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If already present, continue
    if "localStorage.getItem('theme')" in content:
        if fpath == 'ZitBoard\\index.html' or fpath == 'ZitBoard/index.html':
            pass
        else:
            print(f"Skipping {fpath} (already has preload)")
            continue

    if "localStorage.getItem('theme')" not in content:
        # Insert before closing head tag
        content = content.replace('</head>', f'{preload_script}</head>')
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated", fpath)

print("Done")
