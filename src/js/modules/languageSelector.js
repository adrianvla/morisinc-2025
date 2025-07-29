import gsap from "gsap";
import $ from 'jquery';
import barba from '@barba/core';


document.addEventListener('DOMContentLoaded', () => {
    const $crosshair = $(".language-selector .crosshair");
    const $listItems = $(".language-selector .list-item");

    // Set initial crosshair state - always visible, covering full area
    gsap.set($crosshair, {
        opacity: 1,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%"
    });

    $listItems.on("mouseenter", function () {
        const $this = $(this);
        const position = $this.position();
        const width = $this.outerWidth();
        const height = $this.outerHeight();

        // Animate crosshair to the position of the hovered item
        gsap.to($crosshair, {
            duration: 0.3,
            ease: "power2.out",
            top: position.top,
            left: position.left,
            width: width,
            height: height
        });
    });

    // Return crosshair to default position when mouse leaves any list item
    $listItems.on("mouseleave", function () {
        gsap.to($crosshair, {
            duration: 0.3,
            ease: "power2.out",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%"
        });
    });

    document.querySelectorAll("[data-change-language]").forEach(el=>{
        el.addEventListener("click", (e) => {
            e.preventDefault();
            //get attribute data-change-language
            const langChange = el.getAttribute('data-change-language');
            //replace current url's lang parameter with the new one
            const url = new URL(window.location.href);
            url.searchParams.set('lang', langChange);
            //go to the new url
            window.redirectType = 'lang-button';
            barba.go(url.toString());
        });
    });
});