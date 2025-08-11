import gsap from "gsap";


export default function leave() {
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
    tl.to('*:has(> .grid-item)',{
        gap:"0px"
    });
    tl.to('.color-change',{
        background: "rgb(150, 150, 150)",
        duration: 1
    }, "<");
    tl.to('.color-change *',{
        opacity:0,
        duration: 1
    }, "<");
    tl.to('.nav4-1-1',{
        opacity:0
    },'<');


    return tl;
}