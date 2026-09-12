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
const pingpongInput = document.getElementById('pingpongInput');
const resolutionInput = document.getElementById('resolutionInput');
const exportEstimate = document.getElementById('exportEstimate');

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
    let w = currentImage.width;
    let h = currentImage.height;
    let max = resolutionInput.value;
    if (max !== 'original') {
        let maxDim = parseInt(max);
        let largest = Math.max(w, h);
        if (largest > maxDim) {
            let ratio = maxDim / largest;
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }
    }
    return { w, h };
}

function updateEstimate() {
    if (!currentImage) return;
    const { w, h } = getTargetDimensions();
    const framesCount = parseInt(framesInput.value);
    const totalFrames = pingpongInput.checked ? (framesCount * 2 - 2) : framesCount;
    
    // Heuristic: GIF ~0.1 bytes/pixel, WebM ~0.02 bytes/pixel
    const pixels = w * h * totalFrames;
    const gifMb = (pixels * 0.1) / (1024 * 1024);
    const webmMb = (pixels * 0.02) / (1024 * 1024);
    
    exportEstimate.innerHTML = `Resolución Final: <strong>${w}x${h} px</strong><br>
    Estimación: <strong>~${gifMb.toFixed(1)} MB</strong> (GIF) / <strong>~${webmMb.toFixed(1)} MB</strong> (Video)`;
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
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

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
    targetCtx.drawImage(webglCanvas, 0, 0);
    
    // Draw Watermark
    if (watermarkInput.value.trim() !== '') {
        const text = watermarkInput.value.trim();
        const fontSize = Math.max(16, Math.floor(height * 0.035));
        targetCtx.font = `bold ${fontSize}px sans-serif`;
        targetCtx.textAlign = 'right';
        targetCtx.textBaseline = 'bottom';
        
        targetCtx.lineWidth = Math.max(2, fontSize * 0.15);
        targetCtx.strokeStyle = '#000000';
        targetCtx.strokeText(text, width - 20, height - 20);
        
        targetCtx.fillStyle = '#ffffff';
        targetCtx.fillText(text, width - 20, height - 20);
    }
}

function render(timeMs) {
    if (!currentImage || isExporting) return;
    
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
    statusDiv.innerText = `Generando GIF (${w}x${h} - ${totalFrames} frames)...`;
    
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
        statusDiv.innerText = `Codificando GIF... ${Math.round(p * 100)}%`;
    });

    gif.on('finished', function(blob) {
        statusDiv.innerText = "Ã‚Â¡GIF exportado!";
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jitterfx.gif';
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
    statusDiv.innerText = `Grabando Video (${w}x${h} - ${totalFrames} frames)...`;
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const exportCtx = exportCanvas.getContext('2d');
    
    const stream = exportCanvas.captureStream(speed);
    
    let options = { mimeType: 'video/webm; codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
    }
    
    const mediaRecorder = new MediaRecorder(stream, options);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jitterfx.webm';
        a.click();
        
        statusDiv.innerText = 'Ã‚Â¡Video exportado con Matte/Watermark!';
        disableExport(false);
    };
    
    mediaRecorder.start();
    
    for (let i = 0; i < totalFrames; i++) {
        drawFinalFrameToContext(exportCtx, w, h, i, framesCount);
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
    typeInput.disabled = false;
    amountInput.disabled = false;
    speedInput.disabled = false;
    framesInput.disabled = false;
    blockInput.disabled = false;
    bgPreset.disabled = false;
    watermarkInput.disabled = false;
    pingpongInput.disabled = false;
    resolutionInput.disabled = false;
    exportBtn.disabled = false;
    exportWebmBtn.disabled = false;
    emptyState.style.display = 'none';
    canvas.style.display = 'block';
    updateEstimate();
}

function handleFile(file) {
    const img = new Image();
    img.onload = () => {
        currentImage = img;
        
        webglCanvas.width = img.width;
        webglCanvas.height = img.height;
        canvas.width = img.width;
        canvas.height = img.height;
        
        gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        enableControls();
        statusDiv.innerText = 'Imagen cargada. Previsualizando...';
        
        let mbSize = (file.size / (1024 * 1024)).toFixed(2);
        let kbSize = (file.size / 1024).toFixed(1);
        let displaySize = file.size > 1024 * 1024 ? `${mbSize} MB` : `${kbSize} KB`;
        imageInfo.innerHTML = `<strong>Res:</strong> ${img.width}x${img.height} px &nbsp;|&nbsp; <strong>Peso:</strong> ${displaySize}`;
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




