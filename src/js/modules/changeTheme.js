import $ from 'jquery';
import gsap from "gsap";
import {changeNeonColor} from "./neons";

const colors = ["rgb(150, 150, 150)","rgb(109, 136, 103)", "rgb(103, 110, 136)", "rgb(159, 85, 76)", "rgb(215, 164, 105)"];
let index = 0;

document.addEventListener('DOMContentLoaded', () => {
    $(".color-change").on("click", function () {
        index = (index + 1) % colors.length;
        let tl = gsap.timeline();
        tl.to(".color-change", {
            background: colors[(index + 1) % colors.length],
        });
        tl.to(":root", {
            "--background": colors[index],
            "--primary": colors[(index + 4) % colors.length],
            "--secondary": colors[(index + 1) % colors.length],
            duration: 0.5,
            ease: "power1.inOut"
        }, "<");
        document.querySelectorAll("[data-change-color-index]").forEach(el=>{
            const colorIndex = parseInt(el.dataset.changeColorIndex);
            if (colorIndex >= 0 && colorIndex < colors.length) {
                gsap.to(el, {
                    background: colors[(index + colorIndex) % colors.length],
                    borderColor: colors[(index + colorIndex) % colors.length],
                    duration: 0.5,
                    ease: "power1.inOut"
                });
            }
        });

        // Change neon color to match theme
        changeNeonColor();

        // Regenerate barcodes to update colors
        // Dispatch a custom event that the barcodes module can listen to
        window.dispatchEvent(new CustomEvent('themeChanged'));
    });
});

export {colors};