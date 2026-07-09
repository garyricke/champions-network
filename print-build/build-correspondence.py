#!/usr/bin/env python3
"""Build correspondence.html for Champions Network.

Wraps the global `correspondence` skill: runs its generator, then re-skins the
output to the Champions brand and re-applies the sessionStorage password gate
used by the other internal pages (cn_auth / markrules).

The skill rebuilds correspondence.html from scratch each run, so the rebranding
and the gate must be re-applied every time. Never hand-edit correspondence.html
— edit the emails in plan/ and re-run:

    python3 print-build/build-correspondence.py
"""
import importlib.util
import os
import re
import sys

SKILL = os.path.expanduser("~/.claude/skills/correspondence/build_correspondence.py")
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GOLD = "#BB8C3A"
GOLD_LIGHT = "#d4a854"
LOGO = "logo-champions-network-20mar2026-on-dark-background.svg"
FAVICON = "favicon-champions-network.svg"

FONTS = ("https://fonts.googleapis.com/css2?family=Bebas+Neue"
         "&family=Poppins:wght@300;400;600;700&display=swap")

GATE = """
<!-- ============================================================
     PASSWORD GATE — Internal document. Key: cn_auth
     Re-applied by print-build/build-correspondence.py on each rebuild.
     ============================================================ -->
<style>
  #pw-gate{position:fixed;inset:0;z-index:9999;background:#021e2e;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;}
  #pw-gate::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(187,140,58,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(187,140,58,.06) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;}
  #pw-box{position:relative;background:rgba(255,255,255,.04);border:1px solid rgba(187,140,58,.25);border-radius:16px;padding:48px 40px;text-align:center;width:min(400px,90vw);box-shadow:0 24px 80px rgba(0,0,0,.5);}
  #pw-box img{height:48px;margin-bottom:24px;display:block;margin-inline:auto;}
  #pw-box h2{font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#BB8C3A;letter-spacing:.08em;margin:0 0 8px;}
  #pw-box .sub{font-size:.85rem;color:rgba(236,244,249,.55);margin:0 0 28px;letter-spacing:.02em;}
  #pw-input{width:100%;padding:12px 16px;background:rgba(0,0,0,.3);border:1px solid rgba(187,140,58,.3);border-radius:8px;color:#fff;font-size:.95rem;font-family:inherit;outline:none;transition:border-color .2s;}
  #pw-input:focus{border-color:#BB8C3A;}
  #pw-btn{margin-top:14px;width:100%;padding:12px;background:#BB8C3A;color:#021e2e;border:0;border-radius:8px;font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:.1em;cursor:pointer;transition:background .2s;}
  #pw-btn:hover{background:#d4a04a;}
  #pw-error{font-size:.8rem;color:#ff7a7a;margin:12px 0 0;min-height:1.2em;}
  .pw-shake{animation:pwShake .35s;}
  @keyframes pwShake{0%,100%{transform:translateX(0);}25%{transform:translateX(-8px);}75%{transform:translateX(8px);}}
</style>
<div id="pw-gate">
  <div id="pw-box">
    <img src="logo-champions-network-20mar2026-on-dark-background.svg" alt="Champions Network">
    <h2>Internal Document</h2>
    <p class="sub">This page is password protected.</p>
    <input id="pw-input" type="password" placeholder="Enter password" autocomplete="current-password">
    <button id="pw-btn">Enter</button>
    <p id="pw-error"></p>
  </div>
</div>
<script>
(function(){
  var KEY='cn_auth',PASS='markrules',gate=document.getElementById('pw-gate');
  if(sessionStorage.getItem(KEY)==='1'){gate.style.display='none';return;}
  document.body.style.overflow='hidden';
  function attempt(){
    if(document.getElementById('pw-input').value===PASS){
      sessionStorage.setItem(KEY,'1');
      document.body.style.overflow='';
      gate.style.display='none';
    } else {
      document.getElementById('pw-error').textContent='Incorrect password. Try again.';
      var box=document.getElementById('pw-box');
      box.classList.remove('pw-shake');
      void box.offsetWidth;
      box.classList.add('pw-shake');
    }
  }
  document.getElementById('pw-btn').addEventListener('click',attempt);
  document.getElementById('pw-input').addEventListener('keydown',function(e){if(e.key==='Enter')attempt();});
})();
</script>
"""

REBRAND = [
    ("Correspondence — Olsson Roofing", "Correspondence — Champions Network"),
    ("https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900"
     "&family=Inter:wght@400;500;600&display=swap", FONTS),
    # Body/base type + the dark charcoal gradient -> Constitution Navy.
    ("font-family:'Inter',system-ui,sans-serif; "
     "background:linear-gradient(165deg,#1e1e1e 0%,#161616 45%,#0d0d0d 100%);",
     "font-family:'Poppins',system-ui,sans-serif; font-weight:300; "
     "background:linear-gradient(165deg,#021e2e 0%,#033f5c 55%,#055A81 100%);"),
    ("'Montserrat',sans-serif", "'Bebas Neue',sans-serif"),
    ("'Inter',system-ui,sans-serif", "'Poppins',system-ui,sans-serif"),
    ("--red-soft:#F0706D", f"--red-soft:{GOLD_LIGHT}"),
    ("rgba(233,50,46,0.12)", "rgba(187,140,58,0.16)"),
    ('title="Back to olssonroofing.com"', 'title="Back to champions-network.com"'),
    ('alt="Olsson Roofing"', 'alt="Champions Network"'),
    ("Every response email sent to the Olsson team",
     "Every response email sent from the Champions Network"),
    # This project's admin menu lives on index.html, not admin.html.
    ('<a class="backlink" href="admin.html">', '<a class="backlink" href="index.html">'),
    ("Back to admin", "Back to the site"),
]


def main():
    os.chdir(REPO)

    spec = importlib.util.spec_from_file_location("corr", SKILL)
    corr = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(corr)

    corr.RED, corr.LOGO, corr.FAVICON = GOLD, LOGO, FAVICON
    corr.main()

    with open("correspondence.html", encoding="utf-8") as fh:
        out = fh.read()

    for old, new in REBRAND:
        if old not in out:
            print(f"  !! rebrand miss: {old[:60]!r}", file=sys.stderr)
        out = out.replace(old, new)

    # Bebas has no weight range; strip inherited numeric weights on headings.
    out = re.sub(r"(font-family:'Bebas Neue',sans-serif; font-size:[^;]+); font-weight:\d+",
                 r"\1", out)

    # The skill takes the recipient from the greeting, so it renders "To: Hi Mark".
    # Drop the salutation, keep the name.
    out = re.sub(r'(<span class="to">To: )(?:Hi|Hey|Hello|Dear|Good morning|Good afternoon)\s+',
                 r"\1", out, flags=re.I)

    out = out.replace("</body>", GATE + "</body>", 1)

    with open("correspondence.html", "w", encoding="utf-8") as fh:
        fh.write(out)
    print("Rebranded + gated correspondence.html")


if __name__ == "__main__":
    sys.exit(main())
