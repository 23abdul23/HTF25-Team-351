import { useEffect, useRef } from 'react';

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    let width = window.innerWidth;
    let height = window.innerHeight;

    // star params: very tiny, many, gentle twinkle
    const STAR_COUNT = Math.max(400, Math.floor((width * height) / 2000)); // scale with screen
    type Star = {
      x: number;
      y: number;
      size: number;
      baseOpacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
      twinkleAmp: number;
      drift: number;
    };
    let stars: Star[] = [];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to CSS pixels

      // regenerate stars on resize to keep distribution natural
      stars = [];
      const count = Math.max(300, Math.floor((width * height) / 2000));
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 0.9 + 0.1; // very tiny: 0.1 - 1.0 px
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          baseOpacity: 0.2 + Math.random() * 0.6, // 0.2 - 0.8
          twinkleSpeed: 0.3 + Math.random() * 1.5, // speed variance
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleAmp: 0.15 + Math.random() * 0.45, // twinkle amplitude
          drift: (Math.random() - 0.5) * 0.02, // very slight vertical drift
        });
      }
    }

    resize();

    const start = performance.now();
    function animate(now: number) {
      const t = (now - start) * 0.001;

      // subtle dark space background (fade to very dark)
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, width, height);

      // draw gentle gradient vignette for depth
      const g = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.9);
      g.addColorStop(0, 'rgba(10,14,30,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // draw each star (tiny, twinkling)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // twinkle pattern: smooth sinusoidal per-star
        const opacity = Math.min(
          1,
          Math.max(0, s.baseOpacity + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * s.twinkleAmp)
        );

        // tiny pulsation in size for realism
        const sizePulse = s.size + Math.sin(t * s.twinkleSpeed * 0.8 + s.twinklePhase) * (s.size * 0.25);

        // draw as small filled rect (crisp) or tiny arc for subpixel
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'white';

        // choose draw method to keep stars crisp even when <1px
        ctx.beginPath();
        ctx.arc(s.x, s.y + Math.sin(t * 0.05 + s.twinklePhase) * s.drift * 20, Math.max(0.12, Math.abs(sizePulse) * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ background: 'linear-gradient(to bottom, #030712, #07071a, #09011a)' }}
    />
  );
}
