"""Optional local interaction check, using an already-installed Chromium and Playwright."""
from pathlib import Path
from tempfile import TemporaryDirectory
import os
from playwright.sync_api import sync_playwright
with TemporaryDirectory() as tmp, sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',env={**os.environ,'HOME':tmp,'XDG_CONFIG_HOME':tmp},args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking'])
    page=b.new_page(viewport={'width':1280,'height':930},device_scale_factor=1)
    page.route('http://**/*',lambda route:route.abort())
    page.route('https://**/*',lambda route:route.abort())
    errors=[]
    page.on('pageerror',lambda x:errors.append(str(x)))
    page.goto(Path(__file__).with_name('index.html').resolve().as_uri());page.wait_for_timeout(350)
    assert page.locator('#freq').inner_text()=='261.6 Hz'
    # Detect nonblank rendered vessels on every canvas.
    pixels=page.locator('canvas').evaluate_all("""cc=>cc.map(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.filter((v,i)=>i%4===3&&v).length)""")
    assert min(pixels)>1500,pixels
    if os.environ.get('KILN_PREVIEW'): page.screenshot(path='/tmp/kiln-ui.png')
    page.locator('.pot').nth(2).click();assert page.locator('#vname').inner_text()=='Celadon bowl'
    page.locator('#chord').select_option('Am');page.locator('#tune').click();print('A minor',page.locator('.spec').all_inner_texts())
    page.locator('#strike').click();assert 'Struck the trio' in page.locator('#status').inner_text()
    page.locator('#modes button').nth(2).click();assert 'mode 4' in page.locator('#status').inner_text()
    page.get_by_text('Check the model against a ring').click();page.locator('#check').click();print(page.locator('#proof').inner_text())
    page.set_viewport_size({'width':375,'height':812});page.wait_for_timeout(250)
    assert page.evaluate('document.documentElement.scrollWidth')==375
    if os.environ.get('KILN_PREVIEW'): page.screenshot(path='/tmp/kiln-mobile.png')
    assert not errors,errors
    print('Surface pixels:',pixels,'; mobile width: 375 px; no script errors')
    b.close()
