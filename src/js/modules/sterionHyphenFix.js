/**
 * Sterion Font Hyphen Fix Module
 * Replaces hyphens in Sterion font elements with Teknaf-styled hyphens
 */

function fixSterionHyphens() {
    // Find all elements that use Sterion font
    const sterionSelectors = [
        '.nav4 h1',
        '.nav0 h1',
        '.sidebar .s1 h4',
        '.sidebar .s1 .projects .project',
        '.pill',
        '.nav-item',
        'section.project h1',
        'h6'
    ];

    sterionSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // Check if element uses Sterion font
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.fontFamily.includes('Sterion')) {
                replaceHyphensInElement(element);
            }
        });
    });

    // Also check for elements with inline styles containing Sterion
    const allElements = document.querySelectorAll('*[style*="Sterion"]');
    allElements.forEach(element => {
        replaceHyphensInElement(element);
    });
}

function replaceHyphensInElement(element) {
    // Get all text nodes in the element
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue.includes('-')) {
            textNodes.push(node);
        }
    }

    // Replace hyphens in each text node
    textNodes.forEach(textNode => {
        if (textNode.nodeValue.includes('-')) {
            const parent = textNode.parentNode;
            const parts = textNode.nodeValue.split('-');

            // Create document fragment to hold new nodes
            const fragment = document.createDocumentFragment();

            parts.forEach((part, index) => {
                // Add the text part
                if (part) {
                    fragment.appendChild(document.createTextNode(part));
                }

                // Add hyphen with Teknaf font (except for last part)
                if (index < parts.length - 1) {
                    const hyphenSpan = document.createElement('span');
                    hyphenSpan.style.fontFamily = "'Teknaf', sans-serif";
                    hyphenSpan.textContent = '-';
                    fragment.appendChild(hyphenSpan);
                }
            });

            // Replace the original text node
            parent.replaceChild(fragment, textNode);
        }
    });
}

function initSterionHyphenFix() {
    // Fix hyphens on initial load
    fixSterionHyphens();

    // Set up observer for dynamically added content
    const observer = new MutationObserver((mutations) => {
        let shouldFix = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node or its children use Sterion font
                        const sterionElements = node.querySelectorAll ?
                            node.querySelectorAll('*') : [];

                        if (sterionElements.length > 0 ||
                            (node.style && node.style.fontFamily && node.style.fontFamily.includes('Sterion'))) {
                            shouldFix = true;
                        }
                    }
                });
            }
        });

        if (shouldFix) {
            setTimeout(fixSterionHyphens, 50); // Small delay to ensure DOM is updated
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

export { initSterionHyphenFix, fixSterionHyphens };
