import gsap from "gsap";
import {prefersReducedMotion} from "../../utils/prefersReducedMotion";

export default function leave() {
    if (prefersReducedMotion()) {
        return gsap.timeline()
            .to('.main', { opacity: 0, ease: "power2.inOut", duration: 0.3 });
    }
    let tl = gsap.timeline({
        defaults: {
            ease: "power3.inOut",
            duration: 1
        }
    });
    tl.to('.grid-item',{
        "--grid-item-width2": "100%",
        ease: "power3.inOut",
        duration:1,
        stagger: 0.02
    });
    tl.to('.grid-item',{
        "--grid-item-width": "100%",
        ease: "power3.inOut",
        duration:1,
        stagger: 0.02
    },"<0.05");


    return tl;
}