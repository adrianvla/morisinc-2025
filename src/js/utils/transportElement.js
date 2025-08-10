/**
 * Transports an element from its current position to a new parent while preserving
 * all event listeners, data attributes, and other properties (like Ctrl+X functionality)
 *
 * @param {HTMLElement} element - The element to transport
 * @param {HTMLElement} newParent - The new parent container
 * @param {HTMLElement|number|null} beforeElement - Element to insert before, or index position, or null for append
 * @returns {HTMLElement} The transported element
 */
function transportElement(element, newParent, beforeElement = null) {
    if (!element || !newParent) {
        console.warn('transportElement: Invalid element or newParent provided');
        return null;
    }

    if (!element.parentNode) {
        console.warn('transportElement: Element has no parent node');
        return null;
    }

    try {
        // Store original parent for reference
        const originalParent = element.parentNode;

        // Remove from current parent (this preserves all event listeners and data)
        const transportedElement = originalParent.removeChild(element);

        // Insert into new parent at specified position
        if (beforeElement === null) {
            // Append to end
            newParent.appendChild(transportedElement);
        } else if (typeof beforeElement === 'number') {
            // Insert at specific index
            const children = Array.from(newParent.children);
            if (beforeElement >= children.length) {
                newParent.appendChild(transportedElement);
            } else {
                newParent.insertBefore(transportedElement, children[beforeElement]);
            }
        } else if (beforeElement instanceof HTMLElement) {
            // Insert before specific element
            if (beforeElement.parentNode === newParent) {
                newParent.insertBefore(transportedElement, beforeElement);
            } else {
                console.warn('transportElement: beforeElement is not a child of newParent');
                newParent.appendChild(transportedElement);
            }
        } else {
            // Invalid beforeElement, append to end
            newParent.appendChild(transportedElement);
        }

        console.log('Element transported successfully:', {
            element: transportedElement,
            from: originalParent,
            to: newParent,
            beforeElement: beforeElement
        });

        return transportedElement;

    } catch (error) {
        console.error('Error transporting element:', error);
        return null;
    }
}

/**
 * Transports multiple elements while preserving their relative order and all properties
 *
 * @param {HTMLElement[]} elements - Array of elements to transport
 * @param {HTMLElement} newParent - The new parent container
 * @param {HTMLElement|number|null} beforeElement - Element to insert before, or index position, or null for append
 * @returns {HTMLElement[]} Array of transported elements
 */
function transportElements(elements, newParent, beforeElement = null) {
    if (!Array.isArray(elements) || elements.length === 0) {
        console.warn('transportElements: Invalid elements array provided');
        return [];
    }

    const transportedElements = [];
    let currentBeforeElement = beforeElement;

    // Transport elements in order
    elements.forEach((element, index) => {
        const transported = transportElement(element, newParent, currentBeforeElement);
        if (transported) {
            transportedElements.push(transported);

            // For subsequent elements, insert after the previously inserted element
            if (typeof beforeElement === 'number') {
                currentBeforeElement = beforeElement + index + 1;
            } else if (beforeElement instanceof HTMLElement && index === 0) {
                // After first insertion, subsequent elements should go after it
                currentBeforeElement = null; // Append to end
            }
        }
    });

    return transportedElements;
}

/**
 * Creates a temporary storage for elements that can be "pasted" later
 * Useful for implementing cut/copy/paste functionality
 */
class ElementClipboard {
    constructor() {
        this.clipboard = [];
        this.isCut = false; // Track if elements were cut or copied
    }

    /**
     * Cut elements (remove from DOM and store)
     * @param {HTMLElement|HTMLElement[]} elements - Element(s) to cut
     */
    cut(elements) {
        const elementsArray = Array.isArray(elements) ? elements : [elements];

        // Store elements and their original parents
        this.clipboard = elementsArray.map(element => ({
            element: element,
            originalParent: element.parentNode,
            originalNextSibling: element.nextSibling
        }));

        // Remove from DOM
        elementsArray.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });

        this.isCut = true;
        console.log(`Cut ${elementsArray.length} element(s) to clipboard`);
    }

    /**
     * Copy elements (clone and store, keep originals in DOM)
     * @param {HTMLElement|HTMLElement[]} elements - Element(s) to copy
     */
    copy(elements) {
        const elementsArray = Array.isArray(elements) ? elements : [elements];

        // Clone elements (deep clone to preserve all properties, but not event listeners)
        this.clipboard = elementsArray.map(element => ({
            element: element.cloneNode(true),
            originalParent: null,
            originalNextSibling: null
        }));

        this.isCut = false;
        console.log(`Copied ${elementsArray.length} element(s) to clipboard`);
        console.warn('Note: Copied elements will not have event listeners. Use cut() to preserve listeners.');
    }

    /**
     * Paste elements to new location
     * @param {HTMLElement} newParent - Where to paste the elements
     * @param {HTMLElement|number|null} beforeElement - Where to insert
     * @returns {HTMLElement[]} The pasted elements
     */
    paste(newParent, beforeElement = null) {
        if (this.clipboard.length === 0) {
            console.warn('Clipboard is empty');
            return [];
        }

        const elements = this.clipboard.map(item => item.element);
        const pastedElements = transportElements(elements, newParent, beforeElement);

        // Clear clipboard after pasting (elements are now "consumed")
        this.clipboard = [];
        this.isCut = false;

        console.log(`Pasted ${pastedElements.length} element(s)`);
        return pastedElements;
    }

    /**
     * Restore cut elements to their original positions
     * Only works if elements were cut (not copied)
     */
    restore() {
        if (!this.isCut || this.clipboard.length === 0) {
            console.warn('Cannot restore: elements were not cut or clipboard is empty');
            return false;
        }

        this.clipboard.forEach(item => {
            const { element, originalParent, originalNextSibling } = item;

            if (originalParent) {
                if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
                    originalParent.insertBefore(element, originalNextSibling);
                } else {
                    originalParent.appendChild(element);
                }
            }
        });

        console.log(`Restored ${this.clipboard.length} element(s) to original positions`);
        this.clipboard = [];
        this.isCut = false;
        return true;
    }

    /**
     * Check if clipboard has elements
     */
    hasElements() {
        return this.clipboard.length > 0;
    }

    /**
     * Get clipboard info
     */
    getInfo() {
        return {
            count: this.clipboard.length,
            isCut: this.isCut,
            elements: this.clipboard.map(item => item.element)
        };
    }
}

// Create a global clipboard instance
const globalElementClipboard = new ElementClipboard();

export {
    transportElement,
    transportElements,
    ElementClipboard,
    globalElementClipboard
};
