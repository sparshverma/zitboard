import os
import glob

for fpath in glob.glob(os.path.join(os.path.dirname(os.path.dirname(__file__)), '*.html')):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Revert the image back
    content = content.replace('logo_nobg.jpg', 'logo_nobg.webp')
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Reverted logo on", fpath)

