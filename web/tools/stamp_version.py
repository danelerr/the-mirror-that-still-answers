"""Stamps a new version on every local script and style sheet in web/index.html.

Browsers keep old copies of main.js and style.css; a new ?v= on each publish makes
every visitor load the current version. Run before publishing:

    python web/tools/stamp_version.py
"""
import io
import os
import re
import time

INDEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "index.html")
stamp = time.strftime("%Y%m%d%H%M%S")
html = io.open(INDEX, encoding="utf-8").read()
html = re.sub(r'((?:src|href)="(?!https?:)[^"?]+\.(?:js|css))(?:\?v=[^"]*)?"', r'\1?v=' + stamp + '"', html)
html = re.sub(r'window\.BUILD = "[^"]*";', 'window.BUILD = "' + stamp + '";', html)
io.open(INDEX, "w", encoding="utf-8", newline="\n").write(html)
print("version", stamp)
