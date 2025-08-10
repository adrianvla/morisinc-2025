import {transportElement} from "./transportElement";
import $ from "jquery";
import gsap from "gsap";
import {subscribeToEndOfIntro} from "../moments/intro";

function isMobileDevice() {
    // User agent check
    const ua = navigator.userAgent;
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    // Touch support check
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Screen size check (optional, for tablets)
    const isSmallScreen = window.innerWidth <= 1024 && window.innerHeight <= 1366;
    // Consider mobile if any of these are true
    return isMobileUA || (hasTouch);
}

function adaptWebsiteForMobile() {
    console.log("%cAdapting website for mobile", "color: pink; font-weight: bold;");
    transportElement(document.querySelector(".nav1"), document.querySelector(".top-nav.mobile"));
    transportElement(document.querySelector(".nav2"), document.querySelector(".top-nav.mobile"));
    transportElement(document.querySelector(".nav3"), document.querySelector(".top-nav.mobile"));
    transportElement(document.querySelector(".nav4"), document.querySelector(".big-nav.mobile"));
    transportElement(document.querySelector(".sidebar"), document.querySelector(".big-nav.mobile"));
    transportElement(document.querySelector(".nav0"), document.querySelector(".big-nav.mobile"));
    $(".language-selector .crosshair").hide();
    $(".big-nav, .top-nav").css("opacity","0").css("pointer-events","none");
    let isNavOpened = false;
    let tl = null;
    $(".top-nav .open-nav").on("click", function () {
        try{
            tl.kill();
        }catch(e){}
        if(isNavOpened){
            //close it
            tl = gsap.timeline({
                ease: "power3.inOut",
            });
            tl.set('.big-nav',{
                opacity:1,
                pointerEvents:"auto",
                left:"-100%"
            })
            .to('main',{
                "--grid-item-width2": "100%",
                ease: "power3.out",
                duration:1
            })
            .to('main',{
                "--grid-item-width": "100%",
                ease: "power3.out",
                duration:1
            },"<0.05")
            .to('.big-nav',{
                left:0,
                duration:2,
                ease: "power3.out"
            },'<0.2');
        }else{
            tl = gsap.timeline({
                ease: "power3.inOut",
            })
            .to('.big-nav',{
                left: "-100%",
                duration: 1,
                ease: "power3.inOut"
            })
            .to('main',{
                "--grid-item-width": "0%",
                ease: "power3.inOut",
                duration: 1
            },'<0.2')
            .to('main',{
                "--grid-item-width2": "0%",
                ease: "power3.inOut",
                duration: 1
            },"<0.05")
        }
        isNavOpened = !isNavOpened;
    });
    subscribeToEndOfIntro(()=>{
        setTimeout(()=>{
            $(".sign-c").trigger("click");
        },500);
        gsap.to('.top-nav',{
            opacity:1,
            pointerEvents:"auto",
            duration:1,
            ease: "power3.inOut"
        });
    });
    $(".container").height($(window).height());
}
function testForMobile() {
    if(window.innerWidth < 600){
        adaptWebsiteForMobile();
    }else{
        $(".mobile").remove();
    }
}

export {isMobileDevice, testForMobile};