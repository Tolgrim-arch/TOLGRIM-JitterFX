const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

// Replace everything between "function updateEstimate() {" and "}"
const jsParts = js.split('function updateEstimate() {');
const beforeEstimate = jsParts[0];
const afterEstimate = jsParts[1].substring(jsParts[1].indexOf('}') + 1);

const newEstimate = `function updateEstimate() {
    if (!currentImage) return;
    const { w, h } = getTargetDimensions();
    const framesCount = parseInt(framesInput.value);
    const totalFrames = pingpongInput.checked ? (framesCount * 2 - 2) : framesCount;
    
    const pixels = w * h * totalFrames;
    const gifBytes = pixels * 0.1;
    const webmBytes = pixels * 0.02;
    
    const formatSize = (bytes) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    
    exportEstimate.innerHTML = \`Resolución Final: <strong>\${w}x\${h} px</strong><br>
    Estimación: <strong>~\${formatSize(gifBytes)}</strong> (GIF) / <strong>~\${formatSize(webmBytes)}</strong> (Video)\`;
}`;

js = beforeEstimate + newEstimate + afterEstimate;

// Replace GIF finished string if it's broken
js = js.replace(/statusDiv\.innerText = \`¡GIF exportado!.*\`;/, "statusDiv.innerText = `¡GIF exportado!`;");
js = js.replace(/statusDiv\.innerText = .*Video exportado con Matte\/Watermark!.*;/, "statusDiv.innerText = `¡Video exportado!`;");
js = js.replace(/statusDiv\.innerText = .*Video exportado.*?;/, "statusDiv.innerText = `¡Video exportado!`;");

fs.writeFileSync('app.js', js, 'utf8');
console.log("FIXED JS ENCODING");

