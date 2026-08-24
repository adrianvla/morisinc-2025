/**
 * Font-loading synchronization.
 *
 * Geometry-measuring code (SplitText locks, snap points, --main-height,
 * autoFitText, ScrollTrigger positions) runs immediately on DOMContentLoaded
 * against whatever font metrics are available. On slow connections the
 * Japanese face (LogoPixies) can arrive seconds later and invalidate them.
 *
 * onJapaneseFontsReady(recalc) never blocks startup: it waits (via the Font
 * Loading API) for the one face Japanese layout depends on, then runs recalc.
 * Non-Japanese visitors get nothing — their faces are small and swap fast.
 */
const JP_FACE = "400 16px LogoPixies";

function onJapaneseFontsReady(recalc) {
    if (!document.fonts || !document.body.classList.contains("lang-jp")) return;
    if (document.fonts.check(JP_FACE)) {
        recalc();
        return;
    }
    document.fonts.load(JP_FACE)
        .then(recalc)
        .catch((e) => console.warn("LogoPixies failed to load; keeping fallback metrics", e));
}

export { onJapaneseFontsReady };
