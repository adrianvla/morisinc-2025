import Lenis from 'lenis';
import Snap from 'lenis/snap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

gsap.registerPlugin(ScrollTrigger);

// Initialize smooth scrolling with Lenis
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    wrapper: document.querySelector('.main'),
    content: document.querySelector('.main-content'),
    autoRaf: true,
    touchMultiplier: 2,
    wheelMultiplier: 1,
});
let snap = null;

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);


function snapToSections(){
    //set css var
    try{
        snap.destroy();
    }catch(e){}

    snap = new Snap(lenis, {
        type: 'mandatory',
        duration:2,
        distanceThreshold: '100%',
    });
    const mainElement = document.querySelector('.main');
    const height = mainElement.getBoundingClientRect().height;
    //count sections
    const count = document.querySelectorAll('section.project').length;
    for(let i = 0; i < count; i++) {
        snap.add(i*height);
    }
}

// window.addEventListener('resize', snapToSections);
// snapToSections();


export {lenis, snap};