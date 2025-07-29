import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import $ from 'jquery';
import yeast from "yeast";

// Register GSAP plugins
gsap.registerPlugin(SplitText, ScrambleTextPlugin, ScrollTrigger);

let initNavTextEffects = false;

function registerTextElement(element, alt2 = false) {
    const textElementID = element.getAttribute('data-name') || yeast();
    let content = element.textContent;
    element.innerHTML = ''; // Clear the element
    let tls = [];
    let lastDirection = {};
    const duration = 1;
    content.split('').forEach((char, index) => {
        const id = yeast();
        let ct = document.createElement('div');
        ct.className = 'text-effect-container';
        let span1 = document.createElement('span');
        span1.className = 'text-effect-letter-1 '+element.getAttribute('data-letter1');
        span1.textContent = char;
        let span2 = document.createElement('span');
        span2.className = 'text-effect-letter-2 '+element.getAttribute('data-letter2');
        span2.textContent = char;
        if(char === ' '){
            span1.classList.add('text-effect-space');
            span2.classList.add('text-effect-space');
        }
        ct.appendChild(span1);
        ct.appendChild(span2);
        element.appendChild(ct);
        let tlIn = gsap.timeline({paused: true});
        tlIn.set(span2, {
            scaleY:0,
            height:alt2 ? 0 : "100%",
            y: alt2 ? "-1em" : "1em"
        });
        tlIn.call(() => {
            if( lastDirection[id] === 'down') {
                lastDirection[id] = 'up';
                return;
            }
            span2.classList.toggle(element.getAttribute('data-letter2'));
            span2.classList.toggle(element.getAttribute('data-letter1'));
            span1.classList.toggle(element.getAttribute('data-letter1'));
            span1.classList.toggle(element.getAttribute('data-letter2'));
        });
        tlIn.set(span1, {
            scaleY:1,
            height: "100%"
        });
        tlIn.to(span2, {
            scaleY:1,
            duration,
            height: "100%",
            y: "0em"
        });
        tlIn.to(span1, {
            scaleY:0,
            duration,
            height: 0
        }, "<");

        let tlOut = gsap.timeline({});
        tlOut.set(span2, {
            scaleY:1,
            height:"100%"
        });
        tlOut.call(() => {
            if( lastDirection[id] === 'up') {
                lastDirection[id] = 'down';
                return;
            }
            span2.classList.toggle(element.getAttribute('data-letter2'));
            span2.classList.toggle(element.getAttribute('data-letter1'));
            span1.classList.toggle(element.getAttribute('data-letter1'));
            span1.classList.toggle(element.getAttribute('data-letter2'));
        });
        tlOut.set(span1, {
            scaleY:0,
            height: 0
        });
        tlOut.to(span2, {
            scaleY:0,
            duration,
            height:0
        });
        tlOut.to(span1, {
            scaleY:1,
            duration,
            height: "100%"
        }, "<");

        tls.push({
            tlIn,
            tlOut
        });
        lastDirection[id] = 'up';
    });
    window.textEffectInterval[textElementID] = setInterval(() => {
        //randomly choose n letters to animate
        let indexes = [];
        // Check for data-text-effect-turn-amount, default to 2 if not set or invalid
        let turnAmount = parseInt(element.getAttribute('data-text-effect-turn-amount'), 10);
        if (isNaN(turnAmount) || turnAmount < 1) turnAmount = 2;
        for(let i = 0; i < turnAmount; i++) {
            let randomIndex = Math.floor(Math.random() * tls.length);
            while (indexes.includes(randomIndex)) {
                randomIndex = Math.floor(Math.random() * tls.length);
            }
            indexes.push(randomIndex);
        }
        // Determine direction override if present
        const directionOverride = element.getAttribute('data-text-effect-turn-direction');
        for(let i in indexes) {
            let tl = tls[indexes[i]];
            if(directionOverride === 'up'){
                tl.tlIn.restart();
            }else if(directionOverride === 'down'){
                tl.tlOut.restart();
            }else{
                if(Math.random() > 0.5){
                    tl.tlIn.restart();
                }else{
                    tl.tlOut.restart();
                }
            }
        }
    },3000 + Math.random() * 2000);
}
function initTextEffects() {
    let textElements = document.querySelectorAll('.text-effect');
    window.textEffectInterval = {};
    if(initNavTextEffects)
        textElements = document.querySelectorAll('.wrapper .text-effect');

    initNavTextEffects = true;
    textElements.forEach(element => {
        registerTextElement(element);
    });
    let popIn = document.querySelectorAll('.text-effect-pop-in');
    popIn.forEach(element => {
        let content = element.textContent;
        element.innerHTML = ''; // Clear the element
        content.split('').forEach((char, index) => {
            const id = yeast();
            let ct = document.createElement('div');
            ct.className = 'text-effect-container-pop-in';
            let span = document.createElement('span');
            span.className = 'text-effect-letter';
            span.textContent = char;
            ct.appendChild(span);
            element.appendChild(ct);
            //get letter width
            const rect = span.getBoundingClientRect();
            if(element.classList.contains('italic')) rect.width = rect.width * 1.35;

            ct.style.width = rect.width + "px";
            let tl = gsap.timeline({
                scrollTrigger:{
                    trigger: element,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse',
                    once: true
                }
            });
            tl.fromTo(span, {
                marginLeft:-rect.width + "px"
            },{
                marginLeft:0,
                duration: 1,
                ease: "power4.inOut"
            });
        });

    });



    const textBlocks = document.querySelectorAll(".text-block");

    textBlocks.forEach((textBlock) => {
        const st = SplitText.create(textBlock.querySelector("p[scramble-text-effect]"), { type: "chars", charsClass: "char" });

        st.chars.forEach((char) => {
            gsap.set(char, { attr: { "data-content": char.innerHTML } });
        });
        textBlock.onpointermove = (e) => {
            st.chars.forEach((char) => {
                const rect = char.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100)
                    gsap.to(char, {
                        overwrite: true,
                        duration: 1.2 -dist / 100,
                        scrambleText: {
                            text: char.dataset.content,
                            chars: ".:",
                            speed: 0.5,
                        },
                        ease:'none'
                    });
            });
        };
    });


    document.querySelectorAll("a[data-scramble-on-enter]").forEach(a => {
        a.addEventListener("mouseenter", () => {
            gsap.to(a,{
                scrambleText: {
                    text: (i, target) => target.dataset.scrambleOnEnter,
                    chars: (i, target) => target.dataset.scrambleChars || ",._",
                    speed: 0.5,
                },
                duration: 1
            });
        });
    });

}

export {
    initTextEffects,
    registerTextElement
};