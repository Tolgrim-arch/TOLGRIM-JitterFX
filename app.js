const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: true });

// UI Elements
const imageInput = document.getElementById('imageInput');
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
    precision mediump float;
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

function render(timeMs) {
    if (!currentImage || isExporting) return;
    renderManualFrame(timeMs / 1000.0);
    animationId = requestAnimationFrame(render);
}

function renderManualFrame(t) {
    gl.uniform1f(uTime, t);
    gl.uniform1f(uSpeed, parseFloat(speedInput.value));
    gl.uniform1f(uAmount, parseFloat(amountInput.value));
    gl.uniform1f(uType, parseFloat(typeInput.value));
    gl.uniform1f(uFrames, parseFloat(framesInput.value));
    gl.uniform1f(uBlocksize, parseFloat(blockInput.value));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        currentImage = img;
        canvas.width = img.width;
        canvas.height = img.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        exportBtn.disabled = false;
        exportWebmBtn.disabled = false;
        statusDiv.innerText = "Imagen cargada. Previsualizando...";
        
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(render);
    };
    img.src = URL.createObjectURL(file);
});

// Final draw to composed canvas for export
function drawFinalFrameToContext(ctx, width, height, frameIndex, framesCount) {
    const speed = parseFloat(speedInput.value);
    const isPingPong = pingpongInput.checked;
    
    let t = frameIndex;
    if (isPingPong && frameIndex >= framesCount) {
        t = (framesCount - 1) - (frameIndex - framesCount + 1);
    }
    
    // Draw shader to WebGL canvas
    renderManualFrame((t + 0.1) / speed);
    
    // Draw background
    if (bgPreset.value !== 'transparent') {
        ctx.fillStyle = bgPreset.value === 'custom' ? bgColorPicker.value : bgPreset.value;
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.clearRect(0, 0, width, height);
    }
    
    // Draw WebGL canvas
    ctx.drawImage(canvas, 0, 0);
    
    // Draw Watermark
    if (watermarkInput.value.trim() !== '') {
        const text = watermarkInput.value.trim();
        const fontSize = Math.max(16, Math.floor(height * 0.035));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        ctx.lineWidth = Math.max(2, fontSize * 0.15);
        ctx.strokeStyle = '#000000';
        ctx.strokeText(text, width - 20, height - 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, width - 20, height - 20);
    }
}

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
    
    statusDiv.innerText = `Generando GIF (${totalFrames} frames)...`;
    
    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: 'gif.worker.js',
        width: canvas.width,
        height: canvas.height
    });

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    for (let i = 0; i < totalFrames; i++) {
        drawFinalFrameToContext(tempCtx, canvas.width, canvas.height, i, framesCount);
        gif.addFrame(tempCtx, { delay: 1000 / speed, copy: true });
    }

    gif.on('finished', function(blob) {
        statusDiv.innerText = "¡GIF exportado!";
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
    
    statusDiv.innerText = `Grabando Video (${totalFrames} frames)...`;
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
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
        
        statusDiv.innerText = '¡Video exportado con Matte/Watermark!';
        disableExport(false);
    };
    
    mediaRecorder.start();
    
    for (let i = 0; i < totalFrames; i++) {
        drawFinalFrameToContext(exportCtx, canvas.width, canvas.height, i, framesCount);
        await new Promise(r => setTimeout(r, delayMs));
    }
    
    // Capture an extra frame at the end to ensure the last frame registers in the video
    await new Promise(r => setTimeout(r, 50)); 
    mediaRecorder.stop();
});
