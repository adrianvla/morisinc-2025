import { lenis } from './smoothScrolling';
import {isMobileDevice} from "../utils/isMobileDevice";

let lastScrollY = 0;
let v = 0;
let mainContent = null;
let accumulator = 0;

function initScrollZoom() {
    if(isMobileDevice()) return;
    mainContent = document.querySelector('.main-content');

    if (!mainContent) {
        console.warn('Main content element not found');
        return;
    }

    // Listen to Lenis scroll events to get velocity
    lenis.on('scroll', (e) => {
        const currentV = Math.abs(e.scroll - lastScrollY);
        accumulator += currentV < 1 ? 0 : currentV; // Accumulate velocity
        lastScrollY = e.scroll;
    });
    applyZoomEffect();
}

function applyZoomEffect() {
    return; //let's not add too many animations
    // Calculate zoom scale - subtract velocity from 1 to zoom out
    // Clamp the minimum scale to prevent going too small
    v = accumulator;
    accumulator*=0.9;
    const minScale = 0.5; // Minimum zoom scale
    const zoomFactor = 0.00004; // How much each velocity unit affects zoom
    const a = (Math.atan(Math.abs(v * zoomFactor))*2/Math.PI);
    let scale = Math.max(minScale, 1 - a);
    if(scale > 0.99) scale = 1; // Reset to 1 if close enough to avoid jitter

    // Apply transform with smooth transition
    mainContent.style.transform = `scale(${scale})`;
    mainContent.style.transformOrigin = 'center center';
    mainContent.style.transition = 'transform 0.1s ease-out';
    mainContent.style.gap = `${Math.max(0, a*1000)}px`; // Adjust gap based on zoom

    // Reset zoom after a short delay when scrolling stops
    // clearTimeout(mainContent.zoomTimeout);
    // mainContent.zoomTimeout = setTimeout(() => {
    //     mainContent.style.transform = 'scale(1)';
    //     mainContent.style.transition = 'transform 0.3s ease-out';
    // }, 150);

    requestAnimationFrame(applyZoomEffect);
}


export default initScrollZoom;
