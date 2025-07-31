import 'normalize.css';
import $ from 'jquery';
import gsap from 'gsap';
import barba from '@barba/core';
import '../css/imports.js';
import yeast from 'yeast';
import inject from "./modules/inject";
import './modules/signature'
import {initLenises, initProjects, lenis} from "./modules/smoothScrolling";
import initCursor from "./modules/cursor";
import {translateEverything} from "./modules/translator";
import './modules/barcodes';
import './modules/changeTheme';
import initIntro from "./moments/intro";
import {initTextEffects} from "./modules/textEffects";
import './modules/languageSelector';
import leave from "./transitions/leave";
import enter from "./transitions/enter";
import './modules/neons';
import {turnOnNeon} from "./modules/neons";
import initSign from "./modules/sign";
import initScrollZoom from "./modules/scrollZoom";
import './modules/clock';
import { initAutoFitText } from './modules/autoFitText.js';
import { initSterionHyphenFix } from './modules/sterionHyphenFix.js';
import {getProjectName, isProjectPage} from "./modules/pathDetector";
import {fetchProjects} from "./modules/fetchProjects";
import {generateProject} from "./modules/projects";

// Initialize BarbaJS with enhanced transitions
barba.init({
    debug: false,
    preventRunning: true,

    transitions: [
        {
            name: 'leave-home',
            from: { namespace: 'home' },
            leave(data) {
                // Custom transition for leaving home
                lenis.scrollTo(0);
                return leave(data.current.container);
            },
            enter(data) {
                lenis.scrollTo(0);
                return enter();
            }
        },
        {
            name: 'from-home-to-project',
            from: { namespace: 'home' },
            to: { namespace: 'project' },
            leave(data) {
                // Custom transition for leaving home
                return leave(data.current.container);
            },
            enter(data) {
                lenis.scrollTo(0);
                $(".projects").html("");

                return enter(generateProject());
            }
        },
        {
            name: 'from-project-to-home',
            from: { namespace: 'project' },
            to: { namespace: 'home' },
            leave(data) {
                // Custom transition for leaving home
                lenis.scrollTo(0);
                return leave(data.current.container);
            },
            enter(data) {
                lenis.scrollTo(0);
                return enter(fetchProjects());
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
            setTimeout(() => {
                // initPage();
            },100);
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
    // Hide loading screen initially
    initLenises();
    translateEverything();
    inject();
    initCursor();
    initTextEffects();
    initScrollZoom();
    $(".s1").css("height",`${$(".s1").height()}px`);
    console.log(`%cIdentified as ${isProjectPage() ? 'Project' : 'home'} page, of project "${getProjectName()}"`, `color: #0f0`);
    initIntro(isProjectPage() ? generateProject() : fetchProjects()).then(r => {
        initSign();
        if(!isProjectPage()){
            turnOnNeon(document.querySelector(".s1 .projects .project.neon"));
            initProjects();
        }
    });
    setTimeout(() => {
        // initPage();
        lenis.scrollTo(0, {duration:0, immediate:true});
    }, 100); // Small delay to ensure fonts are loaded
    setHeightValueOfMain();
    initAutoFitText();
    initSterionHyphenFix();
});
