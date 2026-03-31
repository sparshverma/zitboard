import glob

for fpath in glob.glob('*.html'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Revert the image back
    content = content.replace('logo_nobg.jpg', 'logo_nobg.webp')
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Reverted logo on", fpath)

