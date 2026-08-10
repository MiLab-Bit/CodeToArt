// engine.js — 粒子流场艺术引擎（核心渲染层）
import { defaultPalette } from './config.js';
import { hexToRgba, animateValue, regexAnalyze, flashPlaceholder } from './utils.js';

const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');
const placeholder = document.getElementById('placeholder');
const statsPanel = document.getElementById('statsPanel');
const actionBar = document.getElementById('actionBar');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const themeNameDisplay = document.getElementById('themeName');

// 引擎内部状态
const state = {
    isAnimating: false,
    animationId: null,
    particles: [],
    flowField: [],
    cols: 0,
    rows: 0,
    scale: 10,
    currentPalette: [...defaultPalette],
    currentTurbulence: 1.0,
    currentAbstraction: 8,
    dpr: window.devicePixelRatio || 1,
    currentStrokeScale: 1,
    lastGen: null
};

class Particle{
    constructor(w, h, analysis, paletteOverride){
        this.w = w; this.h = h; this.analysis = analysis;
        this.palette = paletteOverride || defaultPalette;
        this.reset();
    }
    reset(){
        this.x = Math.random() * this.w;
        this.y = Math.random() * this.h;
        this.pos = { x:this.x, y:this.y };
        this.vel = { x:0, y:0 };
        this.acc = { x:0, y:0 };
        this.maxSpeed = 2 + Math.random() * 2;
        this.prevPos = { x:this.x, y:this.y };
        const pLen = this.palette.length;
        const baseIdx = Math.max(0, Math.floor(Math.random() * Math.max(1, pLen - 3)));
        const accentIdx = Math.min(pLen - 1, Math.floor(Math.random() * 2 + pLen - 3));
        this.color = (Math.random() < 0.12) ? this.palette[accentIdx] : this.palette[baseIdx];
        if(!this.color) this.color = this.palette[Math.floor(Math.random() * pLen)] || '#ffffff';
        this.strokeWidth = (Math.random() * 3 + 1) * state.currentStrokeScale;
        this.life = Math.random() * 100 + 50;
    }
    update(flowField, cols){
        this.prevPos.x = this.pos.x; this.prevPos.y = this.pos.y;
        const x = Math.floor(this.pos.x / state.scale);
        const y = Math.floor(this.pos.y / state.scale);
        const index = x + y * cols;
        if(flowField[index]){
            const angle = flowField[index].angle;
            this.acc.x = Math.cos(angle); this.acc.y = Math.sin(angle);
        }
        this.vel.x += this.acc.x; this.vel.y += this.acc.y;
        const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        if(speed > this.maxSpeed){
            this.vel.x = (this.vel.x / speed) * this.maxSpeed;
            this.vel.y = (this.vel.y / speed) * this.maxSpeed;
        }
        this.pos.x += this.vel.x; this.pos.y += this.vel.y;
        this.acc.x = 0; this.acc.y = 0; this.life--;
        if(this.pos.x > this.w || this.pos.x < 0 || this.pos.y > this.h || this.pos.y < 0 || this.life < 0) this.reset();
    }
    show(ctx){
        ctx.beginPath();
        ctx.lineWidth = this.strokeWidth;
        ctx.strokeStyle = this.color;
        ctx.lineCap = 'round';
        ctx.moveTo(this.prevPos.x, this.prevPos.y);
        ctx.lineTo(this.pos.x, this.pos.y);
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

function initFlowField(analysis, w, h, turb = 1.0){
    state.flowField = [];
    state.cols = Math.floor(w / state.scale) + 1;
    state.rows = Math.floor(h / state.scale) + 1;
    for(let y = 0; y < state.rows; y++){
        for(let x = 0; x < state.cols; x++){
            const index = x + y * state.cols;
            let angle = (x / state.cols) * Math.PI + (y / state.rows) * 0.5;
            analysis.seeds.forEach(seed => {
                const seedY = seed.y * state.rows;
                const seedX = (seed.y * 12345 % state.cols);
                const dx = x - seedX, dy = y - seedY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const radius = (seed.type === 'star') ? 15 : 20;
                if(dist < radius){
                    if(seed.type === 'star'){ angle = Math.atan2(dy, dx) + Math.PI / 2; }
                    else if(seed.type === 'swirl'){ angle = Math.atan2(dy, dx) + dist * 0.2 * turb; }
                    else if(seed.type === 'break'){ angle += (Math.random() * 2 - 1) * turb; }
                }
            });
            angle += Math.sin(x * 0.1) + Math.cos(y * 0.1);
            state.flowField[index] = { angle };
        }
    }
}

function resizeCanvas(){
    const container = document.getElementById('canvasWrap');
    const cw = container.clientWidth, ch = container.clientHeight;
    state.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cw * state.dpr);
    canvas.height = Math.floor(ch * state.dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function getCssSize(){ return { w: canvas.clientWidth, h: canvas.clientHeight }; }

let resizeTimer;
function onResize(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if(!state.lastGen){ resizeCanvas(); return; }
        resizeCanvas();
        const { w, h } = getCssSize();
        initCanvasAndParticles(state.lastGen.analysis, state.lastGen.count, state.lastGen.turbulence, state.lastGen.palette, w, h);
    }, 200);
}

function initCanvasAndParticles(analysis, count, turb, pal, w, h){
    w = (w !== undefined) ? w : canvas.clientWidth;
    h = (h !== undefined) ? h : canvas.clientHeight;
    ctx.fillStyle = pal[0];
    ctx.fillRect(0, 0, w, h);
    initFlowField(analysis, w, h, turb);
    state.particles = [];
    for(let i = 0; i < count; i++) state.particles.push(new Particle(w, h, analysis, pal));
    drawStars(analysis, pal, w, h);
}

function drawStars(analysis, pal, w, h){
    const starColor = pal[pal.length - 2] || '#fff';
    analysis.seeds.filter(s => s.type === 'star').forEach(seed => {
        const x = (seed.y * 12345 % state.cols) * state.scale;
        const y = seed.y * h;
        const g = ctx.createRadialGradient(x, y, 5, x, y, 60);
        g.addColorStop(0, hexToRgba(starColor, 0.9));
        g.addColorStop(0.4, hexToRgba(pal[pal.length - 3] || starColor, 0.4));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.fill();
    });
}

function animate(){
    if(!state.isAnimating) return;
    for(const p of state.particles){ p.update(state.flowField, state.cols); p.show(ctx); }
    state.animationId = requestAnimationFrame(animate);
}

function updateStats(analysis){
    animateValue('funcCount', 0, analysis.functions, 1000);
    animateValue('loopCount', 0, analysis.loops, 1000);
    animateValue('branchCount', 0, analysis.branches, 1000);
    animateValue('entropyVal', 0, analysis.entropy, 1000);
}

/* ---------- 对外 API ---------- */
export function initEngine(){
    addEventListener('resize', onResize);
    resizeCanvas();
}

export async function generate(code){
    code = code || '';
    if(!code.trim()){ flashPlaceholder(); return null; }
    if(state.animationId) cancelAnimationFrame(state.animationId);
    state.isAnimating = false;
    placeholder.style.opacity = '0';
    setTimeout(() => placeholder.style.display = 'none', 500);
    statsPanel.classList.add('translate-x-full', 'opacity-0');
    loadingOverlay.classList.remove('hidden');

    const analysis = regexAnalyze(code);
    resizeCanvas();
    const { w, h } = getCssSize();
    const absNorm = (state.currentAbstraction - 1) / 9;
    state.currentStrokeScale = 0.6 + absNorm * 0.8;
    loadingText.innerText = '炼金中…';

    return new Promise(resolve => {
        setTimeout(() => {
            state.currentPalette = defaultPalette;
            state.currentTurbulence = 0.5 + absNorm * 2.0;
            themeNameDisplay.innerText = '炼金术';
            const count = Math.round(1500 + absNorm * 2500);
            initCanvasAndParticles(analysis, count, state.currentTurbulence, defaultPalette, w, h);
            state.lastGen = { analysis, count, turbulence: state.currentTurbulence, palette: defaultPalette };
            loadingOverlay.classList.add('hidden');
            updateStats(analysis);
            statsPanel.classList.remove('translate-x-full', 'opacity-0');
            actionBar.classList.remove('opacity-0', 'translate-y-4');
            state.isAnimating = true;
            animate();
            resolve(analysis);
        }, 500);
    });
}

export function recolorWithPalette(pal){
    if(!state.lastGen) return;
    state.currentPalette = pal;
    themeNameDisplay.innerText = '塔罗之色';
    initCanvasAndParticles(state.lastGen.analysis, state.lastGen.count, state.lastGen.turbulence, pal);
    state.lastGen = { ...state.lastGen, palette: pal };
}

export function downloadArt(){
    const link = document.createElement('a');
    link.download = `code-art-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

export function toggleAnimation(){
    state.isAnimating = !state.isAnimating;
    const icon = document.getElementById('pauseIcon');
    const text = document.getElementById('pauseText');
    if(state.isAnimating){ animate(); icon.className = 'fas fa-pause'; text.innerText = '暂停'; }
    else { cancelAnimationFrame(state.animationId); icon.className = 'fas fa-play'; text.innerText = '继续'; }
}

export function setAbstraction(n){ state.currentAbstraction = parseInt(n, 10) || 8; }
export function getAnalysis(){ return state.lastGen ? state.lastGen.analysis : null; }
export function getLastGen(){ return state.lastGen; }
export function hasArt(){ return !!state.lastGen; }
