// main.js — 应用编排：初始化各层并连接 DOM 事件
import { initStarfield } from './starfield.js';
import { initEngine, generate, downloadArt, toggleAnimation, setAbstraction, hasArt } from './engine.js';
import { initInput, getCurrentCode } from './input.js';
import { initRealm, enterRealm } from './tarot.js';
import { oracleSettings, saveSettings, loadExample } from './config.js';

function boot(){
    // 渲染层
    initStarfield();
    initEngine();
    initInput();
    initRealm();

    // 生成
    document.getElementById('generateBtn').addEventListener('click', () => generate(getCurrentCode()));

    // 抽象程度滑块
    const abstractionRange = document.getElementById('abstractionRange');
    const abstractionVal = document.getElementById('abstractionVal');
    abstractionRange.addEventListener('input', e => {
        const v = parseInt(e.target.value, 10) || 8;
        setAbstraction(v);
        abstractionVal.innerText = v;
    });

    // 画布点击 / 进入幻境
    document.getElementById('canvasWrap').addEventListener('click', () => { if(hasArt()) enterRealm(); });
    document.getElementById('enterRealmBtn').addEventListener('click', () => { if(hasArt()) enterRealm(); });

    // 收藏 / 暂停
    document.getElementById('downloadBtn').addEventListener('click', downloadArt);
    document.getElementById('pauseBtn').addEventListener('click', toggleAnimation);

    // 示例
    document.getElementById('exampleHello').addEventListener('click', () => loadExample('hello'));
    document.getElementById('exampleChaos').addEventListener('click', () => loadExample('chaos'));

    // 灵媒设置
    const settingsModal = document.getElementById('settingsModal');
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('apiKey').value = oracleSettings.key;
        document.getElementById('apiBase').value = oracleSettings.base;
        document.getElementById('apiModel').value = oracleSettings.model;
        settingsModal.style.display = 'flex';
    });
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        saveSettings(
            document.getElementById('apiKey').value,
            document.getElementById('apiBase').value,
            document.getElementById('apiModel').value
        );
        settingsModal.style.display = 'none';
    });
    document.getElementById('closeSettingsBtn').addEventListener('click', () => { settingsModal.style.display = 'none'; });
    document.getElementById('cancelSettingsBtn').addEventListener('click', () => { settingsModal.style.display = 'none'; });
}

if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
