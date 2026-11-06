#!/usr/bin/env python3
"""Desktop-only QR, "Email me the link" and "Copy link" on the /get/ pages (Leah 11/6).
The /get/ pages are hand-kept HTML; this script injects (or refreshes) the block between
<!-- gq:start --> and <!-- gq:end -->. Idempotent.  python3 scripts/add-get-qr.py
Shown when the pointer is fine and can hover, or the screen is 1024px+. Phones keep today's page."""
import io, re, sys, urllib.parse
import segno

PAGES = [('get/index.html', 'MileCheck', 'https://milecheckapp.com/get/'),
         ('get/mountains/index.html', 'Mountain Visibility', 'https://milecheckapp.com/get/mountains/'),
         ('get/drawbridges/index.html', 'Seattle Drawbridges', 'https://milecheckapp.com/get/drawbridges/')]

CSS = ('<style>.gq{display:none}@media (hover:hover) and (pointer:fine),(min-width:1024px){'
       '.gq{display:block;margin:0 0 18px;padding:16px;border:1px solid #E5E5E5;border-radius:14px}'
       '.gq svg{width:168px;height:168px;display:block;margin:0 auto}'
       '.gq .cap{font-size:14px;color:#0F1419;font-weight:600;margin:8px 0 12px}'
       '.gq .pair a,.gq .pair button{flex:1;min-height:44px;font-size:14px;margin:0;background:#fff;color:#0F1419;border:1px solid #0F1419}}</style>')

def svg(url):
    q = segno.make(url, error='h')
    b = io.BytesIO()
    q.save(b, kind='svg', scale=4, border=4, xmldecl=False, svgns=True, nl=False,
           light='#fff', dark='#0F1419', title=None)
    return b.getvalue().decode()

def vb(url):
    return segno.make(url, error='h').symbol_size(scale=4, border=4)[0]

def block(app, url):
    mail = 'mailto:?subject=' + urllib.parse.quote(app + ' download link') + '&body=' + urllib.parse.quote(url, safe='')
    return ('<!-- gq:start -->' + CSS +
            '<div class="gq" aria-label="Get ' + app + ' on your phone">' + svg(url).replace('<svg ', '<svg role="img" viewBox="0 0 %d %d" aria-label="QR code for %s" ' % (vb(url), vb(url), url), 1) +
            '<p class="cap">Scan with your phone\'s camera</p>'
            '<div class="pair"><a class="btn" href="' + mail + '">Email me the link</a>'
            '<button class="btn" type="button" data-copy="' + url + '">Copy link</button></div>'
            '<script>(function(){var b=document.querySelector(".gq [data-copy]");if(!b)return;b.addEventListener("click",function(){var u=b.getAttribute("data-copy");function ok(){b.textContent="Copied";setTimeout(function(){b.textContent="Copy link"},2000)}'
            'if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(ok,function(){prompt("Copy this link",u)})}else{prompt("Copy this link",u)}});})();</script>'
            '</div><!-- gq:end -->\n')

for path, app, url in PAGES:
    s = open(path, encoding='utf8').read()
    s = re.sub(r'<!-- gq:start -->.*?<!-- gq:end -->\n?', '', s, flags=re.S)
    i = s.find('<a class="btn" href="https://apps.apple.com')
    if i < 0: sys.exit('no App Store button in ' + path)
    s = s[:i] + block(app, url) + s[i:]
    open(path, 'w', encoding='utf8').write(s)
    print('updated', path)
