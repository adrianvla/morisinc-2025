// Returns true if the browser is Safari (excluding Chrome and Edge)
export default function isSafari() {
    const ua = navigator.userAgent;
    return (
        /Safari/.test(ua) &&
        !/Chrome/.test(ua) &&
        !/Chromium/.test(ua) &&
        !/Edge/.test(ua)
    );
}

