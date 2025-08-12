import 'normalize.css';
import $ from 'jquery';
import barba from '@barba/core';
import '../css/imports.js';
import inject from "./modules/inject";
import './modules/signature'
import {initLenises, initProjects, lenis} from "./modules/smoothScrolling";
import initCursor from "./modules/cursor";
import {translateEverything} from "./modules/translator";
import './modules/barcodes';
import './modules/changeTheme';
import {initIntro} from "./moments/intro";
import {initTextEffects} from "./modules/textEffects";
import './modules/languageSelector';
import leave from "./transitions/leave";
import enter from "./transitions/enter";
import './modules/neons';
import {destroyAllNeonsExceptSign, turnOnNeon} from "./modules/neons";
import {initSign, initSignFalloff} from "./modules/sign";
import initScrollZoom from "./modules/scrollZoom";
import './modules/clock';
import { initAutoFitText } from './modules/autoFitText.js';
import { initSterionHyphenFix } from './modules/sterionHyphenFix.js';
import {getProjectName, isOtherPage, isProjectPage} from "./modules/pathDetector";
import {fetchProjects} from "./modules/fetchProjects";
import {generateProject, setupTextRevealEffects} from "./modules/projects";
import {isMobileDevice, testForMobile} from "./utils/isMobileDevice";
import leaveBecauseOfLang from "./transitions/leave/lang";

// Initialize BarbaJS with enhanced transitions
barba.init({
    debug: false,
    preventRunning: true,

    transitions: [
        {
            name: 'default-transition',
            leave() {
                if(window.redirectType==="lang-button")
                    return new Promise(r=>r());
            },
            enter() {
                if(window.redirectType==="lang-button")
                    return new Promise(r=>{
                        $(".sign-c").trigger("click");
                        leaveBecauseOfLang().call(()=>{
                            r();
                            window.location.reload();
                        });
                    });
                window.location.reload();
            }
        },
        {
            name: 'from-home-to-project',
            from: { namespace: 'home' },
            to: { namespace: 'project' },
            leave(data) {
                if(window.redirectType==="lang-button")
                    return new Promise(r=>r());
                // Custom transition for leaving home
                destroyAllNeonsExceptSign();
                return leave(data.current.container);
            },
            enter(data) {
                if(window.redirectType==="lang-button")
                    return new Promise(r=>{
                        $(".sign-c").trigger("click");
                        leaveBecauseOfLang().call(()=>{
                            r();
                            window.location.reload();
                        });
                    });
                lenis.scrollTo(0);
                $(".projects").html("");
                $(data.current.container).remove();

                return enter(new Promise(r=>{generateProject(data.current.container).then(()=> {
                    $(".transition-overlay").remove();
                    setupTextRevealEffects();
                    initSignFalloff();
                    r();
                })}));

            }
        },
        {
            name: 'from-project-to-home',
            from: { namespace: 'project' },
            to: { namespace: 'home' },
            leave(data) {
                if(window.redirectType==="lang-button")
                    return new Promise(r=>r());
                // Custom transition for leaving home
                destroyAllNeonsExceptSign();
                window.redirectType = 'home-to-project';
                return leave(data.current.container);
            },
            enter(data) {
                if(window.redirectType==="lang-button")
                    return new Promise(r=>{
                        $(".sign-c").trigger("click");
                        leaveBecauseOfLang().call(()=>{
                            r();
                            window.location.reload();
                        });
                    });
                lenis.scrollTo(0);
                $(data.current.container).remove();

                return enter(new Promise(r=>{fetchProjects().then(()=>{
                    initProjects();
                    turnOnNeon(document.querySelector(".s1 .projects .project.neon"));
                    initAutoFitText();
                    initSterionHyphenFix();
                    initScrollZoom();
                    initSignFalloff();
                    $(".transition-overlay").remove();
                    r();
                })}));
            }
        },
        {
            name: 'from-project-to-project',
            from: { namespace: 'project' },
            to: { namespace: 'project' },
            leave(data) {
                // Custom transition for leaving home
                if(window.redirectType==="lang-button")
                    return new Promise(r=>r());

                destroyAllNeonsExceptSign();
                window.redirectType = 'home-to-project';
                return leave(data.current.container);
            },
            enter(data) {
                if(window.redirectType==="lang-button")
                    return new Promise(r=>{
                        $(".sign-c").trigger("click");
                        leaveBecauseOfLang().call(()=>{
                            r();
                            window.location.reload();
                        });
                    });
                $(data.current.container).remove();
                lenis.scrollTo(0);
                $(".projects").html("");

                return enter(new Promise(r=>{generateProject(data.current.container).then(()=> {
                    setupTextRevealEffects();
                    initSignFalloff();
                    $(".transition-overlay").remove();
                    r();
                })}));
            }
        },
    ],

    hooks: {
        beforeEnter(data) {
            // Ensure the new container is properly reset

        },
        afterEnter(data) {
            // Additional cleanup and initialization after page enter
            console.log(`Entered ${data.next.namespace} page`);
        }
    },

    views: [
        {
            namespace: 'home',
            afterEnter() {
                console.log('Home page loaded');
                // Any home-specific initialization
            }
        },
    ]
});


function setHeightValueOfMain(){
    //set css var
    const mainElement = document.querySelector('.main');
    if (mainElement) {
        const height = mainElement.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--main-height', `${height}px`);
    } else {
        console.warn('Main element not found');
    }
}

window.addEventListener('resize', setHeightValueOfMain);

// Initialize on first load
document.addEventListener('DOMContentLoaded', () => {
    $(".wait-for-data").remove();
    testForMobile();
    // Hide loading screen initially
    initLenises();
    translateEverything();
    inject();
    initCursor();
    initTextEffects();
    initScrollZoom();
    $(".s1").css("height",`${$(".s1").height()}px`);
    console.log(`%cIdentified as ${isProjectPage() ? 'Project' : 'home'} page, of project "${getProjectName()}"`, `color: #0f0`);
    initIntro((isProjectPage() || isOtherPage()) ? generateProject() : fetchProjects()).then(r => {
        initSign();
        if(!(isProjectPage() || isOtherPage())){
            turnOnNeon(document.querySelector(".s1 .projects .project.neon"));
            initProjects();
        }else{
            setupTextRevealEffects();
        }
    });
    setTimeout(() => {
        // initPage();
        lenis.scrollTo(0, {duration:0, immediate:true});
    }, 100); // Small delay to ensure fonts are loaded
    setHeightValueOfMain();
    initAutoFitText();
    initSterionHyphenFix();
    if(document.cookie.includes("sign-seen") && isMobileDevice()) $(".sign-c").css("opacity",0);
});
