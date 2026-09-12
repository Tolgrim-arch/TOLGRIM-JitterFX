const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

// UI Elements
const imageInput = document.getElementById('imageInput');
const typeInput = document.getElementById('typeInput');
const amountInput = document.getElementById('amountInput');
const speedInput = document.getElementById('speedInput');
const framesInput = document.getElementById('framesInput');
const blockInput = document.getElementById('blockInput');
const exportBtn = document.getElementById('exportBtn');
const statusDiv = document.getElementById('status');

// Value Labels
const updateLabel = (id, val) => document.getElementById(id).innerText = val;
amountInput.addEventListener('input', e => updateLabel('amountVal', e.target.value));
speedInput.addEventListener('input', e => updateLabel('speedVal', e.target.value));
framesInput.addEventListener('input', e => updateLabel('framesVal', e.target.value));
blockInput.addEventListener('input', e => updateLabel('blockVal', e.target.value));
typeInput.addEventListener('input', renderManualFrameIfPaused);
amountInput.addEventListener('input', renderManualFrameIfPaused);
speedInput.addEventListener('input', renderManualFrameIfPaused);
framesInput.addEventListener('input', renderManualFrameIfPaused);
blockInput.addEventListener('input', renderManualFrameIfPaused);

function renderManualFrameIfPaused() {
    // If we're paused, we shouldn't care much, but it's handy
}

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
        } else {
            float freq = max(u_sketchy_blocksize, 1.0);
            float phaseX = rand(vec2(t, 1.0)) * 6.2831;
            float phaseY = rand(vec2(1.0, t)) * 6.2831;
            offset.x = sin(v_tex_coord.y * freq + phaseX) * u_sketchy_amount;
            offset.y = sin(v_tex_coord.x * freq + phaseY) * u_sketchy_amount;
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

const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Buffers
const posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,  1.0, -1.0,  -1.0,  1.0,
    -1.0,  1.0,  1.0, -1.0,   1.0,  1.0
]), gl.STATIC_DRAW);
const posLoc = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

const texBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 1.0,  1.0, 1.0,  0.0, 0.0,
    0.0, 0.0,  1.0, 1.0,  1.0, 0.0
]), gl.STATIC_DRAW);
const texLoc = gl.getAttribLocation(program, "a_texCoord");
gl.enableVertexAttribArray(texLoc);
gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

// Texture
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

// Uniforms
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
    
    gl.uniform1f(uTime, timeMs / 1000.0);
    gl.uniform1f(uSpeed, parseFloat(speedInput.value));
    gl.uniform1f(uAmount, parseFloat(amountInput.value));
    gl.uniform1f(uType, parseFloat(typeInput.value));
    gl.uniform1f(uFrames, parseFloat(framesInput.value));
    gl.uniform1f(uBlocksize, parseFloat(blockInput.value));

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    animationId = requestAnimationFrame(render);
}

// Draw a specific manual frame (for GIF export)
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
        statusDiv.innerText = "Imagen cargada. Previsualizando...";
        
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(render);
    };
    img.src = URL.createObjectURL(file);
});

exportBtn.addEventListener('click', () => {
    if (!currentImage) return;
    
    // Stop preview
    isExporting = true;
    if (animationId) cancelAnimationFrame(animationId);
    exportBtn.disabled = true;
    
    const framesCount = parseInt(framesInput.value);
    const speed = parseFloat(speedInput.value);
    
    statusDiv.innerText = `Generando ${framesCount} frames...`;
    
    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: 'gif.worker.js',
        width: canvas.width,
        height: canvas.height
    });

    for (let i = 0; i < framesCount; i++) {
        // Calculate the exact time `t` needed so that `floor(u_time * speed)` equals `i`
        // t * speed = i  => t = i / speed
        // Adding a slight offset to avoid floating point precision issues on floor()
        renderManualFrame((i + 0.1) / speed);
        
        // Convert webgl canvas to a 2D canvas frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);
        
        gif.addFrame(tempCanvas, { delay: 1000 / speed });
    }

    gif.on('finished', function(blob) {
        statusDiv.innerText = "¡GIF exportado!";
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jitterfx.gif';
        a.click();
        
        // Resume preview
        isExporting = false;
        exportBtn.disabled = false;
        animationId = requestAnimationFrame(render);
    });
    
    statusDiv.innerText = "Codificando GIF (procesando)...";
    gif.render();
});
