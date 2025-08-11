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
function hookAllVideos(){
    document.querySelectorAll(".video").forEach(video_container => {
        const video = video_container.querySelector("video");
        const playPauseBtn = video_container.querySelector("#play-pause");
        const stopBtn = video_container.querySelector("#stop");
        const muteBtn = video_container.querySelector("#mute");
        const fsBtn = video_container.querySelector("#fs");
        const progress = video_container.querySelector("#progress");

        if (!video) return;

        // Play/Pause
        if (playPauseBtn) {
            playPauseBtn.addEventListener("click", () => {
                if (video.paused || video.ended) {
                    video.play();
                    playPauseBtn.innerHTML = pauseIcon();
                    playPauseBtn.setAttribute("data-state", "pause");
                } else {
                    video.pause();
                    playPauseBtn.innerHTML = playIcon();
                    playPauseBtn.setAttribute("data-state", "play");
                }
            });
        }

        // Stop
        if (stopBtn) {
            stopBtn.addEventListener("click", () => {
                video.pause();
                playPauseBtn.innerHTML = playIcon();
                video.currentTime = 0;
                playPauseBtn && playPauseBtn.setAttribute("data-state", "play");
            });
        }

        // Mute/Unmute
        if (muteBtn) {
            muteBtn.addEventListener("click", () => {
                video.muted = !video.muted;
                muteBtn.innerHTML = video.muted ? muteIcon() : unmutedIcon();
                muteBtn.setAttribute("data-state", video.muted ? "unmute" : "mute");
            });
        }

        // Fullscreen
        if (fsBtn) {
            fsBtn.addEventListener("click", () => {
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                } else if (video.msRequestFullscreen) {
                    video.msRequestFullscreen();
                }
            });
        }

        // Progress bar update
        if (progress) {
            video.addEventListener("timeupdate", () => {
                progress.value = video.currentTime;
                progress.max = video.duration;
            });
            progress.addEventListener("input", () => {
                video.currentTime = progress.value;
            });
        }
    });
}

function playIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z\" fill=\"currentColor\"/> </svg>";
}

function pauseIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M10 4H5v16h5V4zm9 0h-5v16h5V4z\" fill=\"currentColor\"/> </svg>";
}
function fullScreenIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M21 3h-8v2h4v2h2v4h2V3zm-4 4h-2v2h-2v2h2V9h2V7zm-8 8h2v-2H9v2H7v2h2v-2zm-4-2v4h2v2H5h6v2H3v-8h2z\" fill=\"currentColor\"/> </svg>";
}
function muteIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M13 2h-2v2H9v2H7v2H3v8h4v2h2v2h2v2h2V2zM9 18v-2H7v-2H5v-4h2V8h2V6h2v12H9zm10-6.777h-2v-2h-2v2h2v2h-2v2h2v-2h2v2h2v-2h-2v-2zm0 0h2v-2h-2v2z\" fill=\"currentColor\"/> </svg>";
}
function unmutedIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M11 2H9v2H7v2H5v2H1v8h4v2h2v2h2v2h2V2zM7 18v-2H5v-2H3v-4h2V8h2V6h2v12H7zm6-8h2v4h-2v-4zm8-6h-2V2h-6v2h6v2h2v12h-2v2h-6v2h6v-2h2v-2h2V6h-2V4zm-2 4h-2V6h-4v2h4v8h-4v2h4v-2h2V8z\" fill=\"currentColor\"/> </svg>";
}
function chevronLeftIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M16 5v2h-2V5h2zm-4 4V7h2v2h-2zm-2 2V9h2v2h-2zm0 2H8v-2h2v2zm2 2v-2h-2v2h2zm0 0h2v2h-2v-2zm4 4v-2h-2v2h2z\" fill=\"currentColor\"/> </svg>";
}
function chevronRightIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M8 5v2h2V5H8zm4 4V7h-2v2h2zm2 2V9h-2v2h2zm0 2h2v-2h-2v2zm-2 2v-2h2v2h-2zm0 0h-2v2h2v-2zm-4 4v-2h2v2H8z\" fill=\"currentColor\"/> </svg>";
}

function zoomInIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M14 2H6v2H4v2H2v8h2v2h2v2h8v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2h2V6h-2V4h-2V2zm0 2v2h2v8h-2v2H6v-2H4V6h2V4h8zM9 6h2v3h3v2h-3v3H9v-3H6V9h3V6z\" fill=\"currentColor\"/> </svg>";
}
function zoomOutIcon(){
    return "<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"> <path d=\"M14 2H6v2H4v2H2v8h2v2h2v2h8v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2h2V6h-2V4h-2V2zm0 2v2h2v8h-2v2H6v-2H4V6h2V4h8zm0 5v2H6V9h8z\" fill=\"currentColor\"/> </svg>";
}

function hookAllReaders(){
    document.querySelectorAll(".reader[data-loaded='false']").forEach(reader_container => {
        let currentZoom = 1;
        let currentPage = 1;
        let data = [];
        $.ajax({
            url: $(reader_container).attr("data-src"),
            method: 'GET',
            dataType: 'json',
            success: function(d) {
                data = d;
                let s = "";
                const w = $(reader_container).width();
                data.forEach((page,i) => {
                    s += `<div class="page page-${i+1}" style="width:${w}px"><img src="${page}" alt="Page ${i}"></div>`;
                });
                reader_container.querySelector(".content").innerHTML = s;
            },
            error: function(xhr, status, error) {
                console.error('Error fetching booklet:', error);
            }
        });
        function goToPage(){
            reader_container.querySelectorAll(`.content .page:not(.page-${currentPage})`).forEach(page => {
                page.style.display = "none";
            });
            reader_container.querySelector(`.content .page-${currentPage}`).style.display = "flex";
        }
        reader_container.querySelector(".zoom-in").addEventListener("click", () => {
            currentZoom += 0.1;
            reader_container.querySelector(".content").style.setProperty("--height",`calc(calc(var(--main-height) - 20px) * ${currentZoom})`);
        });
        reader_container.querySelector(".zoom-out").addEventListener("click", () => {
            currentZoom -= 0.1;
            reader_container.querySelector(".content").style.setProperty("--height",`calc(calc(var(--main-height) - 20px) * ${currentZoom})`);
        });
        reader_container.querySelector(".left").addEventListener("click", () => {
            currentPage--;
            if (currentPage < 1) currentPage = 1;
            reader_container.querySelector(".header input").value = currentPage;
            goToPage();
        });
        reader_container.querySelector(".right").addEventListener("click", () => {
            currentPage++;
            if (currentPage > data.length) currentPage = data.length;
            reader_container.querySelector(".header input").value = currentPage;
            goToPage();
        });
        reader_container.querySelector(".header input").addEventListener("change", () => {
            currentPage = parseInt(reader_container.querySelector(".header input").value);
            if (currentPage < 1) currentPage = 1;
            if (currentPage > data.length) currentPage = data.length;
            reader_container.querySelector(".header input").value = currentPage;
            goToPage();
        });
    });
}

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
    parsed = parsed.replace(/\[reader src="([^"]+)"\](.*?)\[\/reader\]/g, function(match, src, text) {
        return `<div class="reader" data-src="${src}" data-loaded="false">
<div class="header">
<div class="controls">
<button class="left" data-pointer>${chevronLeftIcon()}</button>
<button class="right" data-pointer>${chevronRightIcon()}</button>
<span>Page: <input type="number" value="1">
</span></div>
<div class="controls"><button class="zoom-in" data-pointer>${zoomInIcon()}</button><button class="zoom-out" data-pointer>${zoomOutIcon()}</button><span>${text || "reader.pdf"}</span></div></div>
<div class="content"></div>
</div>`;
    });
    parsed = parsed.replace(/\[video src="([^"]+)"\](.*?)\[\/video\]/g, function(match, img_src, text) {
        return `<div class="video">
<div class="header">${text || "video.mp4"}</div>
<video><source src="${img_src}">Your browser does not support the video tag.</video>
<div id="video-controls" class="controls" data-state="hidden">
  <button id="play-pause" type="button" data-state="play" data-pointer>${playIcon()}</button>
  <button id="stop" type="button" data-state="stop" data-pointer>&nbsp;</button>
  <div class="progress">
    <progress id="progress" value="0" min="0">
      <span id="progress-bar"></span>
    </progress>
  </div>
  <button id="mute" type="button" data-state="mute" data-pointer>${unmutedIcon()}</button>
  <button id="fs" type="button" data-state="go-fullscreen" data-pointer>${fullScreenIcon()}</button>
</div></div>
`;
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
        hookAllVideos();
        hookAllReaders();
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