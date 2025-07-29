import gsap from "gsap";
import yeast from "yeast";
import $ from "jquery";
import lenis from "../modules/smoothScrolling";

let hasLoadedImages = false;
let tl = gsap.timeline({});

function logImageLoadingProgress() {
    const images = Array.from(document.images);
    const total = images.length;
    let loaded = 0;
    function loadedEverything(){
        setTimeout(()=>{
            console.log("scrolling");
            lenis.scrollTo(0,{duration:0.1});
        },200);
        if(tl.paused()){
            tl.resume();
            tl.seek(tl.time()+1);
        }
        gsap.to('.loading-text',{
            opacity:0,
            duration:0.5,
            onComplete: () => {
                $('.loading-text').remove();
            }
        });
        hasLoadedImages = true;
    }
    function update() {
        loaded++;
        const percent = Math.round((loaded / total) * 100);
        if( percent === 100) loadedEverything();
        console.log(percent + '% images loaded');
        $(".loading-text").text(percent);
    }
    images.forEach(img => {
        if (img.complete && img.naturalWidth !== 0) {
            update();
        } else {
            img.addEventListener('load', update, { once: true });
            img.addEventListener('error', update, { once: true });
        }
    });
}

function initAnimations(){
    logImageLoadingProgress();
    return new Promise(resolve => {

        // tl.to('', {
        //     onStart: () => {
        //         if(!hasLoadedImages)
        //             tl.pause();
        //         else
        //             tl.seek(tl.time()+1);
        //     }
        // },"<");
        tl.set('.nav4 > div > *',{
            opacity:0
        });
        tl.set('.nav4',{
            gap:0
        });
        tl.to('.loader', {
            top: '12px',
            left: '12px',
            bottom: '12px',
            right: '12px',
            duration:1,
            ease: "power3.inOut"
        });



        tl.to('.loader', {
            top: '134px',
            left: '264px',
            duration:2,
            ease: "power3.inOut"
        });
        tl.to('.nav4',{
            gap:"2px"
        },"<1");
        tl.to('.nav4 > div > *',{
            opacity:1
        },"<1");
        tl.to('.loader', {
            left: 'calc(100% - 12px)',
            duration:1,
            ease: "power3.inOut"
        },"<");
        tl.to('.grid-item',{
            "--grid-item-width": "0%",
            ease: "power3.inOut",
            duration:2
        },"<");
        tl.to('.grid-item',{
            "--grid-item-width2": "0%",
            ease: "power3.inOut",
            duration:2
        },"<0.05");
        tl.to('[data-scramble-on-enter]',{
            scrambleText: {
                text: (i, target) => target.dataset.scrambleOnEnter,
                chars: (i, target) => target.dataset.scrambleChars || ",._",
                speed: 0.5,
            },
            ease: "power3.inOut",
            duration: 2,
            stagger:0.1
        },"<0.75");



        tl.set('.loader',{
            display: "none",
            onComplete: () => {resolve();document.querySelector('.loader').remove();}
        });


        // tl.timeScale(5);
    });
}


function initIntro(){
    return initAnimations();
}

export default initIntro;