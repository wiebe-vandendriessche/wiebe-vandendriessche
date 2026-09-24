#!/usr/bin/env python3
"""Audit the CSP's inline-script sha256 hashes against a built site.

Hugo minifies inline script bodies, so hashes must be taken from BUILT output,
never from template source. Any whitespace change in an inline script -- or a
theme submodule update -- invalidates its hash and silently disables it.

    hugo build --gc --minify -d /tmp/site
    python3 scripts/csp-inline-hashes.py /tmp/site

Reports scripts that need a hash and hashes that no longer match anything.
type=application/json and type=application/ld+json blocks are data, not script:
script-src does not apply to them and they must NOT be given hashes.
"""
import base64, glob, hashlib, json, os, re, sys

site = sys.argv[1] if len(sys.argv) > 1 else "public"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
csp = next(h["value"] for h in json.load(open(os.path.join(root, "vercel.json")))
           ["headers"][0]["headers"] if h["key"] == "Content-Security-Policy")
allowed = set(re.findall(r"'sha256-[^']+'", csp))

found = {}
for f in glob.glob(os.path.join(site, "**", "*.html"), recursive=True):
    html = open(f, encoding="utf-8", errors="replace").read()
    for m in re.finditer(r"<script([^>]*)>(.*?)</script>", html, re.S):
        attrs, body = m.group(1), m.group(2)
        if "src=" in attrs or re.search(r'type=["\']?application/(ld\+)?json', attrs):
            continue
        h = "'sha256-" + base64.b64encode(hashlib.sha256(body.encode()).digest()).decode() + "'"
        e = found.setdefault(h, {"n": 0, "page": os.path.relpath(f, site), "ex": body.strip()[:70]})
        e["n"] += 1

missing = {h: e for h, e in found.items() if h not in allowed}
stale = allowed - set(found)
for h, e in sorted(found.items(), key=lambda kv: -kv[1]["n"]):
    print(f"{'OK' if h in allowed else 'MISSING':<8} {e['n']:>4}  {h}")
    if h in missing:
        print(f"{'':<8} {'':>4}  {e['page']}: {e['ex']!r}")
for h in sorted(stale):
    print(f"{'STALE':<8} {'':>4}  {h}  (matches no page; safe to remove)")
print(f"\n{len(missing)} missing, {len(stale)} stale")
sys.exit(1 if (missing or stale) else 0)
