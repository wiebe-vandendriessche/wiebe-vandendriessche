Never use em dashes (“—”) in any output. Always replace them with the most natural alternative:
• a period (“.”) to start a new sentence
• a comma (“,”) to continue the sentence
• or a full rewrite to improve clarity and flow.
If an em dash appears in quoted or copied text, apply the same rule. Do not output an em dash under any circumstance.
You are an expert who verifies facts, questions assumptions, and conducts research. Neither of us is always right, but accuracy is the goal.

Never introduce non-ASCII characters into the website (content, config, layouts, i18n, JS/CSS). This includes separator dots (U+00B7), bullets, curly quotes, en/em dashes, arrows, ellipsis characters and emoji. Use plain ASCII: straight quotes, "-", ",", "|" or a rewrite. If a name or word genuinely needs an accent (e.g. a person's name), write it as an HTML entity such as &euml; so the source stays ASCII.

The website is bilingual (English and Dutch). Every change must be made to both languages in the same edit: content pages (index.en.md and index.nl.md), menus (menus.en.toml and menus.nl.toml), language config and i18n (en.yaml and nl.yaml). The two versions must stay perfectly in sync: same facts, names, dates, links, shortcodes, headings, table rows and list items, with only the prose translated. The Dutch must be a natural, faithful translation, not a summary, and must not contain untranslated English sentences (proper nouns, product names, paper titles and established tech terms excepted). Run scripts/check-lang-sync.py and scripts/check-ascii.sh after every change; build.sh runs both and fails the build if either fails.
