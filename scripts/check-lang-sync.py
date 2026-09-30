#!/usr/bin/env python3
"""Check that the English and Dutch versions of the site are in sync (see CLAUDE.md).

Translated text may differ, structure may not. For every content page, menu and
i18n file it compares:
  - that both languages exist
  - front matter keys, and values that are not translated (dates, weights, flags)
  - shortcodes and their untranslated parameters, links, headings, table rows,
    list items and images

    python3 scripts/check-lang-sync.py
"""
import glob, os, re, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)

# Front matter keys whose values are prose and get translated.
TRANSLATED_KEYS = {"title", "description", "summary", "tags", "categories", "linkTitle"}
# Shortcode parameters whose values are prose and get translated.
TRANSLATED_PARAMS = {"header", "subheader", "badge", "title", "alt", "caption"}

errors = []


def fail(path, msg):
    errors.append(f"{path}: {msg}")


def split_front_matter(text):
    m = re.match(r"---\n(.*?)\n---\n?(.*)", text, re.S)
    return (m.group(1), m.group(2)) if m else ("", text)


def front_matter(fm):
    out, key = {}, None
    for line in fm.splitlines():
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if m:
            key = m.group(1)
            out[key] = m.group(2).strip()
        elif key and line.startswith((" ", "\t")):
            out[key] += "\n" + line.strip()
    return out


def structure(body):
    body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
    shortcodes = []
    for m in re.finditer(r"\{\{[<%]\s*(/?[\w-]+)(.*?)[%>]\}\}", body):
        params = {k: a or b for k, a, b in re.findall(r'(\w+)=(?:"([^"]*)"|(\S+))', m.group(2))}
        kept = {k: v for k, v in params.items() if k not in TRANSLATED_PARAMS}
        positional = re.sub(r'\w+=(?:"[^"]*"|\S+)', "", m.group(2)).split()
        shortcodes.append((m.group(1), tuple(sorted(kept.items())), tuple(positional)))
    # Sorted: a translation may reorder links within a sentence.
    links = sorted(re.findall(r"\]\(([^)]+)\)", body))
    return {
        "shortcodes": shortcodes,
        "links": links,
        "headings": [len(h) for h in re.findall(r"^(#+) ", body, re.M)],
        "table rows": len(re.findall(r"^\|", body, re.M)),
        "list items": len(re.findall(r"^\s*(?:[-*]|\d+\.) ", body, re.M)),
        "images": len(re.findall(r"!\[", body)),
    }


# Content pages
for en in sorted(glob.glob("content/**/*.en.md", recursive=True)):
    nl = en[: -len(".en.md")] + ".nl.md"
    if not os.path.exists(nl):
        fail(en, "missing Dutch version")
        continue
    fm_en, body_en = split_front_matter(open(en, encoding="utf-8").read())
    fm_nl, body_nl = split_front_matter(open(nl, encoding="utf-8").read())
    a, b = front_matter(fm_en), front_matter(fm_nl)
    if set(a) != set(b):
        fail(en, f"front matter keys differ: only EN {sorted(set(a) - set(b))}, only NL {sorted(set(b) - set(a))}")
    for k in set(a) & set(b) - TRANSLATED_KEYS:
        if a[k] != b[k]:
            fail(en, f"front matter '{k}' differs: EN {a[k]!r} vs NL {b[k]!r}")
    for (k, x), (_, y) in zip(structure(body_en).items(), structure(body_nl).items()):
        if x != y:
            fail(en, f"{k} differ:\n    EN {x}\n    NL {y}")
for nl in sorted(glob.glob("content/**/*.nl.md", recursive=True)):
    if not os.path.exists(nl[: -len(".nl.md")] + ".en.md"):
        fail(nl, "missing English version")


# Menus: same entries in the same order, only names may differ
def menu(path):
    items = []
    for block in open(path, encoding="utf-8").read().split("[[")[1:]:
        kind = block.split("]]")[0]
        fields = dict(re.findall(r'^\s*(\w+)\s*=\s*(.+)$', block, re.M))
        items.append((kind, fields.get("pageRef"), fields.get("url"), fields.get("weight"),
                      fields.get("pre"), "parent" in fields))
    return items


if menu("config/_default/menus.en.toml") != menu("config/_default/menus.nl.toml"):
    fail("config/_default/menus.*.toml", "menu entries differ between EN and NL")


# i18n: same keys
def keys(path):
    out, stack = set(), []
    for line in open(path, encoding="utf-8"):
        m = re.match(r"^(\s*)([\w.-]+):", line)
        if not m:
            continue
        depth = len(m.group(1)) // 2
        stack = stack[:depth] + [m.group(2)]
        out.add(".".join(stack))
    return out


ke, kn = keys("i18n/en.yaml"), keys("i18n/nl.yaml")
if ke != kn:
    fail("i18n/*.yaml", f"keys differ: only EN {sorted(ke - kn)}, only NL {sorted(kn - ke)}")

if errors:
    print("English and Dutch are out of sync:", file=sys.stderr)
    for e in errors:
        print("  " + e, file=sys.stderr)
    sys.exit(1)
print("Language sync check passed.")
