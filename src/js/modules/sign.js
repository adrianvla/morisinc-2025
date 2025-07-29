import {turnOffNeon, turnOnNeon, makeSpark} from "./neons";
import {lenis} from "./smoothScrolling";
import gsap from 'gsap';

function initSign(){
    turnOnNeon(document.querySelector(".sign-c .sign > span"));

    // Add click event to trigger the falling animation
    const signContainer = document.querySelector(".sign-c");
    //on scroll make sign fall off
    let once = true;
    lenis.on('scroll', () => {
        if(!once) return;
        once = false;
        fallOffSign();
        lenis.off('scroll'); // Remove the scroll listener after the sign falls
    });
    signContainer.addEventListener("click", () => {
        if(!once) return;
        once = false;
        fallOffSign();
    });

}

function fallOffSign() {
    const signContainer = document.querySelector(".sign-c");
    const sign = document.querySelector(".sign");
    const hinge1 = document.querySelector(".sign .a1");
    const hinge2 = document.querySelector(".sign .a2");
    turnOffNeon(document.querySelector(".sign-c .sign > span"));

    // Create timeline for the falling animation
    const tl = gsap.timeline();

    // Set transform origin for realistic rotation
    gsap.set(signContainer, {
        transformOrigin: "left center"
    });

    // Phase 1: First hinge (a1) breaks - slight rotation and shake
    tl.to(hinge1, {
        duration: 0.3,
        x: -5,
        rotation: -15,
        ease: "power2.out"
    })
    .to(hinge2, {
        duration: 0.3,
        x: -5,
        rotation: 5,
        ease: "power2.out"
    },"<")
    .to(signContainer, {
        duration: 0.3,
        rotation: -2,
        ease: "power2.out"
    }, "<")
    .to(signContainer, {
        duration: 0.1,
        x: "+=2",
        yoyo: true,
        repeat: 3,
        ease: "power2.inOut"
    }, "<0.1")

    // Phase 2: Second hinge (a2) breaks - more dramatic fall
    .to(hinge2, {
        duration: 0.2,
        x: -8,
        rotation: -10,
        ease: "power2.out"
    }, "+=0.2")

    // Phase 3: Sign falls with realistic physics
    .to(signContainer, {
        duration: 1.5,
        rotation: -90,
        y: window.innerHeight + 200,
        x: -100,
        ease: "power2.in"
    }, "<0.1")

    // Add some spin during the fall for realism
    .to(sign, {
        duration: 1.5,
        rotation: -10,
        ease: "power1.inOut"
    }, "<")

    // Hinges scatter in different directions
    .to(hinge1, {
        duration: 1.2,
        x: -50,
        y: window.innerHeight + 100,
        rotation: 360,
        ease: "power2.in"
    }, "<")
    .to(hinge2, {
        duration: 1.3,
        x: -30,
        y: window.innerHeight + 150,
        rotation: -180,
        ease: "power2.in"
    }, "<0.1");

    // Add spark effects and particle effects during the break
    tl.call(() => {
        createHingeSparks(hinge1);
        createBreakParticles(hinge1);
    }, null, 0.3)
    .call(() => {
        createHingeSparks(hinge2);
        createBreakParticles(hinge2);
    }, null, 0.5);
    //remove the sign after the animation
    tl.call(() => {
        signContainer.remove();
    }, null, 2.5);
}

function createHingeSparks(element) {
    const rect = element.getBoundingClientRect();

    // Create multiple sparks at the hinge connection point
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            // Sparks at the left edge where hinge connects to sign
            const sparkX = rect.left + rect.width;
            const sparkY = rect.top + rect.height / 2 + (Math.random() - 0.5) * 10;
            makeSpark(sparkX, sparkY);
        }, i * 50); // Stagger sparks over 150ms
    }
}

function createBreakParticles(element) {
    const rect = element.getBoundingClientRect();
    const particles = [];

    // Create small particles at the break point
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 3px;
            height: 3px;
            background: var(--metal);
            border-radius: 50%;
            z-index: 1000;
            left: ${rect.left + rect.width/2}px;
            top: ${rect.top + rect.height/2}px;
            pointer-events: none;
        `;
        document.body.appendChild(particle);
        particles.push(particle);

        // Animate particles
        gsap.to(particle, {
            duration: 0.8,
            x: (Math.random() - 0.5) * 60,
            y: Math.random() * 40 + 20,
            opacity: 0,
            ease: "power2.out",
            onComplete: () => {
                particle.remove();
            }
        });
    }
}

export default initSign;