import gsap from "gsap";
import {initLenises} from "../modules/smoothScrolling";

export default function enter(p) {
    return new Promise((resolve, reject) => {
        let loaded = false;
        if(!p) loaded = true;
        else p.then(() => {loaded = true;tl.resume();});
        initLenises();


        let tl = gsap.timeline({
            onComplete: resolve
        });
        tl.to('.grid-item:not(.main)',{
            "--grid-item-width": "0%",
            ease: "power3.inOut",
            duration:1,
            stagger:0.02,
            onStart: () => {
                if(!loaded)
                    tl.pause();
            }
        },"<");
        tl.to('.grid-item:not(.main)',{
            "--grid-item-width2": "0%",
            ease: "power3.inOut",
            duration:1,
            stagger:0.02
        },"<0.05");
        tl.to('.loader', {
            opacity:0,
            duration:0.5,
            ease: "power3.inOut"
        });
        tl.set('.loader', {
            display: "none"
        });



        tl.to('.main',{
            "--grid-item-width": "0%",
            ease: "power3.inOut",
            duration:1,
            stagger:0.02
        },"<");
        tl.to('.main',{
            "--grid-item-width2": "0%",
            ease: "power3.inOut",
            duration:1,
            stagger:0.02
        },"<0.05");
    });
}