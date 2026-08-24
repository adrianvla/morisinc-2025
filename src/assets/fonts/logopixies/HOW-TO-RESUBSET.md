Logopixies-subset.woff2 is a subset of Logopixies-owwBB.ttf (full font, kept here).

It covers: every character appearing in ALL shipped text sources
(src/assets/site-content/lang-jp/**, src/js/modules/translator.js,
src/assets/desc_translations.json, src/assets/*.json, src/html/*.html,
sign/neons/projects string literals) PLUS complete hiragana, katakana,
CJK punctuation, halfwidth katakana and fullwidth ASCII forms.

Characters NOT covered: kanji that appear nowhere in the current content.
If you add Japanese content with NEW kanji, those glyphs will render in the
fallback font (visibly different). Regenerate the subset:

    cd src/assets/fonts
    python3 - <<'EOF'
    import glob
    from fontTools import subset
    chars = set()
    for pattern in ["src/assets/site-content/lang-jp/**/*", "src/assets/*.json",
                    "src/html/*.html", "src/js/modules/*.js"]:
        for f in glob.glob(pattern, recursive=True):
            try: chars.update(open(f, encoding="utf-8", errors="ignore").read())
            except OSError: pass
    cmap = subset.load_font("logopixies/Logopixies-owwBB.ttf", subset.Options()).getBestCmap()
    unicodes = set(c for c in chars if c in cmap)
    unicodes |= set(range(0x3041, 0x3097)) | set(range(0x30A1, 0x3100))
    unicodes |= set(range(0x3000, 0x3041)) | set(range(0xFF01, 0xFFA0))
    opts = subset.Options(); opts.flavor = "woff2"; opts.name_IDs = ['*']; opts.layout_features = ['*']
    font = subset.load_font("logopixies/Logopixies-owwBB.ttf", opts)
    s = subset.Subsetter(options=opts); s.populate(unicodes=[ord(c) for c in unicodes]); s.subset(font)
    subset.save_font(font, "logopixies/Logopixies-subset.woff2", opts)
    EOF

(run from the repo root; the glob paths above assume it). Then copy the new
subset into dist/assets/fonts/logopixies/ on deploy. No other step needed —
the CSS and preload reference the stable filename.
