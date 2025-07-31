import Lenis from 'lenis';
import Snap from 'lenis/snap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { turnOnNeon, turnOffNeon } from './neons.js';

gsap.registerPlugin(ScrollTrigger);

// Initialize smooth scrolling with Lenis
let lenis = null;
let lenis2 = null;
let alreadyInited = false;
function initLenises(){
    try{
        lenis.destroy();
        lenis2.destroy();
    }catch(e){}
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        wrapper: document.querySelector('.main'),
        content: document.querySelector('.main-content'),
        touchMultiplier: 2,
        wheelMultiplier: 1,
    });
    lenis2 = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        wrapper:document.querySelector('.s1'),
        touchMultiplier: 2,
        wheelMultiplier: 1,
        autoRaf:true,
    });
    if(!alreadyInited){
        alreadyInited = true;
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
    }
    lenis.on('scroll', () => {
        ScrollTrigger.update();

        // Update active neon based on current section
        const sectionIndex = getCurrentSectionIndex();
        updateActiveNeon(sectionIndex);
    });
}
let snap = null;
let currentActiveSection = -1;
let isInitialized = false;

// Get references to sections and sidebar neons
function getSectionAndNeonElements() {
    const sections = document.querySelectorAll('section.project');
    const sidebarNeons = document.querySelectorAll('.s1 .projects .project.neon');
    return { sections, sidebarNeons };
}
// Function to update active neon based on current section
function updateActiveNeon(sectionIndex) {
    if(!isInitialized) return;
    if (currentActiveSection === sectionIndex) return;

    const { sidebarNeons } = getSectionAndNeonElements();

    // Turn off previous neon
    if (currentActiveSection >= 0 && currentActiveSection < sidebarNeons.length) {
        turnOffNeon(sidebarNeons[currentActiveSection]);
    }

    // Turn on new neon
    if (sectionIndex >= 0 && sectionIndex < sidebarNeons.length) {
        turnOnNeon(sidebarNeons[sectionIndex]);
    }

    currentActiveSection = sectionIndex;
}

// Function to determine which section is currently active based on scroll position
function getCurrentSectionIndex() {
    if(!isInitialized) return 0;
    const mainElement = document.querySelector('.main');
    const height = mainElement.getBoundingClientRect().height;
    const scrollProgress = lenis.scroll / height;

    return Math.round(scrollProgress);
}
gsap.ticker.lagSmoothing(0);

// Function to scroll to a specific section
function scrollToSection(sectionIndex) {
    const mainElement = document.querySelector('.main');
    const height = mainElement.getBoundingClientRect().height;
    const targetScroll = sectionIndex * height;

    lenis.scrollTo(targetScroll, {
        duration: 2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
}

// Function to add click handlers to sidebar neons
function addNeonClickHandlers() {
    const { sidebarNeons } = getSectionAndNeonElements();

    sidebarNeons.forEach((neon, index) => {
        neon.setAttribute("data-pointer","");
        neon.addEventListener('click', () => {
            scrollToSection(index);
        });
    });
}

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

    // Initialize with first section active
    setTimeout(() => {
        updateActiveNeon(0);
        // Add click handlers after initialization
        addNeonClickHandlers();
    }, 100);
}

function initProjects(){
    window.addEventListener('resize', snapToSections);
    snapToSections();
    isInitialized = true;
}


export {lenis, lenis2, snap, initProjects, initLenises};