// starfield.js — 背景星空（独立渲染层）
export function initStarfield(){
    const cv = document.getElementById('starfield');
    const ctx = cv.getContext('2d');
    let stars = [];

    function resize(){
        cv.width = innerWidth;
        cv.height = innerHeight;
        stars = Array.from({ length: Math.min(220, Math.floor(innerWidth * innerHeight / 9000)) }, () => ({
            x: Math.random() * cv.width,
            y: Math.random() * cv.height,
            r: Math.random() * 1.4 + 0.2,
            a: Math.random(),
            s: Math.random() * 0.02 + 0.004
        }));
    }

    function tick(){
        ctx.clearRect(0, 0, cv.width, cv.height);
        for(const st of stars){
            st.a += st.s;
            const tw = 0.5 + 0.5 * Math.sin(st.a);
            ctx.globalAlpha = tw * 0.9;
            ctx.fillStyle = tw > 0.7 ? '#f4d58d' : '#b39ddb';
            ctx.beginPath();
            ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(tick);
    }

    addEventListener('resize', resize);
    resize();
    tick();
}
