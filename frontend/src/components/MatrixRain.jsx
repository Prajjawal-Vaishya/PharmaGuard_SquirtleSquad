import { useEffect, useRef } from 'react';

const CHARS = 'ACGTACGTACGTΔΨΩΣ01010101ATCG';

export default function MatrixRain() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animId;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const fontSize = 13;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(0).map(() => Math.random() * -50);

        const draw = () => {
            ctx.fillStyle = 'rgba(5, 5, 5, 0.12)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00F2AD';
            ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = CHARS[Math.floor(Math.random() * CHARS.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Fading effect — brighter at bottom
                const alpha = Math.min(1, Math.max(0.15, drops[i] / (canvas.height / fontSize)));
                ctx.globalAlpha = alpha;
                ctx.fillText(char, x, y);

                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i] += 0.6 + Math.random() * 0.4;
            }

            ctx.globalAlpha = 1;
            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
        />
    );
}
