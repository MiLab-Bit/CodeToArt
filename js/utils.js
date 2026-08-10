// utils.js — 纯函数与共享小工具

// 代码分析引擎：将文本转为结构指标 + 星点种子
export function regexAnalyze(code){
    const functions = (code.match(/def\s+\w+|function\s+\w+|class\s+\w+|=>\s*[{]/g) || []).length;
    const loops = (code.match(/\b(for|while)\b/g) || []).length;
    const branches = (code.match(/\b(if|elif|else if|else)\b/g) || []).length;
    const length = code.length;
    const entropy = Math.min(Math.round(functions*2 + loops*3 + branches + length/120), 100);
    const seeds = [];
    const lines = code.split('\n');
    lines.forEach((line, i) => {
        const y = i / Math.max(1, lines.length);
        if (/def\s+\w+|function\s+\w+|class\s+\w+/.test(line)) seeds.push({type:'star', y});
        if (/\b(for|while)\b/.test(line)) seeds.push({type:'swirl', y});
        if (/\b(if|elif|else)\b/.test(line)) seeds.push({type:'break', y});
    });
    return { functions, loops, branches, entropy, seeds, length };
}

// #hex -> rgba()
export function hexToRgba(hex, a){
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c = hex.substring(1).split('');
        if(c.length === 3) c = [c[0],c[0],c[1],c[1],c[2],c[2]];
        c = '0x' + c.join('');
        return 'rgba(' + [(c>>16)&255, (c>>8)&255, c&255].join(',') + ',' + a + ')';
    }
    return 'rgba(255,255,255,' + a + ')';
}

export function escapeHtml(s){
    return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

// 数字滚动动画
export function animateValue(id, start, end, duration){
    if(start === end){ document.getElementById(id).innerText = end; return; }
    const obj = document.getElementById(id);
    const range = end - start;
    let cur = start;
    const inc = end > start ? 1 : -1;
    const step = Math.max(50, Math.abs(Math.floor(duration / range)));
    const t = setInterval(() => {
        cur += inc;
        obj.innerText = cur;
        if(cur === end) clearInterval(t);
    }, step);
}

// 占位提示闪烁
export function flashPlaceholder(){
    const placeholder = document.getElementById('placeholder');
    placeholder.style.display = 'flex';
    placeholder.style.opacity = '1';
    placeholder.querySelector('p').innerText = '请先献上代码';
    setTimeout(() => { placeholder.querySelector('p').innerHTML = '凝炼成画 · 点击画作坠入幻境'; }, 1200);
}
