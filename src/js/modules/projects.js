import $ from "jquery";
import {getProjectName, isOtherPage} from "./pathDetector";
import {initAutoFitText} from "./autoFitText";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {SplitText} from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import {getCurrentLanguage, getTranslation, translateEverything} from "./translator";
import yeast from "yeast";
import {turnOnNeon, turnOffNeon, destroyAllNeonsExceptSign} from "./neons";
import initLazyLoad from "./lazyLoad";
import Matter from "matter-js";
import {isMobileDevice} from "../utils/isMobileDevice";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

function fetchProjFile(){
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '../assets/projects.json',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                // console.log(data);
                resolve(data);
            },
            error: function(xhr, status, error) {
                console.error('Error fetching projects:', error);
                reject(new Error(`Failed to fetch projects: ${error}`));
            }
        });
    });
}

function fetchProjectContent(file) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `../assets/site-content/lang-${getCurrentLanguage()}/${file}`,
            method: 'GET',
            dataType: 'html',
            success: function(data) {
                resolve(data);
            },
            error: function(_xhr, _status, _error) {
                $.ajax({
                    url: `../assets/site-content/${file}`,
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
                console.error('No translated page found:', _error);
            }
        });
    });

}
async function makeAllHeaders(){
    return new Promise((resolve, reject) => {
        // Clear existing table of contents items (except the "Contents" pill)
        $(".s1 .projects .project.neon").remove();

        // Find all header tags (h1-h6) in the content section
        const headers = $("section.content h1:not(.no-header), section.content h2:not(.no-header), section.content h3:not(.no-header), section.content h4:not(.no-header), section.content h5:not(.no-header), section.content h6:not(.no-header), section.content .add-header");

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
            resolve();
        }, 100);
    });
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
        let currentPage = 0;
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
                    s += `<div class="page page-${i}" style="width:${w}px"><img src="${page}" alt="Page ${i}"></div>`;
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
            if (currentPage < 0) currentPage = 0;
            reader_container.querySelector(".header input").value = currentPage;
            goToPage();
        });
        reader_container.querySelector(".right").addEventListener("click", () => {
            currentPage++;
            if (currentPage > data.length-1) currentPage = data.length-1;
            reader_container.querySelector(".header input").value = currentPage;
            goToPage();
        });
        reader_container.querySelector(".header input").addEventListener("change", () => {
            currentPage = parseInt(reader_container.querySelector(".header input").value);
            if (currentPage < 0) currentPage = 0;
            if (currentPage > data.length-1) currentPage = data.length-1;
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
    parsed = parsed.replace(/\[direct_a href="([^"]+)"\](.*?)\[\/direct_a\]/g, function(match, href, text) {
        return `<a href="${href}" data-pointer>${text}</a>`;
    });
    parsed = parsed.replace(/\[reader src="([^"]+)"\](.*?)\[\/reader\]/g, function(match, src, text) {
        return `<div class="reader" data-src="${src}" data-loaded="false">
<div class="header">
<div class="controls">
<button class="left" data-pointer>${chevronLeftIcon()}</button>
<button class="right" data-pointer>${chevronRightIcon()}</button>
<span><span>Page:</span> <input type="number" value="0">
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
function init404(){
    $(".sign-c").trigger("click");
    $(".sign-c").css("opacity",0);
    const section = document.querySelector("section.content.page404");
    if (!section) return;

    // Ensure section can host an absolutely positioned overlay
    section.style.position = section.style.position || "relative";
    if (!section.style.minHeight) section.style.minHeight = "60vh";

    // Create overlay container for DOM-synced bodies
    const overlay = document.createElement("div");
    overlay.className = "page404-physics";
    Object.assign(overlay.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: "1"
    });
    section.appendChild(overlay);

    // Matter.js engine setup
    const engine = Matter.Engine.create();
    const world = engine.world;
    world.gravity.y = 1.1; // slightly heavier to stack quicker

    // Track created letter bodies for DOM sync and clean up
    const letterBodies = new Set();

    // Offscreen canvas for accurate text measurement
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    function computeFont(basePx) {
        const cs = getComputedStyle(section);
        const fontStyle = cs.fontStyle || "normal";
        const fontVariant = cs.fontVariant || "normal";
        const fontWeight = cs.fontWeight || "normal";
        const fontFamily = cs.fontFamily || "sans-serif";
        return `${fontStyle} ${fontVariant} ${fontWeight} ${basePx}px ${fontFamily}`;
    }
    function measureTextSize(text, basePx) {
        measureCtx.font = computeFont(basePx);
        const m = measureCtx.measureText(text);
        const width = Math.max(1, Math.ceil(m.width));
        const ascent = m.actualBoundingBoxAscent || basePx * 0.8;
        const descent = m.actualBoundingBoxDescent || basePx * 0.2;
        const height = Math.max(1, Math.ceil(ascent + descent));
        return { width, height };
    }

    // Utility to get current bounds of the overlay
    function bounds() {
        const r = overlay.getBoundingClientRect();
        return { w: r.width, h: r.height };
    }

    // Static boundaries (floor + side walls)
    let floor, wallL, wallR;
    function buildBounds() {
        const { w, h } = bounds();
        const thickness = Math.max(20, Math.min(60, Math.floor(w * 0.02)));
        if (floor) Matter.World.remove(world, [floor, wallL, wallR]);
        floor = Matter.Bodies.rectangle(w / 2, h + thickness / 2, w, thickness, { isStatic: true });
        wallL = Matter.Bodies.rectangle(-thickness / 2, h / 2, thickness, h * 2, { isStatic: true });
        wallR = Matter.Bodies.rectangle(w + thickness / 2, h / 2, thickness, h * 2, { isStatic: true });
        Matter.World.add(world, [floor, wallL, wallR]);
    }
    buildBounds();


    function rndColour(){
        let o = ["var(--green)","var(--blue)","var(--red)"];
        return o[Math.floor(Math.random() * o.length)];
    }
    // Create a DOM letter + Matter body
    function spawnLetter(text) {
        const { w } = bounds();

        // Size proportional to container width
        const basePx = 24 + Math.floor(Math.random() * 40); // 24-40px base size
        const { width: bw, height: bh } = measureTextSize(text, basePx);

        // Create DOM element for visual representation
        const el = document.createElement("div");
        el.className = "falling-404";
        el.textContent = text;
        Object.assign(el.style, {
            position: "absolute",
            left: "0",
            top: "0",
            fontFamily: "inherit",
            fontWeight: "800",
            lineHeight: "1",
            whiteSpace: "pre",
            color: rndColour(),
            textShadow: "-1px -1px 0 var(--black), 1px -1px 0 var(--black), -1px 1px 0 var(--black), 1px 1px 0 var(--black)",
            willChange: "transform",
            userSelect: "none",
            fontSize: basePx + "px"
        });
        overlay.appendChild(el);

        // Random X across width, start slightly above the view
        const x = Math.max(bw / 2 + 10, Math.min(w - bw / 2 - 10, Math.random() * w));
        const y = -Math.random() * 150 - bh; // above the top

        const body = Matter.Bodies.rectangle(x, y, bw, bh, {
            restitution: 0.05,
            friction: 0.8,
            frictionStatic: 0.9,
            density: 0.002,
            chamfer: { radius: Math.min(bw, bh) * 0.08 }
        });
        body.plugin = { el, w: bw, h: bh };
        letterBodies.add(body);
        Matter.World.add(world, body);
    }

    // Sync DOM elements to physics bodies each frame
    function sync() {
        letterBodies.forEach(b => {
            const el = b.plugin && b.plugin.el;
            if (!el) return;
            const w = (b.plugin && b.plugin.w) || (b.bounds.max.x - b.bounds.min.x);
            const h = (b.plugin && b.plugin.h) || (b.bounds.max.y - b.bounds.min.y);
            el.style.transform = `translate(${b.position.x - w / 2}px, ${b.position.y - h / 2}px) rotate(${b.angle}rad)`;
        });
    }

    let spawnTimer = null;
    const maxAmount = isMobileDevice() ? 25 : 100;

    function isFilled() {
        const { h } = bounds();
        if (letterBodies.size < maxAmount) return false; // need some bodies first
        let minTop = Infinity;
        letterBodies.forEach(b => {
            minTop = Math.min(minTop, b.bounds.min.y);
        });
        // Consider filled when the pile reaches within ~10% from the top
        return minTop <= Math.max(20, h * 0.1);
    }

    function rndText(){
        let o = ["404","404","404","404","404","404","Not","Found","Oops","Inexistent","Missing","Lost"];
        return o[Math.floor(Math.random() * o.length)];
    }

    function startSpawning() {
        if (spawnTimer) return;
        spawnTimer = setInterval(() => {
            if (isFilled() || letterBodies.size > 240) {
                clearInterval(spawnTimer);
                spawnTimer = null;
                return;
            }
            spawnLetter(rndText());
        }, 50);
    }

    // Engine runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // After-update hook to sync DOM
    Matter.Events.on(engine, "afterUpdate", sync);

    // Rebuild bounds on resize
    const resizeObserver = new ResizeObserver(() => {
        buildBounds();
    });
    resizeObserver.observe(overlay);

    // Kick off spawning
    startSpawning();

    // Cleanup on section removal or navigation
    const cleanup = () => {
        try { resizeObserver.disconnect(); } catch {}
        if (spawnTimer) clearInterval(spawnTimer);
        Matter.Runner.stop(runner);
        Matter.World.clear(world, false);
        Matter.Engine.clear(engine);
        overlay.remove();
    };
    // Store cleanup to section dataset for external calls if needed
    section._cleanup404 = cleanup;
}

function initCarousel() {
    $(".carousel").attr("data-pointer", "");
    $(".carousel").append(`<div class="header">Carousel</div>`);
    document.querySelectorAll(".carousel").forEach(carousel => {
        const items = carousel.querySelectorAll(":scope > .carousel-item");
        if (!items || items.length === 0) return;

        // Ensure horizontal scrolling is enabled
        if (!carousel.style.overflowX) carousel.style.overflowX = "auto";

        // Axis-lock drag state
        let isDown = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let axis = null; // 'x' | 'y'
        const AXIS_SLOP = 6; // px

        function maxScrollLeft() {
            return Math.max(0, carousel.scrollWidth - carousel.clientWidth);
        }

        function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

        function onPointerDown(e) {
            isDown = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = carousel.scrollLeft;
            axis = null;
        }

        function onPointerMove(e) {
            if (!isDown) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!axis) {
                if (Math.abs(dx) > Math.abs(dy) + AXIS_SLOP) axis = 'x';
                else if (Math.abs(dy) > Math.abs(dx) + AXIS_SLOP) axis = 'y';
            }
            if (axis === 'x') {
                e.preventDefault();
                const next = clamp(startLeft - dx, 0, maxScrollLeft());
                // Use scrollTo so it's explicit horizontal scroll
                carousel.scrollTo({ left: next, top: 0, behavior: 'auto' });
            }
        }

        function onPointerUp() {
            if (!isDown) return;
            isDown = false;
            axis = null;
        }

        // Attach listeners
        carousel.addEventListener("pointerdown", onPointerDown, { passive: true });
        carousel.addEventListener("pointermove", onPointerMove, { passive: false });
        window.addEventListener("pointerup", onPointerUp, { passive: true });
        carousel.addEventListener("pointerleave", onPointerUp, { passive: true });

        // Keep scroll position in range on size/content changes
        const ro = new ResizeObserver(() => {
            const clamped = clamp(carousel.scrollLeft, 0, maxScrollLeft());
            if (clamped !== carousel.scrollLeft) carousel.scrollLeft = clamped;
        });
        ro.observe(carousel);

        items.forEach(item => item.querySelectorAll("img").forEach(img => {
            if (img.complete) return;
            img.addEventListener("load", () => {
                const clamped = clamp(carousel.scrollLeft, 0, maxScrollLeft());
                if (clamped !== carousel.scrollLeft) carousel.scrollLeft = clamped;
            }, { once: true });
        }));

        // Cleanup handle if re-initialized
        if (carousel._carouselCleanup) carousel._carouselCleanup();
        carousel._carouselCleanup = () => {
            try { ro.disconnect(); } catch {}
            carousel.removeEventListener("pointerdown", onPointerDown);
            carousel.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            carousel.removeEventListener("pointerleave", onPointerUp);
        };
    });
}


function generateProject(current_container){
    return new Promise(async (resolve, reject) => {
        // Clean up existing neon effects (except sign) before generating new project
        destroyAllNeonsExceptSign();

        // Kill all existing ScrollTriggers for headers
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars && trigger.vars.id && trigger.vars.id.startsWith('header-trigger-')) {
                trigger.kill();
            }
        });

        let name = getProjectName().replaceAll("/","").replaceAll(".html","");
        if(!name){
            console.error("Project name not found in URL");
            reject(new Error("Project name not found"));
            //move to /
            window.location.href = "/";
            return;
        }
        let projs = await fetchProjFile();
        let p = null;
        //find project in the list
        projs.forEach(cat => {
            cat.items.forEach(proj => {p = proj.name.replaceAll(' ', '-').replaceAll('.', '_') === name.replaceAll(' ', '-').replaceAll('.', '_') ? proj : p;});
        });
        let is404 = false;
        if(p == null){
            console.error("Project not found: " + name);
            // reject(new Error("Project not found"));
            // alert("Project not found: " + name);
            // return;
            p = {"name": "404", "url": "404.html", "image": "/assets/img/img.png", "directURL": false, "desc": "404"};
            name = "404";
            is404 = true;
            $("title").text("404 Page not Found");
        }
        const nameOfTitle = p.name.charAt(0).toUpperCase() + p.name.slice(1);
        $("title").text(getTranslation(nameOfTitle));
        let img_src = ".."+p?.image;
        let content = "";
        try {
            content = await fetchProjectContent(p.url);
        } catch (e) {
            // Graceful fallback if 404 content file is missing or failed
            if (is404) {
                content = "<div class=\"page404-placeholder\" style=\"position:absolute;inset:0;opacity:0\">404</div>";
            } else {
                content = "";
            }
        }

        $(".s1 h4 span").text(getTranslation(nameOfTitle));
        // If an existing 404 simulation is running, clean it up
        try {
            const existing404 = document.querySelector("section.content.page404");
            if (existing404 && existing404._cleanup404) existing404._cleanup404();
        } catch {}

        $("main").html("");
        //create section
        if(!is404){
            if(p?.image)
                $("main").append(`
                    <section class="project hero">
                        <h1>${getTranslation(nameOfTitle)}</h1>
                        <img data-src="${img_src}" src="${img_src.replace('img','img-low-res')}" alt="${name}">
                    </section>
                `);
            else
                $("main").append(`
                    <section class="project hero">
                        <h1>${getTranslation(nameOfTitle)}</h1>
                    </section>
                `);
        }
        $("main").append(`
            <section class="content grid-item${is404 ? " page404" : ""}">
                ${parseContent(content)}
            </section>
        `);
        $(".s1 .projects").append(`<h4 class="pill"><span>${getTranslation("Contents")}</span></h4>`);
        gsap.timeline().set(current_container,{
            position:"absolute"
        }).to(current_container,{
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

        //prep carousel
        //wrap each .carousel img in a div
        document.querySelectorAll(".carousel img").forEach(l=>{
            const wrapper = document.createElement("div");
            wrapper.className = "carousel-item";
            wrapper.appendChild(l);
            l.style.width = "100%";
            l.style.height = "100%";
            l.style.objectFit = "cover";
            l.style.objectPosition = "center";
            l.style.pointerEvents = "none"; // Disable pointer events for carousel images
            $(".carousel").append(wrapper);
        });

        if(is404) init404();
        hookAllVideos();
        hookAllReaders();
        initAutoFitText();
        await makeAllHeaders();
        initLazyLoad();
        initCarousel();

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
            if(mySplitText.words.length > 0)
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
    if(mySplitText.words.length < 1) return;
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