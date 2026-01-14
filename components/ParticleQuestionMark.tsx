import React, { useEffect, useRef } from 'react';

interface ParticleQuestionMarkProps {
  width?: number;
  height?: number;
  className?: string;
}

const ParticleQuestionMark: React.FC<ParticleQuestionMarkProps> = ({ 
  width = 400, 
  height = 300,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Create offscreen canvas for text rendering
    const textCanvas = document.createElement('canvas');
    textCanvas.width = width;
    textCanvas.height = height;
    const textCtx = textCanvas.getContext('2d');
    if (!textCtx) return;

    // Draw question mark
    textCtx.fillStyle = '#ffffff';
    textCtx.font = `bold ${Math.min(width, height) * 0.4}px 'Courier New', monospace`;
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.fillText('?', width / 2, height / 2);

    // Extract pixels
    const imageData = textCtx.getImageData(0, 0, width, height);
    const pixels: Array<{ x: number; y: number; alpha: number }> = [];

    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        const index = (y * width + x) * 4;
        const alpha = imageData.data[index + 3];
        if (alpha > 128) {
          pixels.push({ x, y, alpha });
        }
      }
    }

    // Create particles
    const particles = pixels.map((pixel, i) => ({
      x: pixel.x,
      y: pixel.y,
      targetX: pixel.x,
      targetY: pixel.y,
      vx: 0,
      vy: 0,
      size: Math.random() * 2 + 1,
      color: `hsl(${200 + Math.random() * 60}, 70%, ${50 + Math.random() * 30}%)`,
      glow: Math.random() * 0.5 + 0.5
    }));

    // Animation
    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 2, 4, 0.1)';
      ctx.fillRect(0, 0, width, height);

      time += 0.02;

      particles.forEach((particle, i) => {
        // Return to target position with spring effect
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        
        particle.vx += dx * 0.05;
        particle.vy += dy * 0.05;
        
        particle.vx *= 0.9;
        particle.vy *= 0.9;
        
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Add subtle floating motion
        particle.x += Math.sin(time + i) * 0.3;
        particle.y += Math.cos(time + i * 0.5) * 0.3;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = particle.glow;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    // Initial scatter effect
    particles.forEach(particle => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 100 + 50;
      particle.x = width / 2 + Math.cos(angle) * distance;
      particle.y = height / 2 + Math.sin(angle) * distance;
    });

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};

export default ParticleQuestionMark;
