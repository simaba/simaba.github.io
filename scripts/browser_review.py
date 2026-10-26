#!/usr/bin/env python3
"""Browser evidence for human review; screenshots do not grant approval."""
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
from build import build
build()
OUT=ROOT/".qa"
OUT.mkdir(exist_ok=True)
VIEWPORTS=[("desktop",1440,900),("tablet",820,1180),("mobile",390,844),("small-mobile",320,740)]
results={}
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
    try:
        for label,width,height in VIEWPORTS:
            context=browser.new_context(viewport={"width":width,"height":height},
                                        device_scale_factor=1,reduced_motion="reduce")
            page=context.new_page(); errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            page.goto((ROOT/"dist/index.html").as_uri(),wait_until="domcontentloaded")
            page.evaluate("document.fonts.ready")
            accent=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toUpperCase()")
            assert accent=="#5F69D9",f"{label}: approved LIGHT indigo not loaded: {accent!r}"
            assert page.evaluate("getComputedStyle(document.querySelector('.hero-right')).height") != "auto"
            assert page.evaluate("document.querySelectorAll('link[rel=stylesheet]').length")==1
            assert page.locator('link[rel=stylesheet]').get_attribute('href')=="assets/styles.css"
            assert page.get_by_role("heading",name="Complex systems. Clearer decisions.").count()==1
            assert page.locator(".feature:visible").count()==4
            assert page.locator(".project-row:visible").count()==12
            if width<=590:
                assert page.locator(".project-type:visible").count()==12, "Mobile maturity labels should remain visible"
                assert float(page.locator(".project-description").first.evaluate("(e)=>parseFloat(getComputedStyle(e).fontSize)"))>=13
            assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1")
            if width<=590:
                menu=page.get_by_role("button",name="Open navigation")
                menu.click()
                assert page.locator(".primary-nav").is_visible()
                page.keyboard.press("Escape")
                assert menu.get_attribute("aria-expanded")=="false"
                assert page.evaluate("document.activeElement.id")=="menu-toggle"
                menu.click()
                page.get_by_role("link",name="Systems map").click()
                assert menu.get_attribute("aria-expanded")=="false"
            else:
                assert page.get_by_role("navigation",name="Primary navigation").is_visible()
            page.evaluate("window.scrollTo(0,0)")
            page.screenshot(path=str(OUT/(label+"-first-fold.png")),animations="disabled")
            page.screenshot(path=str(OUT/(label+".png")),full_page=True,animations="disabled")
            page.locator("#project-search").fill("privacy")
            assert page.locator(".project-row:visible").count()>=1
            page.locator("#project-search").fill("zz-no-matches-736")
            assert page.locator(".project-row:visible").count()==0
            assert page.locator("#empty-results").is_visible()
            page.locator("#project-search").fill("")
            page.locator('[data-filter="tool"]').click()
            assert page.locator(".project-row:visible").count()==2
            page.locator('[data-filter="all"]').click()
            page.locator("#project-search").focus()
            assert page.locator("#project-search").evaluate("(e)=>getComputedStyle(e).outlineStyle")!="none"
            page.locator("#theme-toggle").click()
            assert page.locator("html").get_attribute("data-theme")=="dark"
            dark_accent=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toUpperCase()")
            assert dark_accent=="#8A98FA",f"{label}: approved DARK lavender missing: {dark_accent!r}"
            if label in ("desktop","mobile"):
                page.evaluate("window.scrollTo(0,0)")
                page.screenshot(path=str(OUT/(label+"-dark.png")),full_page=True,animations="disabled")
                page.screenshot(path=str(OUT/(label+"-dark-first-fold.png")),animations="disabled")
            assert not errors,str(errors)
            results[label]="passed";context.close()
            print("PASS",label,width,height)
        # An independent smoke check with remote font requests blocked. The public
        # site must remain readable and navigable in regions where Google Fonts fail.
        fallback=browser.new_context(viewport={"width":320,"height":740},device_scale_factor=1)
        fallback.route("https://fonts.googleapis.com/**",lambda route:route.abort())
        fallback.route("https://fonts.gstatic.com/**",lambda route:route.abort())
        testpage=fallback.new_page()
        testpage.goto((ROOT/"dist/index.html").as_uri(),wait_until="domcontentloaded")
        testpage.evaluate("document.fonts.ready")
        assert testpage.locator("h1").is_visible()
        assert testpage.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"),"Fallback font layout overflow"
        assert testpage.locator(".project-row:visible").count()==12
        fallback.close()
        print("PASS fallback fonts at 320px")
    finally:
        browser.close()
hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.glob("*.png")}
(OUT/"review-manifest.json").write_text(json.dumps({"viewports":results,"sha256":hashes},indent=2)+"\n")
print("Screenshots:",len(hashes),"human design approval pending")
