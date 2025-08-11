export default function initLazyLoad() {
    // Inject styles (idempotent) for canvas overlay
    if (!document.getElementById('pixelate-style')) {
        const style = document.createElement('style');
        style.id = 'pixelate-style';
        style.textContent = `
            .pixelation-wrapper{position:relative;display:inline-block;}
            .pixelation-wrapper canvas.pixelation-canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;pointer-events:none;}
            .pixelation-wrapper img{display:block;width:100%;height:auto;}
        `;
        document.head.appendChild(style);
    }

    // Config
    const MAX_BLOCK_SIZE = 32; // starting pixel block dimension in CSS pixels (bigger -> chunkier)
        const DURATION = 900; // ms for depixelation
        const FPS = 7; // throttle animation to ~3 fps
        const FRAME_MS = Math.round(1000 / FPS);
        const INTERSECT_DELAY_MS = 750; // must be in view this long before loading

    const images = document.querySelectorAll('img[data-src]:not([data-lazy-loaded])');
    images.forEach(img => {
        if (img.hasAttribute('data-lazy-loaded')) return;
        img.setAttribute('data-lazy-loaded', '');

        // Wrap image (idempotent)
        let wrapper = img.closest('.pixelation-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('span');
            wrapper.className = 'pixelation-wrapper';
            img.parentNode && img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
        }

        // Prepare canvas overlay immediately for initial pixelated low-res
        let canvas = wrapper.querySelector('canvas.pixelation-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'pixelation-canvas';
            wrapper.appendChild(canvas);
        }
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Offscreen helper reused
        const off = document.createElement('canvas');
        const offCtx = off.getContext('2d');
        offCtx.imageSmoothingEnabled = false;

        let lastW = 0, lastH = 0, dpr = window.devicePixelRatio || 1;

        function sizeCanvases(){
            const rect = img.getBoundingClientRect();
            if (!rect.width || !rect.height) return null;
            const cssW = Math.round(rect.width);
            const cssH = Math.round(img.naturalHeight * (rect.width / img.naturalWidth));
            if (cssW !== lastW || cssH !== lastH) {
                lastW = cssW; lastH = cssH;
                canvas.width = cssW * dpr;
                canvas.height = cssH * dpr;
                canvas.style.width = cssW + 'px';
                canvas.style.height = cssH + 'px';
                ctx.setTransform(1,0,0,1,0,0); // reset
                ctx.scale(dpr, dpr); // draw in CSS pixel coords
                ctx.imageSmoothingEnabled = false;
            }
            return { cssW, cssH };
        }

        function drawPixelated(source, block){
            const dims = sizeCanvases();
            if (!dims) return;
            const { cssW, cssH } = dims;
            if (!cssW || !cssH) return;
            const sampleW = Math.max(1, Math.round(cssW / block));
            const sampleH = Math.max(1, Math.round(cssH / block));
            if (off.width !== sampleW || off.height !== sampleH) {
                off.width = sampleW;
                off.height = sampleH;
            }
            offCtx.setTransform(1,0,0,1,0,0);
            offCtx.imageSmoothingEnabled = false;
            offCtx.clearRect(0,0,sampleW,sampleH);
            try { offCtx.drawImage(source, 0, 0, sampleW, sampleH); } catch(e) {}
            ctx.clearRect(0,0,cssW,cssH);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(off, 0,0,sampleW,sampleH, 0,0,cssW,cssH);
        }

        // Initial pixelated low-res (if image already loaded we can draw; else wait)
        const initialDraw = () => drawPixelated(img, MAX_BLOCK_SIZE);
        if (img.complete) initialDraw(); else img.addEventListener('load', initialDraw, { once:true });

        // Depixelation animation using high-res source
        function animateDepixelation(){
            const source = img; // high-res swapped already
            // Draw initial state at max block size to match overlay
            drawPixelated(source, MAX_BLOCK_SIZE);
            let elapsed = 0;
            const interval = setInterval(() => {
                elapsed += FRAME_MS;
                const t = Math.min(1, elapsed / DURATION);
                const eased = 1 - Math.pow(1 - t, 3);
                const block = Math.max(1, Math.round(MAX_BLOCK_SIZE - (MAX_BLOCK_SIZE - 1) * eased));
                drawPixelated(source, block);
                if (t >= 1) {
                    clearInterval(interval);
                    drawPixelated(source, 1);
                    canvas.remove();
                }
            }, FRAME_MS);
            const start = performance.now();
            // function step(now){
            //     const t = Math.min(1, (now - start)/DURATION);
            //     const eased = 1 - Math.pow(1 - t, 3);
            //     const block = Math.max(1, Math.round(MAX_BLOCK_SIZE - (MAX_BLOCK_SIZE - 1) * eased));
            //     drawPixelated(source, block);
            //     if (t < 1) requestAnimationFrame(step);
            //     else {
            //         drawPixelated(source, 1);
            //         canvas.remove();
            //     }
            // }
            // requestAnimationFrame(step);
        }

        function loadHighRes(){
            const highResSrc = img.dataset.src;
            if (!highResSrc) return;
            const hi = new Image();
            hi.onload = () => {
                img.src = highResSrc; // swap
                img.removeAttribute('data-src');
                animateDepixelation();
            };
            hi.onerror = () => { img.removeAttribute('data-src'); canvas.remove(); };
            hi.src = highResSrc;
        }

        if ('IntersectionObserver' in window) {
            let dwellTimer = null;
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (!dwellTimer) {
                            dwellTimer = setTimeout(() => {
                                loadHighRes();
                                obs.unobserve(img);
                                dwellTimer = null;
                            }, INTERSECT_DELAY_MS);
                        }
                    } else {
                        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
                    }
                });
            });
            observer.observe(img);
        } else {
            loadHighRes();
        }
    });
}