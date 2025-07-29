function initCursor(){
    const cursor = document.querySelector('.cursor');
    const c = cursor.querySelector('.c');
    const inner = cursor.querySelector('.inner');
    let lastX = window.innerWidth/2;
    let lastY = window.innerHeight/2;
    let lastAngle = 0;
    let mouseX = lastX;
    let mouseY = lastY;

    // Track which image is currently set
    let currentCursorImg = 'cur1';
    let isPointer = false;

    function updateCursorImg() {
    }

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Check if the element under the cursor or any of its parents has data-pointer
        let el = document.elementFromPoint(mouseX, mouseY);
        isPointer = false;
        while (el) {
            if (el.hasAttribute && el.hasAttribute('data-pointer')) {
                isPointer = true;
                break;
            }
            el = el.parentElement;
        }
        // updateCursorImg();
    });

    function animate() {
        // Lerp position
        lastX += (mouseX - lastX) * 0.1;
        lastY += (mouseY - lastY) * 0.1;
        // Calculate velocity
        const dx = mouseX - lastX;
        const dy = mouseY - lastY;
        const velocity = Math.sqrt(dx * dx + dy * dy);
        // Calculate angle in radians for direction (from previous to current position)
        const targetAngle = Math.atan2(lastY - mouseY, lastX - mouseX);
        // Lerp angle
        let delta = targetAngle - lastAngle;
        // Normalize angle to [-PI, PI]
        delta = ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;
        lastAngle += delta * 0.075;
        // X scale increases with velocity, Y scale decreases (squash/stretch)
        const baseScale = 1;
        const stretch = velocity/500; // max stretch
        const scaleX = baseScale + stretch;
        const scaleY = baseScale - stretch * 0.5;
        // Apply translation, rotation, and directional scaling
        c.style.transform = `translate3d(${lastX}px, ${lastY}px, 0)`;
        inner.style.transform = `scale(${scaleX}, ${scaleY}) translate(-50%, -50%)`;
        requestAnimationFrame(animate);
    }
    animate();
}
export default initCursor;