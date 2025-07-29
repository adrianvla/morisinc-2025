import gsap from "gsap";
import { RoughEase } from "gsap/EasePack";

gsap.registerPlugin(RoughEase);

let canvas = document.querySelector('#sparks');
let ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];

// Track neon states
const neonStates = new WeakMap();

class NeonState {
    constructor(element) {
        this.element = element;
        this.isOn = false;
        this.letterSpans = null;
        this.flickerIntervals = [];
        this.currentTimeline = null;
    }

    clearFlickerIntervals() {
        this.flickerIntervals.forEach(interval => clearInterval(interval));
        this.flickerIntervals = [];
    }

    destroy() {
        this.clearFlickerIntervals();
        if (this.currentTimeline) {
            this.currentTimeline.kill();
        }
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4; // Random horizontal velocity
        this.vy = Math.random() * 2 + 1; // Downward velocity
        this.life = 1.0; // Life from 1 to 0
        this.decay = (Math.random() * 0.02 + 0.01)*0.3; // How fast it dies
        this.size = Math.random() * 3 + 1; // Size of the particle
        this.gravity = 0.1;
        this.brightness = Math.random() * 0.5 + 0.5; // Random brightness
    }

    update() {
        // Apply gravity
        this.vy += this.gravity;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Decrease life
        this.life -= this.decay;
        
        // Add some horizontal drag
        this.vx *= 0.99;
        
        return this.life > 0;
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        // Set glow effect
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 10 * this.life;
        
        // Set particle color with life-based alpha
        const alpha = this.life * this.brightness;
        ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        
        // Add inner bright core
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, (this.size * this.life) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

const maxParticles = 50;

function updateParticles() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        if (!particle.update()) {
            // Remove dead particles
            particles.splice(i, 1);
        } else {
            particle.draw();
        }
    }
    if (particles.length > maxParticles) {
        particles.splice(0, particles.length - maxParticles);
    }
    
    requestAnimationFrame(updateParticles);
}

function makeSpark(x, y) {
    if (!canvas || !ctx) {
        console.warn('Canvas #sparks not found');
        return;
    }
    
    // Get canvas position relative to viewport
    const canvasRect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = x - canvasRect.left;
    const canvasY = y - canvasRect.top;
    
    // Create multiple particles for each spark
    const numParticles = Math.random() * 8 + 5; // 5-13 particles
    
    for (let i = 0; i < numParticles; i++) {
        // Add some randomness to initial position
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = (Math.random() - 0.5) * 10;
        
        particles.push(new Particle(canvasX + offsetX, canvasY + offsetY));
    }
}

// Initialize particle system
function initParticleSystem() {
    if (canvas && ctx) {
        // Set canvas size to match window
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Start animation loop
        updateParticles();
    }
}

// Call init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleSystem);
} else {
    initParticleSystem();
}

function splitTextIntoSpans(element) {
    const text = element.textContent;
    element.innerHTML = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
            element.appendChild(document.createTextNode(' '));
        } else {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.display = 'inline-block';
            element.appendChild(span);
        }
    }

    return element.querySelectorAll('span');
}

function turnOnNeon(el) {
    // Get or create neon state
    let state = neonStates.get(el);
    if (!state) {
        state = new NeonState(el);
        neonStates.set(el, state);
        // Only split text on first initialization
        state.letterSpans = splitTextIntoSpans(el);
    }

    // If already on, do nothing
    if (state.isOn) return;

    state.isOn = true;

    // Kill any existing timeline
    if (state.currentTimeline) {
        state.currentTimeline.kill();
    }

    const tl = gsap.timeline();
    state.currentTimeline = tl;

    // Initial glow animation for all letters
    tl.fromTo(el, {
        textShadow: "0 0 0 rgba(0, 255, 0,0)"
    }, {
        textShadow: "0 0 7px #0f0, 0 0 21px #0f0, 0 0 42px #0f0",
        filter: "drop-shadow(0 0 10px #0f0)",
        ease: RoughEase.ease.config({ points: 5, randomize: true, clamp: false })
    });

    tl.fromTo(state.letterSpans, {
        color: "rgb(0, 97, 0)",
    }, {
        color: "rgb(0, 255, 0)",
        ease: RoughEase.ease.config({ points: 5, randomize: true, clamp: false })
    }, "<");

    // Stabilize to white
    tl.fromTo(state.letterSpans, {
        color: "rgb(0, 255, 0)"
    }, {
        color: "#fff",
        ease: RoughEase.ease.config({ points: 40, randomize: true, clamp: false }),
        duration: 1
    });

    // Start flickering after animation
    tl.call(() => {
        startFlickering(state);
    });
}

function turnOffNeon(el) {
    const state = neonStates.get(el);
    if (!state || !state.isOn) return;

    state.isOn = false;

    // Clear flickering intervals
    state.clearFlickerIntervals();

    // Kill current timeline
    if (state.currentTimeline) {
        state.currentTimeline.kill();
    }

    // Animate to off state
    const tl = gsap.timeline();
    state.currentTimeline = tl;

    tl.to(state.letterSpans, {
        color: "rgb(0, 97, 0)",
        duration: 0.5,
        ease: RoughEase.ease.config({ points: 10, randomize: true, clamp: false }),
        stagger: 0.02
    });

    tl.to(el, {
        textShadow: "0 0 0 rgba(0, 255, 0,0)",
        filter: "none",
        duration: 0.3,
        ease: "power2.out"
    }, "<0.2");
}

function toggleNeon(el) {
    const state = neonStates.get(el);
    if (state && state.isOn) {
        turnOffNeon(el);
    } else {
        turnOnNeon(el);
    }
}

function startFlickering(state) {
    if (!state.isOn) return;

    state.letterSpans.forEach((span, index) => {
        const intervalId = setInterval(() => {
            if (!state.isOn) return;
            if (Math.random() < 0.002) {
                flickerLetter(span, state);
            }
        }, 100);

        state.flickerIntervals.push(intervalId);
    });
}

function flickerLetter(span, state) {
    if (!state || !state.isOn) return;

    const rect = span.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Call makeSpark at the letter's position
    makeSpark(x, y);

    // Flicker animation
    const flickerTl = gsap.timeline();

    flickerTl.to(span, {
        color: "rgb(0, 255, 0)",
        duration: 0.05,
        ease: "none"
    });

    flickerTl.to(span, {
        color: "#fff",
        duration: 0.1,
        ease: RoughEase.ease.config({ points: 20, randomize: true, clamp: false })
    });

    flickerTl.to(span, {
        color: "rgb(0, 255, 0)",
        duration: 0.03,
        ease: "none"
    });

    flickerTl.to(span, {
        color: "#fff",
        duration: 0.15,
        ease: "power2.out"
    });
}

export { turnOnNeon, turnOffNeon, toggleNeon, makeSpark };
