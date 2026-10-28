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
            assert page.get_by_role("heading",name="Systems, tools, and delivery.").count()==1
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
            assert page.locator(".project-row:visible").count()==3
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
            for slug in ("lean-ai-ops","everything-program-management","automotive-llm-eval-harness","release-checklist","agent-eval","governance-playbook","agent-simulator","multi-agent-governance","ai-prism","prompt-harness-translator","mcp-agent-risk-checklist","nist-rmf-guide"):
                detail=page.context.new_page()
                detail.goto((ROOT/"dist/projects"/slug/"index.html").as_uri(),wait_until="domcontentloaded")
                accent=detail.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toUpperCase()")
                assert accent in ("#5F69D9","#8A98FA"),f"{slug}: stylesheet not loaded: {accent!r}"
                assert detail.locator('link[rel=stylesheet][href="../../assets/styles.css"]').count()==1
                assert detail.get_by_role("heading",name="How it works").count()==1
                assert detail.locator("[data-project-lab]").count()==1
                assert detail.locator('link[href="../../assets/labs.css"]').count()==1
                assert detail.locator('script[src="../../assets/project-labs.js"]').count()==1
                assert detail.locator("#lab-verdict").is_visible(),f"{slug} workbench did not mount"
                assert detail.locator('script[src="../../assets/extended-labs.js"]').count()==1
                if width in (1440,390):
                    if slug=="lean-ai-ops":
                        assert detail.locator("#lab-verdict").inner_text()=="CAPABILITY ESTIMATES COMPUTED"
                        detail.locator("#lab-observations").fill("9.7,10.0,11.5,10.1")
                        assert detail.locator("#lab-out").inner_text()=="1 / 4"
                        detail.locator("#lab-reset").click()
                        assert detail.locator("#lab-out").inner_text()=="0 / 12"
                    elif slug=="everything-program-management":
                        assert detail.locator("#lab-verdict").inner_text()=="RAID ROW CHECK PASSED"
                        detail.locator("#lab-probability").fill("4")
                        assert detail.locator("#lab-verdict").inner_text()=="REVIEW REQUIRED"
                        assert "4 × 4 = 16" in detail.locator("#lab-findings").inner_text()
                        detail.locator("#lab-score").fill("16")
                        assert detail.locator("#lab-verdict").inner_text()=="RAID ROW CHECK PASSED"
                    elif slug=="automotive-llm-eval-harness":
                        assert detail.locator("#lab-verdict").inner_text()=="PROTOTYPE CHECKS PASS"
                        detail.locator("#lab-case").select_option("CASE-002")
                        assert detail.locator("#lab-verdict").inner_text()=="PROTOTYPE CHECKS PASS"
                        detail.locator("#lab-s1").evaluate("(e)=>{e.value='0.90';e.dispatchEvent(new Event('input',{bubbles:true}));}")
                        assert detail.locator("#lab-verdict").inner_text()=="CASE BLOCKED"
                        assert "Safety hard gate" in detail.locator("#lab-findings").inner_text()
                    elif slug=="release-checklist":
                        assert detail.locator("#lab-verdict").inner_text()=="DECLARED RELEASE SUPPORTED"
                        detail.locator("#lab-outcome").select_option("release")
                        assert detail.locator("#lab-verdict").inner_text()=="INVALID DECISION RECORD"
                        detail.locator("#lab-hold").click()
                        assert detail.locator("#lab-valid").inner_text()=="COHERENT"
                        assert detail.locator("#lab-supported").inner_text()=="NO"
                    elif slug=="agent-eval":
                        assert detail.locator("#lab-verdict").inner_text()=="REPORT SEMANTICS PASS"
                        detail.locator("#lab-severity").select_option("critical")
                        assert detail.locator("#lab-verdict").inner_text()=="REPORT INCONSISTENT"
                        assert "critical finding" in detail.locator("#lab-findings").inner_text().lower()
                        detail.locator("#lab-recommendation").select_option("do_not_release")
                        detail.locator("#lab-status").select_option("not_approved")
                        assert detail.locator("#lab-verdict").inner_text()=="REPORT SEMANTICS PASS"
                    elif slug=="governance-playbook":
                        assert detail.locator("#lab-verdict").inner_text()=="REVIEW ROUTE PROPOSED"
                        detail.locator("#lab-exposure").select_option("irreversible")
                        assert detail.locator("#lab-verdict").inner_text()=="COMPLETE THE INTAKE"
                        detail.locator("#lab-affected").check()
                        detail.locator("#lab-stop").check()
                        assert detail.locator("#lab-verdict").inner_text()=="REVIEW ROUTE PROPOSED"
                    elif slug=="agent-simulator":
                        detail.locator("#lab-scenario").select_option("retry_then_success")
                        detail.locator("#lab-run").click()
                        assert detail.locator("#lab-outcome").inner_text()=="ACCEPT"
                        assert "bounded retry" in detail.locator("#lab-trace").inner_text().lower()
                        detail.locator("#lab-scenario").select_option("fallback_after_failure")
                        detail.locator("#lab-run").click()
                        assert detail.locator("#lab-outcome").inner_text()=="FALLBACK"
                        detail.locator("#lab-scenario").select_option("escalate_after_failure")
                        detail.locator("#lab-run").click()
                        assert detail.locator("#lab-outcome").inner_text()=="ESCALATE"
                    elif slug=="multi-agent-governance":
                        assert detail.locator("#lab-verdict").inner_text()=="ILLUSTRATIVE PATH CONSISTENT"
                        detail.locator("#lab-action").select_option("publish")
                        assert detail.locator("#lab-verdict").inner_text()=="OUTSIDE DECLARED AUTHORITY"
                        assert "prohibited" in detail.locator("#lab-findings").inner_text()
                        detail.locator("#lab-reset").click()
                    elif slug=="ai-prism":
                        assert detail.locator("#lab-results").inner_text()=="16"
                        detail.locator("#lab-query").fill("NIST")
                        assert int(detail.locator("#lab-results").inner_text())>=1
                        detail.locator("#lab-query").fill("zz-no-such-curated-source")
                        assert detail.locator("#lab-results").inner_text()=="0"
                        detail.locator("#lab-query").fill("")
                    elif slug=="prompt-harness-translator":
                        assert "Lossy conversion warning" in detail.locator("#lab-preview").inner_text()
                        detail.locator("#lab-target").select_option("cursor")
                        assert "source_metadata" in detail.locator("#lab-preview").inner_text()
                        detail.locator("#lab-target").select_option("generic")
                        assert detail.locator("#lab-loss").inner_text()=="NONE"
                    elif slug=="mcp-agent-risk-checklist":
                        assert detail.locator("#lab-verdict").inner_text()=="FICTIONAL FINDING STRUCTURED"
                        detail.locator("#lab-likelihood").fill("7")
                        assert detail.locator("#lab-verdict").inner_text()=="SCHEMA REVIEW REQUIRED"
                        detail.locator("#lab-likelihood").fill("4")
                        assert detail.locator("#lab-priority").inner_text()=="16"
                    elif slug=="nist-rmf-guide":
                        assert detail.locator("#lab-gaps").inner_text()=="8/8"
                        detail.locator("#lab-state0").select_option("not_applicable")
                        assert detail.locator("#lab-verdict").inner_text()=="EVIDENCE RECORD INCOMPLETE"
                        detail.locator("#lab-evidence0").fill("Documented exclusion for the fictional scope")
                        assert detail.locator("#lab-verdict").inner_text()=="DRAFT EVIDENCE MAP"
                if width<=590:
                    open_menu=detail.get_by_role("button",name="Open navigation")
                    open_menu.click()
                    assert detail.locator(".primary-nav").is_visible()
                    detail.keyboard.press("Escape")
                    assert open_menu.get_attribute("aria-expanded")=="false"
                assert detail.get_by_role("heading",name="What it does not establish").count()==1
                assert detail.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"),f"{slug} overflow at {width}"
                if label in ("desktop","mobile"):
                    # Capture the actual default experience, not whatever failure
                    # state was deliberately induced during the behavior test.
                    if slug=="release-checklist":
                        detail.locator("#lab-pilot").click()
                    elif slug=="ai-prism":
                        detail.locator("#lab-query").fill("")
                        detail.locator("#lab-topic").select_option("all")
                    elif slug=="agent-simulator":
                        detail.locator("#lab-scenario").select_option("normal_success")
                    else:
                        detail.locator("#lab-reset").click()
                    if detail.locator("html").get_attribute("data-theme")=="dark":
                        detail.locator("#theme-toggle").click()
                    detail.evaluate("window.scrollTo(0,0)")
                    detail.screenshot(path=str(OUT/(slug+"-"+label+".png")),full_page=True,animations="disabled")
                    detail.locator("#theme-toggle").click()
                    detail.evaluate("window.scrollTo(0,0)")
                    detail.screenshot(path=str(OUT/(slug+"-"+label+"-dark.png")),full_page=True,animations="disabled")
                detail.close()
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
