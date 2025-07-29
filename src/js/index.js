import 'normalize.css';
import $ from 'jquery';
import gsap from 'gsap';
import barba from '@barba/core';
import '../css/imports.js';
import yeast from 'yeast';
import inject from "./modules/inject";
import './modules/signature'
import lenis from "./modules/smoothScrolling";
import initCursor from "./modules/cursor";
import {translateEverything} from "./modules/translator";
import './modules/barcodes';
import './modules/changeTheme';
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
                return leaveHome(data.current.container);
            },
            enter(data) {
                lenis.scrollTo(0);
                return enterHome(data.next.container);
            }
        },
        {
            name: 'from-home-to-project',
            from: { namespace: 'home' },
            to: { namespace: 'project' },
            leave(data) {
                // Custom transition for leaving home
                lenis.scrollTo(0);
                return leaveHome(data.current.container);
            },
            enter(data) {
                lenis.scrollTo(0);
                return enterHome(data.next.container);
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
                initPage();
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

// Initialize on first load
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen initially
    translateEverything();
    inject();
    setTimeout(() => {
        initCursor();
        // initPage();
        lenis.scrollTo(0, {duration:0, immediate:true});
    }, 100); // Small delay to ensure fonts are loaded

});
