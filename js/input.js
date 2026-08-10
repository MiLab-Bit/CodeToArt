// input.js — 多源代码输入：粘贴 / 上传 / GitHub 仓库
const codeInput = document.getElementById('codeInput');
let seedLabel = '';

export function getCurrentCode(){ return codeInput.value; }
export function getSeedLabel(){ return seedLabel; }

export function initInput(){
    // 输入模式切换
    document.querySelectorAll('.src-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.src-tab').forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');
            const mode = tab.dataset.mode;
            ['paste', 'upload', 'repo'].forEach(m => {
                document.getElementById('mode-' + m).classList.toggle('hidden', m !== mode);
            });
        });
    });

    initUpload();
    initRepo();
}

/* ---------- 上传本地文件 ---------- */
function initUpload(){
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const uploadName = document.getElementById('uploadName');

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => { if(e.target.files[0]) readFile(e.target.files[0]); });
    ['dragover', 'dragenter'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
    dropzone.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if(f) readFile(f); });

    function readFile(file){
        const reader = new FileReader();
        reader.onload = () => {
            codeInput.value = reader.result;
            uploadName.innerText = '已载入：' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
            seedLabel = file.name;
        };
        reader.readAsText(file);
    }
}

/* ---------- 解析 GitHub 仓库 ---------- */
function initRepo(){
    const repoInput = document.getElementById('repoInput');
    const repoStatus = document.getElementById('repoStatus');
    document.getElementById('repoFetchBtn').addEventListener('click', fetchRepo);
    repoInput.addEventListener('keydown', e => { if(e.key === 'Enter') fetchRepo(); });

    async function fetchRepo(){
        const raw = repoInput.value.trim();
        if(!raw){ repoStatus.innerText = '请输入仓库地址'; return; }
        const m = raw.match(/github\.com\/([^\/\s?#]+)\/([^\/\s?#]+)/);
        if(!m){ repoStatus.innerText = '无法识别 GitHub 仓库地址'; return; }
        const owner = m[1];
        const repo = m[2].replace(/\.git$/, '');
        repoStatus.innerText = '连接星界网关…';
        try{
            const info = await fetch(`https://api.github.com/repos/${owner}/${repo}`).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); });
            const branch = info.default_branch || 'main';
            const tree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`).then(r => r.json());
            const codeExt = ['.py','.js','.ts','.jsx','.tsx','.java','.go','.rs','.c','.cpp','.h','.rb','.php','.json','.html','.css','.md','.sql','.sh','.vue'];
            const files = (tree.tree || [])
                .filter(t => t.type === 'blob' && codeExt.some(e => t.path.endsWith(e)) && !/(node_modules|\.git\/|dist\/|build\/|vendor\/)/.test(t.path))
                .sort((a, b) => (b.size || 0) - (a.size || 0))
                .slice(0, 10);
            if(!files.length){ repoStatus.innerText = '仓库中未找到代码文件'; return; }
            repoStatus.innerText = '汲取代码星火 (' + files.length + ' 个文件)…';
            const collected = [];
            let total = 0;
            for(const f of files){
                if(total > 24000) break;
                const content = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${f.path}?ref=${branch}`).then(r => r.json());
                if(content && content.content){
                    const text = decodeURIComponent(escape(atob(content.content.replace(/\n/g, ''))));
                    collected.push('// === ' + f.path + ' ===\n' + text);
                    total += text.length;
                }
            }
            codeInput.value = collected.join('\n\n');
            seedLabel = repo + '@' + branch;
            repoStatus.innerText = '已解析 ' + files.length + ' 个文件，共 ' + total + ' 字符。点击「凝炼艺术画」。';
        }catch(err){
            repoStatus.innerText = '解析失败：' + (err.message || err) + '（可能触发 GitHub API 速率限制）';
        }
    }
}
