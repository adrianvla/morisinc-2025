import gsap from "gsap";

export default function leave() {
    const s = document.querySelector(`#${window.projectSectionID}`);
    let tl = gsap.timeline({
        defaults: {
            ease: "power3.inOut",
            duration: 1
        }
    });
    tl.to('.s1',{
        "--grid-item-width2": "100%",
        ease: "power3.inOut",
        duration:1,
        stagger: 0.02
    });
    tl.to('.s1',{
        "--grid-item-width": "100%",
        ease: "power3.inOut",
        duration:1,
        stagger: 0.02
    },"<0.05");
    tl.fromTo(s, {
        height: "calc(var(--main-height) / 1)",
        marginBottom: "0px"
    },{
        height: "calc(var(--main-height) / 2)",
        marginBottom: "calc(var(--main-height) / 2)",
        duration:2,
        ease: "power3.out"
    },"<");
    tl.to(s.querySelector('h2'),{
        opacity:0,
        duration: 1,
    },"<");
    tl.fromTo(s.querySelector('img'),{
        width: "calc(100% - 4px)",
        margin: "2px",
    },{
        width: "calc(100% - 0px)",
        margin: "0px",
        duration: 1,
    },"<");
    tl.fromTo(s,{
        padding:"12px",
        border:"5px solid var(--border)",
        boxShadow:"inset 0 0 0 2px var(--black)"
    },{
        padding:"0px",
        border:"0px solid var(--border)",
        duration:1,
        boxShadow:"inset 0 0 0 0px var(--black)",
        ease: "power3.inOut"
    },"<");




    return tl;
}