import os
import re

html_path = 'zombie_2_nguoi_v37_player_speed.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Create directories
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# Extract style
style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
if style_match:
    style_content = style_match.group(1).strip()
    with open('static/css/style.css', 'w', encoding='utf-8') as f:
        f.write(style_content)
else:
    print("No <style> block found.")

# Extract script
script_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
if script_match:
    script_content = script_match.group(1).strip()
    with open('static/js/game.js', 'w', encoding='utf-8') as f:
        f.write(script_content)
else:
    print("No <script> block found.")

# Remove style and script from HTML
new_html = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="{{ url_for(\'static\', filename=\'css/style.css\') }}">', content, flags=re.DOTALL)
new_html = re.sub(r'<script>.*?</script>', '<script src="{{ url_for(\'static\', filename=\'js/game.js\') }}"></script>', new_html, flags=re.DOTALL)

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Extraction completed successfully!")
