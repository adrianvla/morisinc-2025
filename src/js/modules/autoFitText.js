/**
 * Auto-fit text module - dynamically scales font size to fit container width
 */

function measureTextWidth(text, font) {
    // Create a canvas element for text measurement
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
}

function getComputedFont(element) {
    const style = window.getComputedStyle(element);
    return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

function autoFitText(element, maxWidth, padding = 40) {
    const text = element.textContent;
    const style = window.getComputedStyle(element);
    const fontFamily = style.fontFamily;
    const fontStyle = style.fontStyle;
    const fontWeight = style.fontWeight;

    // Start with a large font size and work down
    let fontSize = 200; // Start at 200px
    let textWidth;

    do {
        const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        textWidth = measureTextWidth(text, font);

        if (textWidth <= maxWidth - padding) {
            break;
        }

        fontSize -= 2; // Decrease by 2px each iteration
    } while (fontSize > 10); // Don't go below 10px

    // Apply the calculated font size
    element.style.fontSize = `${fontSize}px`;
}

function initAutoFitText() {
    // Find all project h1 elements
    const projectH1s = document.querySelectorAll('section.project h1');

    projectH1s.forEach(h1 => {
        const container = h1.closest('section.project');
        if (container) {
            const containerWidth = container.clientWidth;
            autoFitText(h1, containerWidth);
        }
    });

    // Re-calculate on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            projectH1s.forEach(h1 => {
                const container = h1.closest('section.project');
                if (container) {
                    const containerWidth = container.clientWidth;
                    autoFitText(h1, containerWidth);
                }
            });
        }, 100);
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoFitText);
} else {
    initAutoFitText();
}

// Also initialize after a short delay to ensure all elements are rendered
setTimeout(initAutoFitText, 500);

export { autoFitText, initAutoFitText };
