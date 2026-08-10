// config.js — 常量、灵媒设置、示例
// 塔罗大阿尔克那牌库（22 张）
export const TAROT = [
    {n:'愚者', en:'The Fool', icon:'🃏', color:'#f6c177', energy:'启程', up:'纯真无畏的开端，放手一搏便有奇遇。'},
    {n:'魔术师', en:'The Magician', icon:'🪄', color:'#c4a7e7', energy:'显化', up:'万物皆可为工具，意志即魔法。'},
    {n:'女祭司', en:'The High Priestess', icon:'🌙', color:'#9bb4d4', energy:'直觉', up:'静默中藏真理，倾听内在之声。'},
    {n:'皇后', en:'The Empress', icon:'👑', color:'#e0a3c0', energy:'丰饶', up:'滋养与创造，繁茂自温柔而生。'},
    {n:'皇帝', en:'The Emperor', icon:'♔', color:'#d98c6a', energy:'秩序', up:'结构立根基，权威成方圆。'},
    {n:'教皇', en:'The Hierophant', icon:'🔑', color:'#caa46a', energy:'传承', up:'遵循范式，旧智引新路。'},
    {n:'恋人', en:'The Lovers', icon:'💞', color:'#e89ab0', energy:'联结', up:'关键抉择，心意相印则通。'},
    {n:'战车', en:'The Chariot', icon:'🛞', color:'#7fb0d6', energy:'意志', up:'驾驭对立，勇往直前破局。'},
    {n:'力量', en:'Strength', icon:'🦁', color:'#e6b35a', energy:'柔韧', up:'以柔克刚，耐心即是力量。'},
    {n:'隐者', en:'The Hermit', icon:'🏮', color:'#b9a7e0', energy:'内省', up:'独处见光，自照方明。'},
    {n:'命运之轮', en:'Wheel of Fortune', icon:'🎡', color:'#d6c177', energy:'流转', up:'循环往复，时机自有定数。'},
    {n:'正义', en:'Justice', icon:'⚖', color:'#9fd6c0', energy:'平衡', up:'因果分明，公正得安宁。'},
    {n:'倒吊人', en:'The Hanged Man', icon:'🔻', color:'#8fb3d6', energy:'转念', up:'换个视角，停顿即顿悟。'},
    {n:'死神', en:'Death', icon:'💀', color:'#a088a8', energy:'蜕变', up:'旧形散去，新生方临。'},
    {n:'节制', en:'Temperance', icon:'🏺', color:'#8fd0d6', energy:'调和', up:'冷暖相济，中庸致久。'},
    {n:'恶魔', en:'The Devil', icon:'😈', color:'#c47a7a', energy:'束缚', up:'执念成锁，觉知即解。'},
    {n:'高塔', en:'The Tower', icon:'⚡', color:'#e0795a', energy:'剧变', up:'伪厦崩塌，真相显露。'},
    {n:'星星', en:'The Star', icon:'⭐', color:'#9fb8e6', energy:'希望', up:'暗夜之后，灵感如星河倾落。'},
    {n:'月亮', en:'The Moon', icon:'🌕', color:'#b0a7d6', energy:'幻象', up:'迷雾弥漫，辨清虚妄。'},
    {n:'太阳', en:'The Sun', icon:'☀', color:'#f4d58d', energy:'圆满', up:'光明朗照，万物可喜。'},
    {n:'审判', en:'Judgement', icon:'📯', color:'#c9b6e6', energy:'觉醒', up:'回音召唤，重整再出发。'},
    {n:'世界', en:'The World', icon:'🌍', color:'#8fd6a8', energy:'圆满', up:'周行不殆，轮回成圆。'}
];

// 三牌阵位
export const SPREAD = ['过去 · 因', '现在 · 相', '未来 · 果'];

// 默认艺术调色板
export const defaultPalette = ['#1a1a2e','#16213e','#0f3460','#533483','#e94560','#f4d03f','#f2a365','#8ca6d9','#ececec'];

// 灵媒设置（localStorage，可选）—— 导出的对象为可变实时绑定
export const oracleSettings = {
    key: localStorage.getItem('cta_key') || '',
    base: localStorage.getItem('cta_base') || 'https://api.openai.com/v1',
    model: localStorage.getItem('cta_model') || 'gpt-4o-mini'
};

export function saveSettings(key, base, model){
    oracleSettings.key = (key || '').trim();
    oracleSettings.base = (base || '').trim() || 'https://api.openai.com/v1';
    oracleSettings.model = (model || '').trim() || 'gpt-4o-mini';
    localStorage.setItem('cta_key', oracleSettings.key);
    localStorage.setItem('cta_base', oracleSettings.base);
    localStorage.setItem('cta_model', oracleSettings.model);
}

// 示例代码片段
export function loadExample(type){
    const codeInput = document.getElementById('codeInput');
    if(type === 'hello'){
        codeInput.value = `print("Hello World")\ndef main():\n    msg = "Art is Logic"\n    print(msg)`;
    } else {
        codeInput.value = `import random\ndef chaos_engine():\n    while True:\n        if random.random() > 0.5:\n            branch_left()\n        else:\n            branch_right()\n\ndef branch_left():\n    return "entropy"`;
    }
}
