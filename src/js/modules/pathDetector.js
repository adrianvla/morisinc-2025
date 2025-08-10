/**
 * Path detector module for project pages
 * Handles detection and parsing of project URLs in the format /project?<projectName>
 */

/**
 * Checks if the current URL matches the project page pattern
 * @returns {boolean} True if current page is a project page
 */
function isProjectPage() {
    const path = window.location.pathname;
    return path === '/project';
}


function isOtherPage(){
    const path = window.location.pathname;
    return ["/cv","/CV","/about","/ABOUT"].includes(path);
}

/**
 * Extracts the project name from the URL query string
 * @returns {string|null} The project name if found, null otherwise
 */
function getProjectName() {
    if (!isProjectPage()) {
        if(isOtherPage()){
            return window.location.pathname.replace("/","");
        }else
            return null;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const keys = Array.from(urlParams.keys());

    // Return the first query parameter key as the project name
    // This handles URLs like /project?myproject or /project?myproject=value
    return keys.length > 0 ? keys[0] : null;
}

/**
 * Gets the full query string after the ? in project URLs
 * @returns {string|null} The query string part after ?, null if not a project page or no query
 */
function getProjectQuery() {
    if (!isProjectPage()) {
        return null;
    }

    const search = window.location.search;
    // Remove the leading ? and return the rest
    return search.startsWith('?') ? search.substring(1) : null;
}

export { isProjectPage, getProjectName, getProjectQuery, isOtherPage};
