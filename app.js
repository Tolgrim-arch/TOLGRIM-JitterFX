const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Hidden WebGL canvas for shader processing
const webglCanvas = document.createElement('canvas');
const gl = webglCanvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: true });

// UI Elements
const imageInput = document.getElementById('imageInput');
const imageInfo = document.getElementById('imageInfo');
const typeInput = document.getElementById('typeInput');
const amountInput = document.getElementById('amountInput');
const speedInput = document.getElementById('speedInput');
const framesInput = document.getElementById('framesInput');
const blockInput = document.getElementById('blockInput');
const exportBtn = document.getElementById('exportBtn');
const exportWebmBtn = document.getElementById('exportWebmBtn');
const statusDiv = document.getElementById('status');
const bgPreset = document.getElementById('bgPreset');
const bgColorPicker = document.getElementById('bgColorPicker');
const watermarkInput = document.getElementById('watermarkInput');
const wmPos = document.getElementById('wmPos');
const wmColor = document.getElementById('wmColor');
const wmBorderColor = document.getElementById('wmBorderColor');
const wmBold = document.getElementById('wmBold');
const wmItalic = document.getElementById('wmItalic');
const wmBorderWidth = document.getElementById('wmBorderWidth');
const wmOpacity = document.getElementById('wmOpacity');
const pingpongInput = document.getElementById('pingpongInput');
const resolutionInput = document.getElementById('resolutionInput');
const exportEstimate = document.getElementById('exportEstimate');

const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d');
let maskTexture;
let uMaskLoc;
let isBrushEnabled = false;
let isMaskViewEnabled = false;
let isPainting = false;
let maskNeedsUpdate = false;

const brushEnableBtn = document.getElementById('brushEnableBtn');
const brushViewBtn = document.getElementById('brushViewBtn');
const brushControlsDiv = document.getElementById('brushControlsDiv');
const brushModeAddBtn = document.getElementById('brushModeAddBtn');
const brushModeSubBtn = document.getElementById('brushModeSubBtn');
const brushSizeInput = document.getElementById('brushSizeInput');
const brushHardnessInput = document.getElementById('brushHardnessInput');
const maskClearBtn = document.getElementById('maskClearBtn');
const maskFillBtn = document.getElementById('maskFillBtn');

brushEnableBtn.addEventListener('click', () => {
    isBrushEnabled = !isBrushEnabled;
    brushEnableBtn.classList.toggle('active', isBrushEnabled);
    brushControlsDiv.style.display = isBrushEnabled ? 'flex' : 'none';
    canvas.style.cursor = isBrushEnabled ? 'none' : 'default';
    if (!isBrushEnabled) brushCursor.style.display = 'none';
});

brushViewBtn.addEventListener('click', () => {
    isMaskViewEnabled = !isMaskViewEnabled;
    brushViewBtn.classList.toggle('active', isMaskViewEnabled);
});

let brushMode = 'add';
brushModeAddBtn.addEventListener('click', () => { brushMode = 'add'; brushModeAddBtn.classList.add('active'); brushModeSubBtn.classList.remove('active'); });
brushModeSubBtn.addEventListener('click', () => { brushMode = 'sub'; brushModeSubBtn.classList.add('active'); brushModeAddBtn.classList.remove('active'); });

function fillMask(color) {
    if (!maskCtx) return;
    maskCtx.fillStyle = color;
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskNeedsUpdate = true;
}

maskClearBtn.addEventListener('click', () => fillMask('#000000'));
maskFillBtn.addEventListener('click', () => fillMask('#ffffff'));

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const imageAspect = canvas.width / canvas.height;
    const boxAspect = rect.width / rect.height;
    
    let renderedWidth, renderedHeight, offsetX, offsetY;
    if (imageAspect > boxAspect) {
        renderedWidth = rect.width;
        renderedHeight = rect.width / imageAspect;
        offsetX = 0;
        offsetY = (rect.height - renderedHeight) / 2;
    } else {
        renderedHeight = rect.height;
        renderedWidth = rect.height * imageAspect;
        offsetX = (rect.width - renderedWidth) / 2;
        offsetY = 0;
    }
    
    const x = (e.clientX - rect.left - offsetX) * (canvas.width / renderedWidth);
    const y = (e.clientY - rect.top - offsetY) * (canvas.height / renderedHeight);
    return { x, y };
}

function paint(e) {
    if (!currentImage) return;
    const { x, y } = getPointerPos(e);
    const size = parseInt(brushSizeInput.value);
    const hardness = parseInt(brushHardnessInput.value) / 100;
    
    maskCtx.beginPath();
    maskCtx.arc(x, y, size, 0, Math.PI * 2);
    
    if (hardness >= 0.95) {
        maskCtx.fillStyle = brushMode === 'add' ? '#ffffff' : '#000000';
    } else {
        const gradient = maskCtx.createRadialGradient(x, y, size * hardness, x, y, size);
        if (brushMode === 'add') {
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
        } else {
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
        }
        maskCtx.fillStyle = gradient;
    }
    
    // For smooth drawing and erasing with gradients
    maskCtx.globalCompositeOperation = brushMode === 'add' ? 'source-over' : 'destination-out';
    if (brushMode === 'sub' && hardness >= 0.95) {
        maskCtx.fillStyle = 'rgba(0,0,0,1)';
    }
    
    maskCtx.fill();
    maskCtx.globalCompositeOperation = 'source-over';
    
    // If erasing, we used destination-out which makes it transparent. We need black background.
    // Actually, drawing white/transparent over a black background is easier.
    // Let's ensure the canvas is black where transparent.
    // In WebGL we only read the Red channel, so transparency acts as 0 (black)! This is perfect.
    maskNeedsUpdate = true;
}

const brushCursor = document.getElementById('brushCursor');

function updateBrushCursor(e) {
    brushCursor.style.display = 'block';
    brushCursor.style.left = e.clientX + 'px';
    brushCursor.style.top = e.clientY + 'px';
    
    const rect = canvas.getBoundingClientRect();
    const imageAspect = canvas.width / canvas.height;
    const boxAspect = rect.width / rect.height;
    let renderedWidth;
    if (imageAspect > boxAspect) {
        renderedWidth = rect.width;
    } else {
        renderedWidth = rect.height * imageAspect;
    }
    const scale = renderedWidth / canvas.width;
    const size = parseInt(brushSizeInput.value) * 2 * scale;
    
    brushCursor.style.width = size + 'px';
    brushCursor.style.height = size + 'px';
}

canvas.addEventListener('pointerdown', (e) => {
    if (!isBrushEnabled) return;
    isPainting = true;
    updateBrushCursor(e);
    paint(e);
    canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
    if (isBrushEnabled) {
        updateBrushCursor(e);
        if (isPainting) paint(e);
    }
});
canvas.addEventListener('pointerleave', () => {
    brushCursor.style.display = 'none';
});
window.addEventListener('pointerup', () => isPainting = false);



const presetPencil = document.getElementById('presetPencil');
const presetVHS = document.getElementById('presetVHS');
const presetWater = document.getElementById('presetWater');
const presetChaos = document.getElementById('presetChaos');

const exportModal = document.getElementById('exportModal');
const exportModalTitle = document.getElementById('exportModalTitle');
const exportModalProgress = document.getElementById('exportModalProgress');
const exportModalText = document.getElementById('exportModalText');
const filenameInput = document.getElementById('filenameInput');

function applyPreset(type, amount, speed, block) {
    typeInput.value = type; updateLabel('typeVal', typeInput.options[typeInput.selectedIndex].text);
    amountInput.value = amount; updateLabel('amountVal', amount);
    speedInput.value = speed; updateLabel('speedVal', speed + 'x');
    blockInput.value = block; updateLabel('blockVal', block);
}

presetPencil.addEventListener('click', () => applyPreset(1, 1.0, 1.5, 30));
presetVHS.addEventListener('click', () => applyPreset(2, 2.5, 2.0, 10));
presetWater.addEventListener('click', () => applyPreset(3, 3.0, 0.5, 5));
presetChaos.addEventListener('click', () => applyPreset(4, 5.0, 3.0, 40));

// Value Labels

const updateLabel = (id, val) => document.getElementById(id).innerText = val;
amountInput.addEventListener('input', e => updateLabel('amountVal', e.target.value));
speedInput.addEventListener('input', e => updateLabel('speedVal', e.target.value));
framesInput.addEventListener('input', e => updateLabel('framesVal', e.target.value));
blockInput.addEventListener('input', e => updateLabel('blockVal', e.target.value));

bgPreset.addEventListener('change', () => {
    if (bgPreset.value === 'custom') {
        bgColorPicker.disabled = false;
    } else {
        bgColorPicker.disabled = true;
        if (bgPreset.value !== 'transparent') bgColorPicker.value = bgPreset.value;
    }
});


function getTargetDimensions() {
    if (!currentImage) return { w: 0, h: 0 };
    let scale = parseFloat(resolutionInput.value);
    return { 
        w: Math.round(currentImage.width * scale), 
        h: Math.round(currentImage.height * scale) 
    };
}

function updateEstimate() {
    if (!currentImage) return;
    const { w, h } = getTargetDimensions();
    const framesCount = parseInt(framesInput.value);
    const totalFrames = pingpongInput.checked ? (framesCount * 2 - 2) : framesCount;
    
    const resOutputLabel = document.getElementById('resOutputLabel');
    if (resOutputLabel) resOutputLabel.innerText = `${w}x${h}px`;
    
    const pixels = w * h * totalFrames;
    const gifBytes = pixels * 0.1;
    const webmBytes = pixels * 0.02;
    
    const formatSize = (bytes) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    
    exportEstimate.innerHTML = t('estimate', {gif: formatSize(gifBytes), webm: formatSize(webmBytes)});
}

framesInput.addEventListener('input', updateEstimate);
pingpongInput.addEventListener('change', updateEstimate);
resolutionInput.addEventListener('change', updateEstimate);

// Shaders
const vsSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_tex_coord;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_tex_coord = a_texCoord;
    }
`;

const fsSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif
    uniform float u_time;
    uniform float u_sketchy_speed;
    uniform float u_sketchy_amount;
    uniform float u_sketchy_type;
    uniform float u_sketchy_frames;
    uniform float u_sketchy_blocksize;
    uniform sampler2D tex0;
    uniform sampler2D u_mask;
    varying vec2 v_tex_coord;

    float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float value_noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = rand(i);
        float b = rand(i + vec2(1.0, 0.0));
        float c = rand(i + vec2(0.0, 1.0));
        float d = rand(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    void main() {
        float maskVal = texture2D(u_mask, v_tex_coord).r;
        float t = mod(floor(u_time * max(u_sketchy_speed, 1.0)), max(u_sketchy_frames, 1.0));
        vec2 offset = vec2(0.0);
        
        if (u_sketchy_type < 0.5) {
            offset.x = (rand(vec2(t, 1.0)) - 0.5) * u_sketchy_amount;
            offset.y = (rand(vec2(1.0, t)) - 0.5) * u_sketchy_amount;
        } else if (u_sketchy_type < 1.5) {
            vec2 block_uv = floor(v_tex_coord * max(u_sketchy_blocksize, 1.0));
            offset.x = (rand(block_uv + vec2(t, 0.0)) - 0.5) * u_sketchy_amount;
            offset.y = (rand(block_uv + vec2(0.0, t)) - 0.5) * u_sketchy_amount;
        } else if (u_sketchy_type < 2.5) {
            offset.x = (rand(v_tex_coord + vec2(t, 0.0)) - 0.5) * u_sketchy_amount;
            offset.y = (rand(v_tex_coord + vec2(0.0, t)) - 0.5) * u_sketchy_amount;
        } else if (u_sketchy_type < 3.5) {
            float freq = max(u_sketchy_blocksize, 1.0);
            float phaseX = rand(vec2(t, 1.0)) * 6.2831;
            float phaseY = rand(vec2(1.0, t)) * 6.2831;
            offset.x = sin(v_tex_coord.y * freq + phaseX) * u_sketchy_amount;
            offset.y = sin(v_tex_coord.x * freq + phaseY) * u_sketchy_amount;
        } else {
            vec2 grid = v_tex_coord * max(u_sketchy_blocksize, 1.0);
            offset.x = (value_noise(grid + vec2(t * 10.0, 0.0)) - 0.5) * u_sketchy_amount;
            offset.y = (value_noise(grid + vec2(0.0, t * 10.0)) - 0.5) * u_sketchy_amount;
        }
        
        offset *= maskVal;
        gl_FragColor = texture2D(tex0, v_tex_coord + offset);
    }
`;

function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compileShader(gl, vsSource, gl.VERTEX_SHADER));
gl.attachShader(program, compileShader(gl, fsSource, gl.FRAGMENT_SHADER));
gl.linkProgram(program);
gl.useProgram(program);

const posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
const posLoc = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

const texBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1, 1,1, 0,0, 0,0, 1,1, 1,0]), gl.STATIC_DRAW);
const texLoc = gl.getAttribLocation(program, "a_texCoord");
gl.enableVertexAttribArray(texLoc);
gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

const texture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

maskTexture = gl.createTexture();
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, maskTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

uMaskLoc = gl.getUniformLocation(program, "u_mask");
gl.uniform1i(uMaskLoc, 1);

const uTime = gl.getUniformLocation(program, "u_time");
const uSpeed = gl.getUniformLocation(program, "u_sketchy_speed");
const uAmount = gl.getUniformLocation(program, "u_sketchy_amount");
const uType = gl.getUniformLocation(program, "u_sketchy_type");
const uFrames = gl.getUniformLocation(program, "u_sketchy_frames");
const uBlocksize = gl.getUniformLocation(program, "u_sketchy_blocksize");

let currentImage = null;
let animationId = null;
let isExporting = false;

function renderManualFrame(t) {
    gl.uniform1f(uTime, t);
    gl.uniform1f(uSpeed, parseFloat(speedInput.value));
    gl.uniform1f(uAmount, parseFloat(amountInput.value));
    gl.uniform1f(uType, parseFloat(typeInput.value));
    gl.uniform1f(uFrames, parseFloat(framesInput.value));
    gl.uniform1f(uBlocksize, parseFloat(blockInput.value));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Draw a specific composed frame to a target 2D context
function drawFinalFrameToContext(targetCtx, width, height, frameIndex, framesCount) {
    const speed = parseFloat(speedInput.value);
    const isPingPong = pingpongInput.checked;
    
    let t = frameIndex;
    if (isPingPong && frameIndex >= framesCount) {
        t = (framesCount - 1) - (frameIndex - framesCount + 1);
    }
    
    // Draw shader to hidden WebGL canvas
    renderManualFrame((t + 0.1) / speed);
    
    // Draw background
    if (bgPreset.value !== 'transparent') {
        targetCtx.fillStyle = bgPreset.value === 'custom' ? bgColorPicker.value : bgPreset.value;
        targetCtx.fillRect(0, 0, width, height);
    } else {
        targetCtx.clearRect(0, 0, width, height);
    }
    
    // Composite WebGL canvas
    targetCtx.drawImage(webglCanvas, 0, 0, width, height);
    
    // Draw Watermark
    if (watermarkInput.value.trim() !== '') {
        const text = watermarkInput.value.trim();
        const fontSize = Math.max(14, Math.floor(height * 0.035));
        
        const isBold = wmBold.classList.contains('active') ? 'bold' : '';
        const isItalic = wmItalic.classList.contains('active') ? 'italic' : '';
        targetCtx.font = `${isItalic} ${isBold} ${fontSize}px sans-serif`.trim();
        targetCtx.globalAlpha = parseFloat(wmOpacity.value);
        
        targetCtx.textBaseline = 'middle';
        targetCtx.textAlign = 'center';
        
        const padding = fontSize;
        let x, y;
        const pos = wmPos.value;
        
        if (pos === 'br') { targetCtx.textAlign = 'right'; x = width - padding; y = height - padding; }
        else if (pos === 'bl') { targetCtx.textAlign = 'left'; x = padding; y = height - padding; }
        else if (pos === 'tr') { targetCtx.textAlign = 'right'; x = width - padding; y = padding; }
        else if (pos === 'tl') { targetCtx.textAlign = 'left'; x = padding; y = padding; }
        else { targetCtx.textAlign = 'center'; x = width / 2; y = height / 2; }
        
        const bWidth = parseInt(wmBorderWidth.value);
        if (bWidth > 0) {
            targetCtx.lineWidth = Math.max(1, fontSize * (bWidth / 20));
            targetCtx.strokeStyle = wmBorderColor.value;
            targetCtx.strokeText(text, x, y);
        }
        
        targetCtx.fillStyle = wmColor.value;
        targetCtx.fillText(text, x, y);
        
        targetCtx.globalAlpha = 1.0;
    }
    
    if (isMaskViewEnabled && maskCanvas && !isExporting) {
        targetCtx.globalCompositeOperation = 'multiply';
        targetCtx.globalAlpha = 0.5;
        targetCtx.fillStyle = 'red';
        targetCtx.fillRect(0, 0, width, height);
        targetCtx.globalCompositeOperation = 'screen';
        targetCtx.drawImage(maskCanvas, 0, 0, width, height);
        targetCtx.globalCompositeOperation = 'source-over';
        targetCtx.globalAlpha = 1.0;
    }
}

function render(timeMs) {
    if (!currentImage || isExporting) return;
    
    if (maskNeedsUpdate) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, maskTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas);
        maskNeedsUpdate = false;
    }
    
    const speed = parseFloat(speedInput.value);
    const framesCount = parseInt(framesInput.value);
    const isPingPong = pingpongInput.checked;
    const totalFrames = isPingPong ? (framesCount * 2 - 2) : framesCount;
    
    const currentLoopFrame = Math.floor((timeMs / 1000.0) * speed) % Math.max(totalFrames, 1);
    
    drawFinalFrameToContext(ctx, canvas.width, canvas.height, currentLoopFrame, framesCount);
    
    animationId = requestAnimationFrame(render);
}

// Removed old imageInput listener

function disableExport(disable) {
    isExporting = disable;
    exportBtn.disabled = disable;
    exportWebmBtn.disabled = disable;
    if (disable && animationId) cancelAnimationFrame(animationId);
    if (!disable && currentImage) animationId = requestAnimationFrame(render);
}

exportBtn.addEventListener('click', () => {
    if (!currentImage) return;
    disableExport(true);
    
    const framesCount = parseInt(framesInput.value);
    const speed = parseFloat(speedInput.value);
    const totalFrames = pingpongInput.checked ? (framesCount * 2 - 2) : framesCount;
    
    const { w, h } = getTargetDimensions();
    statusDiv.innerText = t('dyn_gen_gif', {w, h, f: totalFrames});
    
    exportModal.style.display = 'flex';
    exportModalTitle.innerText = t('dyn_rendering_gif');
    exportModalText.innerText = t('dyn_res', {w, h, f: totalFrames});
    exportModalProgress.style.width = '0%';
    
    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: 'gif.worker.js',
        width: w,
        height: h
    });

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');

    for (let i = 0; i < totalFrames; i++) {
        drawFinalFrameToContext(tempCtx, w, h, i, framesCount);
        gif.addFrame(tempCtx, { delay: 1000 / speed, copy: true });
    }

    gif.on('progress', function(p) {
        statusDiv.innerText = t('dyn_enc_gif', {p: Math.round(p * 100)});
        exportModalProgress.style.width = `${Math.round(p * 100)}%`;
    });

    gif.on('finished', function(blob) {
        exportModal.style.display = 'none';
        statusDiv.innerText = t('dyn_gif_done');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        let fn = filenameInput.value.trim() || 'jitterfx_export';
        if (!fn.toLowerCase().endsWith('.gif')) fn += '.gif';
        a.download = fn;
        a.click();
        disableExport(false);
    });
    
    gif.render();
});

exportWebmBtn.addEventListener('click', async () => {
    if (!currentImage) return;
    disableExport(true);
    
    const framesCount = parseInt(framesInput.value);
    const speed = parseFloat(speedInput.value);
    const totalFrames = pingpongInput.checked ? (framesCount * 2 - 2) : framesCount;
    const delayMs = 1000 / speed;
    
    const { w, h } = getTargetDimensions();
    statusDiv.innerText = t('dyn_rec_webm', {w, h, f: totalFrames});
    
    exportModal.style.display = 'flex';
    exportModalTitle.innerText = t('dyn_rendering_webm');
    exportModalText.innerText = t('dyn_webm_rec');
    exportModalProgress.style.width = '0%';
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const exportCtx = exportCanvas.getContext('2d');
    
    const stream = exportCanvas.captureStream(speed);
    
    let options = { mimeType: 'video/webm; codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
    }
    
    let mediaRecorder;
    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        exportModal.style.display = 'none';
        disableExport(false);
        alert(t('webm_not_supported') || "Error: Your browser/device (iOS/Safari) does not support WebM recording. Please export as GIF.");
        return;
    }
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
        exportModal.style.display = 'none';
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        let fn = filenameInput.value.trim() || 'jitterfx_export';
        if (!fn.toLowerCase().endsWith('.webm')) fn += '.webm';
        a.download = fn;
        a.click();
        
        statusDiv.innerText = t('dyn_webm_done');
        disableExport(false);
    };
    
    mediaRecorder.start();
    
    for (let i = 0; i < totalFrames; i++) {
        drawFinalFrameToContext(exportCtx, w, h, i, framesCount);
        exportModalProgress.style.width = `${Math.round((i / totalFrames) * 100)}%`;
        await new Promise(r => setTimeout(r, delayMs));
    }
    
    await new Promise(r => setTimeout(r, 50)); 
    mediaRecorder.stop();
});

// Drag & Drop UI Logic
const dropZone = document.getElementById('dropZone');
const emptyState = document.getElementById('emptyState');

emptyState.addEventListener('click', () => imageInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => emptyState.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => emptyState.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', (e) => {
    let dt = e.dataTransfer;
    let files = dt.files;
    if (files.length && files[0].type.startsWith('image/')) {
        handleFile(files[0]);
    }
});

function enableControls() {
    presetPencil.disabled = false;
    presetVHS.disabled = false;
    presetWater.disabled = false;
    presetChaos.disabled = false;
    typeInput.disabled = false;
    amountInput.disabled = false;
    speedInput.disabled = false;
    framesInput.disabled = false;
    blockInput.disabled = false;
    bgPreset.disabled = false;
    watermarkInput.disabled = false;
    brushEnableBtn.disabled = false;
    brushViewBtn.disabled = false;
    wmPos.disabled = false;
    wmColor.disabled = false;
    wmBorderColor.disabled = false;
    wmBold.disabled = false;
    wmItalic.disabled = false;
    wmBorderWidth.disabled = false;
    wmOpacity.disabled = false;
    pingpongInput.disabled = false;
    resolutionInput.disabled = false;
    filenameInput.disabled = false;
    exportBtn.disabled = false;
    exportWebmBtn.disabled = false;
    emptyState.style.display = 'none';
    canvas.style.display = 'block';
    updateEstimate();
}

function handleFile(file) {
    if (file.name) {
        let name = file.name.replace(/\.[^/.]+$/, "");
        filenameInput.value = name + "_jitterfx";
    } else {
        filenameInput.value = "jitterfx_export";
    }

    const img = new Image();
    img.onload = () => {
        currentImage = img;
        
        webglCanvas.width = img.width;
        webglCanvas.height = img.height;
        canvas.width = img.width;
        canvas.height = img.height;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        
        fillMask('#ffffff'); // Default: everything jitters
        
        gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        enableControls();
        statusDiv.innerText = t('status_loaded');
        
        let mbSize = (file.size / (1024 * 1024)).toFixed(2);
        let kbSize = (file.size / 1024).toFixed(1);
        let displaySize = file.size > 1024 * 1024 ? `${mbSize} MB` : `${kbSize} KB`;
        imageInfo.innerHTML = `<strong>${t('info_res')}:</strong> ${img.width}x${img.height} px &nbsp;|&nbsp; <strong>${t('info_weight')}:</strong> ${displaySize}`;
        imageInfo.style.display = 'block';
        
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(render);
    };
    img.src = URL.createObjectURL(file);
}

// Override previous imageInput listener
imageInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});


// Hook into GIF progress via monkeypatching or just modifying the existing event if we could. Since we didn't store the gif variable globally, we can't easily hook it without regex. Let's just do a replace.



const sidebarElement = document.getElementById('sidebarElement');
const themeToggleSidebar = document.getElementById('themeToggleSidebar');
const savedSidebarTheme = localStorage.getItem('jitterfx-theme-sidebar');

if (savedSidebarTheme === 'light') {
    sidebarElement.classList.add('light-theme');
    themeToggleSidebar.checked = true;
} else {
    themeToggleSidebar.checked = false;
}

themeToggleSidebar.addEventListener('change', () => {
    if (themeToggleSidebar.checked) {
        sidebarElement.classList.add('light-theme');
        localStorage.setItem('jitterfx-theme-sidebar', 'light');
    } else {
        sidebarElement.classList.remove('light-theme');
        localStorage.setItem('jitterfx-theme-sidebar', 'dark');
    }
});

const dropZoneElement = document.getElementById('dropZone');
const themeTogglePreview = document.getElementById('themeTogglePreview');
const savedPreviewTheme = localStorage.getItem('jitterfx-theme-preview');

if (savedPreviewTheme === 'light') {
    dropZoneElement.classList.add('light-theme');
    themeTogglePreview.checked = true;
} else {
    themeTogglePreview.checked = false;
}

themeTogglePreview.addEventListener('change', () => {
    if (themeTogglePreview.checked) {
        dropZoneElement.classList.add('light-theme');
        localStorage.setItem('jitterfx-theme-preview', 'light');
    } else {
        dropZoneElement.classList.remove('light-theme');
        localStorage.setItem('jitterfx-theme-preview', 'dark');
    }
});




// Check for shared image from Web Share API
if (window.location.search.includes('shared=true')) {
    caches.open('jitterfx-shared').then(cache => {
        cache.match('/shared-image').then(response => {
            if (response) {
                response.blob().then(blob => {
                    handleFile(blob);
                    cache.delete('/shared-image');
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                });
            }
        });
    });
}

// Watermark UI listeners
wmBold.addEventListener('click', () => wmBold.classList.toggle('active'));
wmItalic.addEventListener('click', () => wmItalic.classList.toggle('active'));

