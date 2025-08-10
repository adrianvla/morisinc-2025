import gsap from "gsap";
import yeast from "yeast";
import $ from "jquery";
import {makeSpark} from "../modules/neons";
import {lenis} from "../modules/smoothScrolling";
import {fetchProjects} from "../modules/fetchProjects";
import {isProjectPage} from "../modules/pathDetector";
import {generateProject} from "../modules/projects";
import {isMobileDevice} from "../utils/isMobileDevice";

let hasLoadedImages = false;
let tl = gsap.timeline({});

function logImageLoadingProgress() {
    function loadedEverything(){
        setTimeout(()=>{
            console.log("scrolling");
            lenis.scrollTo(0,{duration:0.1});
        },200);
        if(tl.paused()){
            tl.resume();
        }
        gsap.to('.loading-text,.loader h3',{
            opacity:0,
            duration:0.5
        });
        hasLoadedImages = true;
    }
    function load(){
        return new Promise(resolve => {
            resolve();
            let loaded = 0;
            const images = Array.from(document.images);
            const total = images.length;
            function update() {
                loaded++;
                const percent = Math.round((loaded / total) * 100);
                if( percent === 100) resolve();
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
        });
    }
    load().then(loadedEverything);
}
let fns = [];
function initAnimations(p){
    p.then(logImageLoadingProgress);
    return new Promise(resolve => {
        tl.set('.nav4 > div > *',{
            opacity:0
        });
        tl.set('.nav4',{
            gap:0
        });
        tl.fromTo('.loader h3.align-left',{
            right:"50%"
        },{
            right:"75%",
            duration:1,
            scrambleText: {
                text: (i, target) => target.dataset.text,
                chars: (i, target) => target.dataset.scrambleChars || ",._&*;:'\"-+=~`|/\\",
                speed: 0.5,
            },
        });
        tl.fromTo('.loader h3.align-right',{
            left:"50%"
        },{
            left:"75%",
            duration:1,
            scrambleText: {
                text: (i, target) => target.dataset.text,
                chars: (i, target) => target.dataset.scrambleChars || ",._&*;:'\"-+=~`|/\\",
                speed: 0.5,
            },
        },"<");
        tl.to('.loader', {
            top: '12px',
            left: '12px',
            bottom: '12px',
            right: '12px',
            duration:1,
            ease: "power3.inOut",
            onStart: () => {
                if(hasLoadedImages)
                    tl.timeScale(1);
            }
        },"<");



        tl.to('.loader', {
            top: '134px',
            left: '264px',
            duration:1,
            ease: "power1.inOut",
            onComplete: () => {
                if(!isMobileDevice())
                    if(!hasLoadedImages)
                        tl.pause();
            },
            onStart: () => {
                if(hasLoadedImages)
                    tl.timeScale(1);
                if(isMobileDevice())
                    if(!hasLoadedImages)
                        tl.pause();
            }
        },"<1");
        tl.to('.nav4',{
            gap:"2px"
        },"<");
        tl.to('.nav4 > div > *',{
            opacity:1
        });
        tl.to('.loader', {
            opacity:0,
            duration:0.5,
            ease: "power3.inOut"
        },"<");
        tl.to('.grid-item',{
            "--grid-item-width": "0%",
            ease: "power3.inOut",
            duration:1,
            stagger:0.02,
            onStart: () => {
                tl.timeScale(1);
            }
        },"<");
        tl.to('.grid-item',{
            "--grid-item-width2": "0%",
            ease: "power3.inOut",
            duration:1,
            stagger:0.02
        },"<0.05");
        tl.to('[data-scramble-on-enter]',{
            scrambleText: {
                text: (i, target) => target.dataset.scrambleOnEnter,
                chars: (i, target) => target.dataset.scrambleChars || ",._",
                speed: 0.5,
            },
            ease: "power3.inOut",
            duration: 1,
            stagger:0.1
        },"<0.75");



        tl.set('.loader',{
            display: "none",
            onComplete: () => {
                resolve();
                fns.forEach(fn => fn());
            }
        },"<0.5");

    });
}

function subscribeToEndOfIntro(fn){
    fns.push(fn);
}

function initIntro(p){
    return initAnimations(p);
}

export {initIntro, subscribeToEndOfIntro};