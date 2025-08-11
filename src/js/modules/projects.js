import $ from "jquery";
import {getProjectName, isOtherPage} from "./pathDetector";
import {initAutoFitText} from "./autoFitText";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {SplitText} from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import {getTranslation} from "./translator";
import yeast from "yeast";
import {turnOnNeon, turnOffNeon, destroyAllNeonsExceptSign} from "./neons";
import {initTextEffects} from "./textEffects";
import initLazyLoad from "./lazyLoad";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

function fetchProjFile(){
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '../assets/projects.json',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(data);
                resolve(data);
            },
            error: function(xhr, status, error) {
                console.error('Error fetching projects:', error);
                reject(new Error(`Failed to fetch projects: ${error}`));
            }
        });
    });
}

function fetchProjectContent(projectName) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `../assets/site-content/${projectName}`,
            method: 'GET',
            dataType: 'html',
            success: function(data) {
                resolve(data);
            },
            error: function(xhr, status, error) {
                console.error('Error fetching project content:', error);
                reject(new Error(`Failed to fetch project content: ${error}`));
            }
        });
    });

}
function makeAllHeaders(){
    // Clear existing table of contents items (except the "Contents" pill)
    $(".s1 .projects .project.neon").remove();

    // Find all header tags (h1-h6) in the content section
    const headers = $("section.content h1, section.content h2, section.content h3, section.content h4, section.content h5, section.content h6");

    headers.each(function(index) {
        const $header = $(this);
        const tagName = this.tagName.toLowerCase();
        const headerLevel = parseInt(tagName.charAt(1)); // Extract number from h1, h2, etc.
        const headerText = $header.text().trim();

        if (headerText) {
            // Create a unique ID for the header if it doesn't have one
            let headerId = $header.attr('id');
            if (!headerId) {
                // Use yeast to generate a unique ID with a readable prefix
                const baseId = headerText.toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                // Generate a unique ID using yeast and replace dots with dashes
                const yeastId = yeast().replace(/\./g, '-');
                headerId = `header-${yeastId}-${baseId}`;

                $header.attr('id', headerId);
            }

            // Calculate indentation based on header level (h1=0, h2=1, h3=2, etc.)
            const indentLevel = headerLevel - 1;

            // Create the table of contents entry
            const tocEntry = $(`
                <div class="project neon toc-item" data-indent="${indentLevel}" data-target="${headerId}" data-header-level="${headerLevel}">${headerText}</div>
            `);

            // Add click handler to scroll to the header
            tocEntry.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const targetId = $(this).data('target');
                const targetElement = $(`#${targetId}`);

                if (targetElement.length) {
                    // Use Lenis scrollTo method instead of jQuery animate
                    if (window.lenis) {
                        window.lenis.scrollTo(targetElement[0], {
                            offset: -20,
                            duration: 1.2,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    } else {
                        // Fallback to native scrollIntoView if Lenis is not available
                        targetElement[0].scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });

            $(".s1 .projects").append(tocEntry);
        }
    });

    // Set up ScrollTrigger for headers after DOM is updated
    setTimeout(() => {
        setupHeaderScrollTriggers();
    }, 100);
}

function setupHeaderScrollTriggers() {
    // Kill any existing ScrollTriggers for headers
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars && trigger.vars.id && trigger.vars.id.startsWith('header-trigger-')) {
            trigger.kill();
        }
    });

    // Get all headers in the content
    const headers = document.querySelectorAll("section.content h1, section.content h2, section.content h3, section.content h4, section.content h5, section.content h6");

    headers.forEach((header, index) => {
        if (!header.id) return;

        ScrollTrigger.create({
            id: `header-trigger-${header.id}`,
            trigger: header,
            start: "top 25%",
            end: "bottom 90%",
            scroller: ".main",
            onEnter: () => {
                activateHeader(header);
            },
            onLeave: () => {
                deactivateHeader(header);
            },
            onEnterBack: () => {
                activateHeader(header);
            },
            onLeaveBack: () => {
                deactivateHeader(header);
            }
        });
    });
}

let currentActiveHeaders = new Set();
let parentHeadersActive = new Set(); // Track which parent headers should stay on

function activateHeader(header) {
    const headerId = header.id;
    const headerLevel = parseInt(header.tagName.charAt(1));

    // Clear only the current level headers (not parents)
    const headersToRemove = [];
    currentActiveHeaders.forEach(activeId => {
        const activeElement = document.getElementById(activeId);
        if (activeElement) {
            const activeLevel = parseInt(activeElement.tagName.charAt(1));
            if (activeLevel >= headerLevel) {
                headersToRemove.push(activeId);
            }
        }
    });

    headersToRemove.forEach(activeId => {
        const tocItem = $(`.toc-item[data-target="${activeId}"]`)[0];
        if (tocItem) {
            turnOffNeon(tocItem);
        }
        currentActiveHeaders.delete(activeId);
    });

    // Add current header to active set
    currentActiveHeaders.add(headerId);

    // Get parent headers
    const parentHeaders = getParentHeaders(header, headerLevel);

    // Turn on current header
    const currentTocItem = $(`.toc-item[data-target="${headerId}"]`)[0];
    if (currentTocItem) {
        turnOnNeon(currentTocItem);
    }

    // Turn on parent headers only if they're not already active
    parentHeaders.forEach(parentId => {
        if (!parentHeadersActive.has(parentId)) {
            const tocItem = $(`.toc-item[data-target="${parentId}"]`)[0];
            if (tocItem) {
                turnOnNeon(tocItem);
                parentHeadersActive.add(parentId);
            }
        }
        currentActiveHeaders.add(parentId);
    });
}

function deactivateHeader(header) {
    // Don't immediately deactivate - let the next header's onEnter handle the state
    // This prevents flickering between closely spaced headers
}
let splitTextPairs = [];


function parseContent(content) {
    // Transform [btn link="..."]text[/btn] into a clickable span
    let parsed = content.replace(/\[btn link="([^"]+)"\](.*?)\[\/btn\]/g, function(match, link, text) {
        return `<span class=\"btn\" onclick=\"window.open('${link}', '_blank')\" data-pointer>${text}</span>`;
    });
    // Wrap all <pre> tags in a parent div, but do not split into spans
    parsed = parsed.replace(/(<pre[\s\S]*?<\/pre>)/g, function(match) {
        return `<div class=\"pre-parent\">${match}</div>`;
    });
    parsed = parsed.replace(/\[img src="([^"]+)"\](.*?)\[\/img\]/g, function(match, img_src, text) {
        return `<img data-src="${img_src}" src="${img_src.replace('img','img-low-res')}"/>`;
    });
    parsed = parsed.replace(/\[a href="([^"]+)"\](.*?)\[\/a\]/g, function(match, href, text) {
        return `<a target="_blank" href="${href}" data-pointer>${text}</a>`;
    });
    return parsed;
}



function generateProject(){
    $("[data-barba-namespace='home']").remove();
    return new Promise(async (resolve, reject) => {
        // Clean up existing neon effects (except sign) before generating new project
        destroyAllNeonsExceptSign();

        // Kill all existing ScrollTriggers for headers
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars && trigger.vars.id && trigger.vars.id.startsWith('header-trigger-')) {
                trigger.kill();
            }
        });

        const name = getProjectName();
        if(!name){
            console.error("Project name not found in URL");
            reject(new Error("Project name not found"));
            //move to /
            window.location.href = "/";
            return;
        }
        const nameOfTitle = name.charAt(0).toUpperCase() + name.slice(1);
        $("title").text(nameOfTitle);
        let projs = await fetchProjFile();
        let p = null;
        //find project in the list
        projs.forEach(cat => {
            cat.items.forEach(proj => {p = proj.name.replaceAll(' ', '-').replaceAll('.', '_') === name.replaceAll(' ', '-').replaceAll('.', '_') ? proj : p;});
        });
        console.log(p)
        if(p == null){
            console.error("Project not found: " + name);
            reject(new Error("Project not found"));
            alert("Project not found: " + name);
            return;
        }
        const img_src = ".."+p.image;
        const content = await fetchProjectContent(p.url);

        $(".s1 h4 span").text(name);
        $("main").html("");
        //create section
        $("main").append(`
            <section class="project hero">
                <h1>${name}</h1>
                <img data-src="${img_src}" src="${img_src.replace('img','img-low-res')}" alt="${name}">
            </section>
        `);
        $("main").append(`
            <section class="content grid-item">
                ${parseContent(content)}
            </section>
        `);
        $(".s1 .projects").append(`<h4 class="pill"><span>${getTranslation("Contents")}</span></h4>`);
        gsap.timeline().set("[data-barba-namespace='home']",{
            position:"absolute"
        }).to("[data-barba-namespace='home']",{
            opacity:0,
            duration:0.5,
        }).fromTo("section.content",{
            "--grid-item-width": "0%",
            "--grid-item-width2": "100%",
        },{
            "--grid-item-width": "0%",
            "--grid-item-width2": "0%",
            ease: "power3.inOut",
            duration:1
        },"<");

        gsap.fromTo("section.project.hero h1",{
            // x: "-50%"
        }, {
            scrollTrigger: {
                trigger: "section.project.hero",
                start: "top 0%",
                end: "bottom 10%",
                scroller: ".main",
                scrub: 1,
                toggleActions: "play none none reverse",
            },
            y: -50,
            // x: "-50%"
        });
        initAutoFitText();
        makeAllHeaders();
        initLazyLoad();

        const els = document.querySelectorAll("section.content h2, section.content h3, section.content h4, section.content h5, section.content h6");
        els.forEach(p => {
            $(p).css("height",`${$(p).height()}px`);
            $(p).attr("text-content", $(p).text());
            $(p).text("");
        });

        const els2 = document.querySelectorAll("section.content p, section.content li");
        els2.forEach(p => {
            const mySplitText = new SplitText(p, {
                type: "words"
            });
            splitTextPairs.push([p, mySplitText]);
            gsap.set(mySplitText.words, {
                opacity: 0.3,
            });
        });


        resolve();
    });
}

function setupTextRevealEffects() {
    // Find all paragraphs in the content
    const els = document.querySelectorAll("section.content h2, section.content h3, section.content h4, section.content h5, section.content h6");

    els.forEach(p => createScrambleEffect(p, $(p).attr("text-content") || $(p).text()));
    splitTextPairs.forEach(p => createTextRevealEffect(...p));
    // initTextEffects();
    document.querySelectorAll("span.btn").forEach(p => {
        $(p).css("height",`${$(p).height()}px`);
        $(p).css("width",`${$(p).width()}px`);
    });
}

function createTextRevealEffect(element, mySplitText) {
    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: element,
            scroller: ".main",
            toggleActions: "play none none none"
        }
    });
    tl.fromTo(mySplitText.words, {
        opacity: 0.3,
    },{
        opacity:1,
        stagger: 0.05,
    });
}

function createScrambleEffect(element, content) {
    // Use GSAP's ScrambleTextPlugin for much better performance and features
    gsap.to(element, {
        duration: 2,
        scrambleText: {
            text: content,
            chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:',.<>?/~`",
            revealDelay: 0.1,
            tweenLength: false,
            speed: 0.5,
        },
        ease: "power2.out",
        scrollTrigger: {
            trigger: element,
            start: "top 100%",
            end: "bottom 80%",
            scroller: ".main",
            toggleActions: "play none none none"
        }
    });
}

// Extract parent header logic into a separate function for reusability
function getParentHeaders(currentHeader, currentLevel) {
    const parentIds = [];

    // Find all headers that come before the current one in the DOM
    const allHeaders = Array.from(document.querySelectorAll("section.content h1, section.content h2, section.content h3, section.content h4, section.content h5, section.content h6"));
    const currentIndex = allHeaders.indexOf(currentHeader);

    // Look backwards through headers to find parents
    for (let i = currentIndex - 1; i >= 0; i--) {
        const header = allHeaders[i];
        const headerLevel = parseInt(header.tagName.charAt(1));

        // If this header is a parent level (lower number = higher in hierarchy)
        if (headerLevel < currentLevel) {
            parentIds.push(header.id);

            // Update currentLevel to continue looking for higher-level parents
            currentLevel = headerLevel;

            // If we've reached h1, we're done
            if (headerLevel === 1) {
                break;
            }
        }
    }

    return parentIds;
}
export {generateProject, setupTextRevealEffects};