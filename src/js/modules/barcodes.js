/*https://codepen.io/bozdoz/pen/GyPWza
* Code 39 barcode
*
* Based on the description at https://en.wikipedia.org/wiki/Code_39
*/

// user variables

// thick bar - 1
// thin bar - 0
// index values: 1, 2, 4, 7, 0
const bars = [
    [1,0,0,0,1], // 1+0=1
    [0,1,0,0,1], // 2+0=2
    [1,1,0,0,0], // 1+2=3
    [0,0,1,0,1], // 4+0=4
    [1,0,1,0,0], // 1+4=5
    [0,1,1,0,0], // 2+4=6
    [0,0,0,1,1], // 7+0=7
    [1,0,0,1,0], // 1+7=8
    [0,1,0,1,0], // 2+7=9
    [0,0,1,1,0]  // 4+7=11 for some reason (see wiki)
];

// 0 - 10 || |||
// A - J  ||| ||
// K - T  |||| |
// U - *  | ||||
// index where extra space appears
const spaces = [2, 3, 4, 1];

// serializable chars
const chars = '1234567890abcdefghijklmnopqrstuvwxyz-._*';

// svg element function
const svgCreate = (tag, attrs) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
};

// omit all other characters function
const filter = (() => {
    // range char needs to move to be in regex
    const neglist = chars.replace('-','');
    const regex = new RegExp(`[^-${neglist}]`, 'g');
    return (input) => {
        // weak sauce bad char filter
        return input.replace(regex, '');
    };
})();

const shape_padding = 7;
const height = 100;

// barcode logic, saved to SVG
const barcodeSVG = (input, fill) => {
    const svg = svgCreate('svg', {
        width: 100,
        height: 50,
        viewBox: '0 0 100 50'
    });
    // always *'s around the input
    // as start/stop delimiters
    const fulltext = filter(`*${input}*`);

    // svg shape start position
    let x = 0;

    for (let i = 0, len = fulltext.length; i < len; i++) {
        let index = chars.indexOf(fulltext[i].toLowerCase());
        let space_index = ~~(index / 10);
        let bar_index = index % 10;
        let div = len + (len - 1) * (shape_padding / 100);

        for (let j = 0; j < 5; j++) {
            if (j === spaces[space_index]) {
                // one space
                x += shape_padding * 2 / div;
            }

            if (bars[bar_index][j]) {
                // thick bar
                width = 20 / div;
            } else {
                // thin bar
                width = 6 / div;
            }

            svg.appendChild(
                svgCreate('rect', {
                    x,
                    width,
                    height,
                    fill,
                })
            );
            x += width + (shape_padding / div);
        }
    }
    return svg;
}

document.addEventListener('DOMContentLoaded', () => {
    function renderBarcodes() {
        document.querySelectorAll("[data-barcode]").forEach(el => {
            el.innerHTML = '';
            let svg = barcodeSVG(el.dataset.barcode, el.dataset.barcodeFill || 'yellow');
            let dim = el.getBoundingClientRect();
            svg.style.transform = `scale(${dim.width / 100}, ${dim.height / 50})`;
            el.appendChild(svg);
        });
    }
    renderBarcodes();
    window.addEventListener('resize', renderBarcodes);

    // Listen for theme changes and regenerate barcodes
    window.addEventListener('themeChanged', renderBarcodes);
});
