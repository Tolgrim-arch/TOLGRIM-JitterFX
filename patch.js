const fs = require('fs');

// Patch index.html
let html = fs.readFileSync('index.html', 'utf8');

// 1. Modal
const modalHtml = `
    <div id="exportModal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); z-index: 9999; flex-direction: column; justify-content: center; align-items: center; color: white; font-family: monospace;">
        <h2 id="exportModalTitle" style="color: var(--accent-color); margin-bottom: 20px;">Codificando...</h2>
        <div style="width: 80%; max-width: 400px; height: 10px; background: #333; border-radius: 5px; overflow: hidden;">
            <div id="exportModalProgress" style="width: 0%; height: 100%; background: var(--accent-color); transition: width 0.2s;"></div>
        </div>
        <p id="exportModalText" style="margin-top: 15px;">0%</p>
        <p style="font-size: 0.8em; opacity: 0.6; margin-top: 30px;">Por favor, no cierres esta pestaña ni apagues la pantalla.</p>
    </div>
    <div class="container">
`;
html = html.replace('<body>\n    <div class="container">', '<body>' + modalHtml);

// 2. Presets
const presetsHtml = `
            <div class="control-group">
                <label>Presets Mágicos</label>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button id="presetPencil" class="toggle-btn" disabled style="flex: 1; padding: 4px; font-size: 0.85em;" title="Estilo de dibujo a lápiz tembloroso">✏️ Lápiz</button>
                    <button id="presetVHS" class="toggle-btn" disabled style="flex: 1; padding: 4px; font-size: 0.85em;" title="Estilo cámara antigua / estática">📺 VHS</button>
                    <button id="presetWater" class="toggle-btn" disabled style="flex: 1; padding: 4px; font-size: 0.85em;" title="Ondulaciones de agua suaves">🌊 Olas</button>
                    <button id="presetChaos" class="toggle-btn" disabled style="flex: 1; padding: 4px; font-size: 0.85em;" title="Vibración extrema en bloques">🌪️ Caos</button>
                </div>
            </div>

            <div class="control-group">
                <label>Tipo de Jitter
`;
html = html.replace('            <div class="control-group">\n                <label>Tipo de Jitter', presetsHtml);

// 3. Tooltips
html = html.replace('<label>Tipo de Jitter', '<label>Tipo de Jitter <span title="El estilo matemático de vibración. El Ruido Perlin (Value Noise) es más orgánico, los demás son más robóticos o cuadriculados." style="cursor:help;opacity:0.6">[?]</span>');
html = html.replace('<label>Intensidad:', '<label>Intensidad <span title="Fuerza del temblor. Valores altos rompen la imagen." style="cursor:help;opacity:0.6">[?]</span>:');
html = html.replace('<label>Velocidad (FPS):', '<label>Velocidad (FPS) <span title="Rapidez del temblor." style="cursor:help;opacity:0.6">[?]</span>:');
html = html.replace('<label>Frames Únicos:', '<label>Frames Únicos <span title="Cuántos fotogramas componen el bucle antes de repetirse." style="cursor:help;opacity:0.6">[?]</span>:');
html = html.replace('<label>Tamaño Bloque (Chunky):', '<label>Tamaño Bloque <span title="Tamaño del bloque de ruido matemático." style="cursor:help;opacity:0.6">[?]</span>:');

// 4. Flex-wrap Watermark
const wmOld = `<div style="display: flex; gap: 5px; align-items: center; font-size: 0.8em;">
                    <button id="wmBold" class="toggle-btn" disabled style="padding: 4px 8px; flex: 1;">B</button>
                    <button id="wmItalic" class="toggle-btn" disabled style="padding: 4px 8px; flex: 1; font-style: italic;">I</button>
                    
                    <span style="margin-left: 5px;">Borde:</span>
                    <input type="range" id="wmBorderWidth" min="0" max="10" value="4" disabled style="flex: 2; width: auto;">
                    
                    <span style="margin-left: 5px;">Opacidad:</span>
                    <input type="range" id="wmOpacity" min="0.1" max="1" step="0.1" value="0.8" disabled style="flex: 2; width: auto;">
                </div>`;
const wmNew = `<div style="display: flex; gap: 5px; align-items: center; font-size: 0.8em; flex-wrap: wrap; justify-content: space-between;">
                    <div style="display: flex; gap: 2px; flex: 1; min-width: 50px;">
                        <button id="wmBold" class="toggle-btn" disabled style="padding: 4px; flex: 1;">B</button>
                        <button id="wmItalic" class="toggle-btn" disabled style="padding: 4px; flex: 1; font-style: italic;">I</button>
                    </div>
                    
                    <div style="display: flex; align-items: center; flex: 2; min-width: 90px;">
                        <span style="margin-right: 5px;" title="Grosor Borde">Brd:</span>
                        <input type="range" id="wmBorderWidth" min="0" max="10" value="4" disabled style="width: 100%;">
                    </div>
                    
                    <div style="display: flex; align-items: center; flex: 2; min-width: 90px;">
                        <span style="margin-right: 5px;" title="Opacidad">Opc:</span>
                        <input type="range" id="wmOpacity" min="0.1" max="1" step="0.1" value="0.8" disabled style="width: 100%;">
                    </div>
                </div>`;
html = html.replace(wmOld, wmNew);

fs.writeFileSync('index.html', html, 'utf8');

// Patch app.js
let js = fs.readFileSync('app.js', 'utf8');

// Modals consts
const jsConsts = `
const presetPencil = document.getElementById('presetPencil');
const presetVHS = document.getElementById('presetVHS');
const presetWater = document.getElementById('presetWater');
const presetChaos = document.getElementById('presetChaos');

const exportModal = document.getElementById('exportModal');
const exportModalTitle = document.getElementById('exportModalTitle');
const exportModalProgress = document.getElementById('exportModalProgress');
const exportModalText = document.getElementById('exportModalText');

function applyPreset(type, amount, speed, block) {
    typeInput.value = type; updateLabel('typeVal', typeInput.options[typeInput.selectedIndex].text);
    amountInput.value = amount; updateLabel('amountVal', amount);
    speedInput.value = speed; updateLabel('speedVal', speed);
    blockInput.value = block; updateLabel('blockVal', block);
}

presetPencil.addEventListener('click', () => applyPreset(1, 0.003, 12, 100));
presetVHS.addEventListener('click', () => applyPreset(2, 0.02, 15, 20));
presetWater.addEventListener('click', () => applyPreset(3, 0.015, 6, 10));
presetChaos.addEventListener('click', () => applyPreset(4, 0.04, 24, 40));

// Value Labels
`;
js = js.replace('// Value Labels', jsConsts);

// Enable Controls
const enableControlsOld = `function enableControls() {\n    typeInput.disabled = false;`;
const enableControlsNew = `function enableControls() {\n    presetPencil.disabled = false;\n    presetVHS.disabled = false;\n    presetWater.disabled = false;\n    presetChaos.disabled = false;\n    typeInput.disabled = false;`;
js = js.replace(enableControlsOld, enableControlsNew);

// updateEstimate fix
const updateEstimateOld = `function updateEstimate() {
    if (!currentImage) return;
    const { w, h } = getTargetDimensions();
    const framesCount = parseInt(framesInput.value);
    const totalFrames = pingpongInput.checked ? (framesCount * 2 - 2) : framesCount;
    
    // Heuristic: GIF ~0.1 bytes/pixel, WebM ~0.02 bytes/pixel
    const pixels = w * h * totalFrames;
    const gifMb = (pixels * 0.1) / (1024 * 1024);
    const webmMb = (pixels * 0.02) / (1024 * 1024);
    
    exportEstimate.innerHTML = \`Resolución Final: <strong>\${w}x\${h} px</strong><br>
    Estimación: <strong>~\${gifMb.toFixed(1)} MB</strong> (GIF) / <strong>~\${webmMb.toFixed(1)} MB</strong> (Video)\`;
}`;
const updateEstimateNew = `function updateEstimate() {
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
js = js.replace(updateEstimateOld, updateEstimateNew);


// GIF Export Modal
const gifExportOld = `    const { w, h } = getTargetDimensions();
    statusDiv.innerText = \`Generando GIF (\${w}x\${h} - \${totalFrames} frames)...\`;
    
    const gif = new GIF({`;

const gifExportNew = `    const { w, h } = getTargetDimensions();
    exportModal.style.display = 'flex';
    exportModalTitle.innerText = 'Codificando GIF...';
    exportModalProgress.style.width = '0%';
    exportModalText.innerText = '0%';
    statusDiv.innerText = \`Generando GIF...\`;
    
    const gif = new GIF({`;
js = js.replace(gifExportOld, gifExportNew);

const gifProgressOld = `    gif.on('progress', function(p) {
        statusDiv.innerText = \`Codificando GIF... \${Math.round(p * 100)}%\`;
    });`;

const gifProgressNew = `    gif.on('progress', function(p) {
        const percent = Math.round(p * 100);
        exportModalProgress.style.width = percent + '%';
        exportModalText.innerText = percent + '%';
    });`;
js = js.replace(gifProgressOld, gifProgressNew);

const gifFinishedOld = `        statusDiv.innerText = \`¡GIF exportado! (\${(blob.size / 1024 / 1024).toFixed(2)} MB)\`;`;
const gifFinishedNew = `        exportModal.style.display = 'none';\n        statusDiv.innerText = \`¡GIF exportado!\`;`;
js = js.replace(gifFinishedOld, gifFinishedNew);


// WebM Export Modal
const webmExportOld = `    const { w, h } = getTargetDimensions();
    statusDiv.innerText = \`Grabando Video (\${w}x\${h} - \${totalFrames} frames)...\`;
    
    const exportCanvas = document.createElement('canvas');`;

const webmExportNew = `    const { w, h } = getTargetDimensions();
    exportModal.style.display = 'flex';
    exportModalTitle.innerText = 'Grabando Video...';
    exportModalProgress.style.width = '0%';
    exportModalText.innerText = '0%';
    statusDiv.innerText = \`Grabando Video...\`;
    
    const exportCanvas = document.createElement('canvas');`;
js = js.replace(webmExportOld, webmExportNew);

const webmFinishedOld = `    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });`;

const webmFinishedNew = `    mediaRecorder.onstop = () => {
        exportModal.style.display = 'none';
        const blob = new Blob(chunks, { type: 'video/webm' });`;
js = js.replace(webmFinishedOld, webmFinishedNew);

const webmDisableOld = `        statusDiv.innerText = \`¡Video exportado con Matte/Watermark!\`;
        disableExport(false);
    };
    
    mediaRecorder.start();
    
    for (let i = 0; i < totalFrames; i++) {
        drawFinalFrameToContext(exportCtx, w, h, i, framesCount);
        await new Promise(r => setTimeout(r, delayMs));
    }`;
const webmDisableNew = `        statusDiv.innerText = \`¡Video exportado!\`;
        disableExport(false);
    };
    
    mediaRecorder.start();
    
    for (let i = 0; i < totalFrames; i++) {
        drawFinalFrameToContext(exportCtx, w, h, i, framesCount);
        exportModalProgress.style.width = Math.round(((i+1)/totalFrames)*100) + '%';
        exportModalText.innerText = Math.round(((i+1)/totalFrames)*100) + '%';
        await new Promise(r => setTimeout(r, delayMs));
    }`;
js = js.replace(webmDisableOld, webmDisableNew);

fs.writeFileSync('app.js', js, 'utf8');
console.log('PATCH APPLIED');
