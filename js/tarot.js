// tarot.js — 命运幻境：塔罗三牌阵 + 灵媒解析
import { TAROT, SPREAD, oracleSettings } from './config.js';
import { getAnalysis, getLastGen, hasArt, recolorWithPalette } from './engine.js';
import { getCurrentCode } from './input.js';
import { escapeHtml, flashPlaceholder } from './utils.js';

const realm = document.getElementById('realm');
const tarotStage = document.getElementById('tarotStage');
const readingPanel = document.getElementById('readingPanel');
const drawBtn = document.getElementById('drawBtn');
const revealBtn = document.getElementById('revealBtn');
const recolorBtn = document.getElementById('recolorBtn');
let drawnCards = [];

export function initRealm(){
    drawBtn.addEventListener('click', drawCards);
    revealBtn.addEventListener('click', revealReading);
    recolorBtn.addEventListener('click', recolorWithTarot);
    document.getElementById('closeRealmBtn').addEventListener('click', closeRealm);
}

export function enterRealm(){
    if(!hasArt()){ flashPlaceholder(); return; }
    realm.style.display = 'flex';
    tarotStage.innerHTML = '';
    readingPanel.innerHTML = '';
    setReveal(false);
    drawnCards = [];
    drawCards();
}
export function closeRealm(){ realm.style.display = 'none'; }

function drawCards(){
    tarotStage.innerHTML = '';
    drawnCards = [];
    const pool = [...TAROT];
    for(let i = 0; i < 3; i++){
        const idx = Math.floor(Math.random() * pool.length);
        drawnCards.push(pool.splice(idx, 1)[0]);
    }
    drawnCards.forEach((card, i) => {
        const el = document.createElement('div');
        el.className = 'tarot-card';
        el.innerHTML = `
            <div class="tarot-inner">
                <div class="tarot-face tarot-back flex flex-col items-center justify-center">
                    <i class="fas fa-moon text-amber-300/80 text-2xl mb-2"></i>
                    <span class="font-display text-xs text-purple-200/70 tracking-widest">${SPREAD[i]}</span>
                </div>
                <div class="tarot-face tarot-front" style="border-color:${card.color}88; box-shadow:0 0 28px ${card.color}55;">
                    <div class="tarot-icon">${card.icon}</div>
                    <div class="tarot-name">${card.n}</div>
                    <div class="tarot-en">${card.en}</div>
                    <div class="tarot-key">${card.energy}</div>
                </div>
            </div>`;
        tarotStage.appendChild(el);
        setTimeout(() => el.classList.add('flipped'), 350 + i * 350);
    });
    setTimeout(() => setReveal(true), 350 + 3 * 350 + 200);
}

function setReveal(on){
    revealBtn.disabled = !on;
    recolorBtn.disabled = !on;
    revealBtn.classList.toggle('opacity-40', !on);
    revealBtn.classList.toggle('pointer-events-none', !on);
    recolorBtn.classList.toggle('opacity-40', !on);
    recolorBtn.classList.toggle('pointer-events-none', !on);
}

function tarotPalette(cards){
    const base = cards.map(c => c.color);
    const extra = ['#0f0a1f', '#2a1a4a', '#533483', '#e94560', '#f4d03f', '#8ca6d9'];
    const pal = [...base];
    let i = 0;
    while(pal.length < 7){ pal.push(extra[i % extra.length]); i++; }
    return pal;
}

function recolorWithTarot(){
    if(!getLastGen()) return;
    recolorWithPalette(tarotPalette(drawnCards));
}

async function revealReading(){
    if(!drawnCards.length) return;
    const analysis = getAnalysis();
    readingPanel.innerHTML = '<div class="flex items-center gap-2 text-amber-300"><div class="loader" style="width:18px;height:18px;border-width:2px"></div> 灵媒正在凝视代码与牌阵…</div>';
    let aiText = null;
    if(oracleSettings.key){ aiText = await callOracle(analysis, drawnCards); }
    const local = generateLocalReading(analysis, drawnCards);
    const finalHtml = aiText
        ? `<div class="reading-section"><h4>✦ 灵媒的低语（AI）</h4><div>${escapeHtml(aiText)}</div></div>` + local
        : local;
    readingPanel.innerHTML = finalHtml;
    readingPanel.classList.remove('fade-in');
    void readingPanel.offsetWidth;
    readingPanel.classList.add('fade-in');
}

async function callOracle(analysis, cards){
    const spread = cards.map((c, i) => `${SPREAD[i]}：${c.n}（${c.energy}）— ${c.up}`).join('\n');
    const snippet = getCurrentCode().slice(0, 1500);
    const prompt = `你是一位结合塔罗神秘学与代码审美的「灵媒」。
请基于以下三牌阵与代码结构，给出一段富有神秘学气息的中文代码 review 与解析（300字内，分点、诗意、可操作）。

三牌阵：
${spread}

代码结构指标：函数 ${analysis.functions}，循环 ${analysis.loops}，分支 ${analysis.branches}，熵能 ${analysis.entropy}/100。

代码（节选）：
\`\`\`
${snippet}
\`\`\``;
    try{
        const res = await fetch(`${oracleSettings.base.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + oracleSettings.key },
            body: JSON.stringify({
                model: oracleSettings.model,
                messages: [
                    { role: 'system', content: '你是神秘学代码占卜师，用中文回答。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.9
            })
        });
        if(!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return (data.choices && data.choices[0] && data.choices[0].message.content) || null;
    }catch(e){
        console.warn('Oracle API failed, fallback to local:', e);
        return null;
    }
}

function generateLocalReading(analysis, cards){
    const positions = [
        { pos: SPREAD[0], c: cards[0] },
        { pos: SPREAD[1], c: cards[1] },
        { pos: SPREAD[2], c: cards[2] }
    ];
    let html = '<div class="reading-section"><h4>✦ 三牌阵 · 代码命运</h4>';
    positions.forEach(p => {
        html += `<p class="mb-1"><span class="text-amber-300 font-display">${p.pos}</span> · <b>${p.c.icon} ${p.c.n}</b>（${p.c.energy}）<br><span class="text-purple-200/80 text-[13px]">${p.c.up}</span></p>`;
    });
    html += '</div>';

    let struct;
    if(analysis.functions === 0 && analysis.loops === 0) struct = '此代码尚无一法一循环，如太初之卵，静待破壳之念。';
    else if(analysis.entropy >= 70) struct = '熵能汹涌（' + analysis.entropy + '），逻辑如星暴般纷繁，暗藏混沌之力，亦藏惊人之美。';
    else if(analysis.entropy <= 25) struct = '熵能清浅（' + analysis.entropy + '），结构澄明如镜，宜守其简。';
    else struct = '熵能中和（' + analysis.entropy + '），刚柔相济，是可塑之器。';
    html += `<div class="reading-section"><h4>✦ 代码结构占卜</h4><p>${struct}</p>`;
    html += `<p class="text-[13px] text-purple-200/80">函数 ${analysis.functions} · 循环 ${analysis.loops} · 分支 ${analysis.branches}。${adviceLine(analysis)}</p></div>`;

    const fortunes = ['大吉 · 灵光乍现', '中平 · 静水流深', '需谨慎 · 暗流潜涌'];
    const luck = fortunes[(analysis.entropy + cards[0].n.length + cards[2].energy.length) % 3];
    const combined = cards.map(c => c.energy).join('、');
    html += `<div class="reading-section"><h4>✦ 综合解析</h4><p>三牌能量「${combined}」交织于你的代码气场。`;
    html += ` ${cards[1].n}昭示当下：当以「${cards[1].energy}」之心面对此代码——${cards[1].up}</p>`;
    html += `<p class="mt-1 text-[13px] text-amber-200/80">运势评级：<b>${luck}</b></p></div>`;

    return html;
}

function adviceLine(a){
    const tips = [];
    if(a.functions > 12) tips.push('函数繁若星辰，宜归并同类以安神明');
    if(a.loops > 8) tips.push('循环如轮回，宜抽离为函数以息妄念');
    if(a.branches > 10) tips.push('分支交错成迷宫，宜以查表或策略化简');
    if(a.entropy > 70) tips.push('混沌之中藏力，宜补注释以引后来者');
    if(!tips.length) tips.push('结构已和，且饮一杯清茶');
    return tips.join('；') + '。';
}
