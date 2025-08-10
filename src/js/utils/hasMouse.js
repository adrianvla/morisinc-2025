// Returns true if the device likely has a mouse
export default function hasMouse() {
    // Check for pointer device type
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        return true;
    }
    // Check for mouse event support
    if ('onmousemove' in window) {
        return true;
    }
    // Fallback: check for maxTouchPoints
    if (navigator.maxTouchPoints === 0) {
        return true;
    }
    return false;
}

