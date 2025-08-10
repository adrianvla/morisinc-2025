const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputDir = path.join(__dirname, "img");
const outputDir = path.join(__dirname, "img-low-res");

function processDir(srcDir, destDir) {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    fs.readdirSync(srcDir).forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);

        if (fs.lstatSync(srcPath).isDirectory()) {
            processDir(srcPath, path.join(destDir, file));
        } else if (/\.(jpe?g|png|webp)$/i.test(file)) {
            const ext = path.extname(file).toLowerCase();

            // Prepare Sharp with the right output format & quality
            let pipeline = sharp(srcPath).resize({ height: 144 });
            if (ext === ".jpg" || ext === ".jpeg") {
                pipeline = pipeline.jpeg({ quality: 40 });
            } else if (ext === ".png") {
                pipeline = pipeline.png({ quality: 40, compressionLevel: 9 });
            } else if (ext === ".webp") {
                pipeline = pipeline.webp({ quality: 40 });
            }

            pipeline
                .toFile(destPath)
                .then(() => console.log(`Placeholder created: ${destPath}`))
                .catch(err => console.error(`Error: ${err}`));
        }
    });
}

processDir(inputDir, outputDir);
