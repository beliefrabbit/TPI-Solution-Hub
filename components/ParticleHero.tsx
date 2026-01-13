import React, { useEffect, useRef } from 'react';

// Color helper for smooth transitions
interface RGB { r: number; g: number; b: number; }
const hexToRgb = (hex: string): RGB => {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};

interface Particle {
  x: number;
  y: number;
  z: number;      // Actual 3D Z position
  vx: number;
  vy: number;
  vz: number;
  baseX: number;  // Target Shape X
  baseY: number;  // Target Shape Y
  baseZ: number;  // Target Shape Z
  color: RGB;     // Current RGB
  targetColor: RGB; // Target RGB
  size: number;
  phaseOffset: number; // For individual waviness
}

const ParticleHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const PARTICLE_COUNT = 1800; // High density
    const ROTATION_SPEED = 0.003; 
    const SCATTER_FORCE = 15;    // Power of explosion
    const CONVERGE_SPEED = 0.08; // How fast they snap back (Silky factor)
    const COLOR_SPEED = 0.05;    // How fast colors blend

    let particles: Particle[] = [];
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = 500;
    
    // State Machine
    let phaseIndex = 0;
    const PHASE_DURATION = 350; // Frames per shape
    const SCATTER_DURATION = 60; // Frames for explosion
    
    // Lifecycle: SCATTER -> FORMING -> HOLDING
    let lifeCycleTimer = 0;
    let globalAngleY = 0;
    let globalAngleX = 0;
    let currentPhaseType = 0; // 0:Earth, 1:Chain, etc.

    // Resize
    const resize = () => {
      width = window.innerWidth;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);
    resize();

    // ----------------------
    // INITIALIZATION
    // ----------------------
    const initColors = hexToRgb('#00f3ff');
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z: (Math.random() - 0.5) * 500,
        vx: 0, vy: 0, vz: 0,
        baseX: 0, baseY: 0, baseZ: 0,
        color: { ...initColors },
        targetColor: { ...initColors },
        size: Math.random() * 2 + 0.5,
        phaseOffset: Math.random() * Math.PI * 2
      });
    }

    // ----------------------
    // SHAPE DEFINITIONS
    // ----------------------
    const defineShape = (type: number) => {
      let r, phi, theta;
      const tColor = (() => {
         switch(type) {
            case 0: return '#00f3ff'; // Earth Blue
            case 1: return '#fcee0a'; // Chain Gold
            case 2: return '#ff003c'; // Heart Red
            case 3: return '#bc13fe'; // Brain Purple
            case 4: return '#0aff0a'; // Chip Green
            case 5: return '#ffffff'; // Stream White
            default: return '#00f3ff';
         }
      })();
      
      const targetRgb = hexToRgb(tColor);

      particles.forEach((p, i) => {
        p.targetColor = targetRgb;
        
        switch (type) {
          case 0: // EARTH (Hollow Sphere + Atmosphere)
            phi = Math.acos((Math.random() * 2) - 1);
            theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
            r = 160;
            if (i % 20 === 0) r = 190; // Satellites
            p.baseX = r * Math.sin(phi) * Math.cos(theta);
            p.baseY = r * Math.sin(phi) * Math.sin(theta);
            p.baseZ = r * Math.cos(phi);
            break;

          case 1: // BLOCKCHAIN (Torus Knot / Interlinked)
            // Torus Knot (p=2, q=3)
            const t = (i / PARTICLE_COUNT) * Math.PI * 2 * 10; // multiple loops
            const R = 120; // Major radius
            const R2 = 40; // Minor radius
            // Distribute points along a thick tube
            const tubeAngle = Math.random() * Math.PI * 2;
            const tubeR = (Math.random()) * 25; 
            
            // Core path
            const cx = (R + R2 * Math.cos(3 * t)) * Math.cos(2 * t);
            const cy = (R + R2 * Math.cos(3 * t)) * Math.sin(2 * t);
            const cz = R2 * Math.sin(3 * t);
            
            p.baseX = cx + Math.cos(tubeAngle) * tubeR;
            p.baseY = cy + Math.sin(tubeAngle) * tubeR;
            p.baseZ = cz;
            break;

          case 2: // ECG (Heart Shape + Pulse Line)
             // Heart Formula
             // x = 16sin^3(t)
             // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
             if (i < PARTICLE_COUNT * 0.8) {
                // Heart shell
                const ht = Math.random() * Math.PI * 2;
                const hz = (Math.random() - 0.5) * 60; // Thickness
                const scale = 10;
                p.baseX = scale * (16 * Math.pow(Math.sin(ht), 3));
                p.baseY = -scale * (13 * Math.cos(ht) - 5 * Math.cos(2*ht) - 2 * Math.cos(3*ht) - Math.cos(4*ht)); // Flip Y
                p.baseZ = hz;
             } else {
                // ECG Line running through
                const linX = ((i - PARTICLE_COUNT*0.8) / (PARTICLE_COUNT*0.2) - 0.5) * 400;
                p.baseX = linX;
                p.baseY = 0;
                p.baseZ = 200; // Pop out
             }
             break;

          case 3: // AI BRAIN (Cloud of nodes)
             phi = Math.random() * Math.PI;
             theta = Math.random() * Math.PI * 2;
             r = 150 * Math.cbrt(Math.random()); // Even volume distribution
             
             let x = r * Math.sin(phi) * Math.cos(theta);
             let y = r * Math.sin(phi) * Math.sin(theta);
             let z = r * Math.cos(phi);
             
             // Split hemispheres slightly
             if (x > 0) x += 10; else x -= 10;
             // Flatten bottom
             y -= 20;

             p.baseX = x;
             p.baseY = y;
             p.baseZ = z;
             break;
             
           case 4: // CHIP (Flat layers)
             const size = 300;
             p.baseX = (Math.random() - 0.5) * size;
             p.baseY = (Math.random() - 0.5) * size;
             // Discrete layers
             const layer = i % 5; 
             p.baseZ = (layer - 2) * 20;
             
             // Circuit pattern: Quantize positions
             if (Math.random() > 0.4) {
                 p.baseX = Math.round(p.baseX / 20) * 20;
             } else {
                 p.baseY = Math.round(p.baseY / 20) * 20;
             }
             break;
        }
      });
    };

    // ----------------------
    // ANIMATION LOOP
    // ----------------------
    defineShape(0); // Start with Earth

    const animate = () => {
      // 1. Clear with "Trail" effect (Fade out)
      ctx.fillStyle = 'rgba(2, 2, 4, 0.2)'; // Slower fade = longer trails
      ctx.fillRect(0, 0, width, height);
      
      // 2. Additive Blending for "Bold" Neon look
      ctx.globalCompositeOperation = 'lighter';

      // 3. Lifecycle Management
      lifeCycleTimer++;
      
      // Rotate Scene
      globalAngleY += ROTATION_SPEED;
      
      // Phase Logic
      if (lifeCycleTimer > PHASE_DURATION) {
         // Trigger Explosion/Scatter
         lifeCycleTimer = 0;
         phaseIndex = (phaseIndex + 1) % 5;
         
         // Add explicit velocity for explosion
         particles.forEach(p => {
             // Spiral Explosion Force
             const angle = Math.atan2(p.y - height/2, p.x - width/2);
             const force = SCATTER_FORCE * (0.5 + Math.random());
             p.vx = Math.cos(angle) * force + (Math.random()-0.5) * 10;
             p.vy = Math.sin(angle) * force + (Math.random()-0.5) * 10;
             p.vz = (Math.random()-0.5) * force * 2;
         });
         
         defineShape(phaseIndex);
      }

      const isScattering = lifeCycleTimer < SCATTER_DURATION;

      // 4. Update & Draw Particles
      particles.forEach((p, i) => {
        // --- PHYSICS ---
        if (isScattering) {
           // Free Physics Mode (Explosion)
           p.x += p.vx;
           p.y += p.vy;
           p.z += p.vz;
           p.vx *= 0.92; // Friction
           p.vy *= 0.92;
           p.vz *= 0.92;
        } else {
           // Converge Mode (Seek Target)
           // 1. Rotate Base coordinates
           const cosY = Math.cos(globalAngleY);
           const sinY = Math.sin(globalAngleY);
           
           // Apply individual wave/pulse
           const pulse = 1 + Math.sin(lifeCycleTimer * 0.05 + p.phaseOffset) * 0.03;

           let tx = p.baseX * cosY - p.baseZ * sinY;
           let tz = p.baseZ * cosY + p.baseX * sinY;
           let ty = p.baseY;

           // Special animation for ECG pulse line
           if (phaseIndex === 2 && i >= PARTICLE_COUNT * 0.8) {
              // Scroll the line
              tx = ((tx + 200 + lifeCycleTimer * 5) % 400) - 200;
              // Add vertical spike
              if (Math.abs(tx) < 20) ty -= 80 * (1 - Math.abs(tx)/20);
              else if (Math.abs(tx) < 40) ty += 30 * (1 - Math.abs(tx-30)/10);
           }
           
           // Apply pulse
           tx *= pulse;
           ty *= pulse;
           tz *= pulse;

           // Center it
           tx += width / 2;
           ty += height / 2;

           // Spring Physics towards target
           p.x += (tx - p.x) * CONVERGE_SPEED;
           p.y += (ty - p.y) * CONVERGE_SPEED;
           p.z += (tz - p.z) * CONVERGE_SPEED;
        }

        // --- COLOR LERP ---
        p.color.r += (p.targetColor.r - p.color.r) * COLOR_SPEED;
        p.color.g += (p.targetColor.g - p.color.g) * COLOR_SPEED;
        p.color.b += (p.targetColor.b - p.color.b) * COLOR_SPEED;

        // --- PROJECTION ---
        const fov = 400;
        const scale = fov / (fov + p.z);
        const px = (p.x - width/2) * scale + width/2;
        const py = (p.y - height/2) * scale + height/2;

        // Skip if out of bounds or behind camera
        if (scale < 0 || px < -50 || px > width + 50 || py < -50 || py > height + 50) return;

        // --- DRAW ---
        ctx.beginPath();
        const size = p.size * scale;
        ctx.arc(px, py, size, 0, Math.PI * 2);
        
        // Dynamic Alpha based on depth
        const alpha = Math.min(1, Math.max(0.1, scale * scale));
        ctx.fillStyle = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${alpha})`;
        
        ctx.fill();
      });
      
      // Restore composite operation for next frame's bg clear
      ctx.globalCompositeOperation = 'source-over';
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-[600px] overflow-hidden bg-[#020204] border-b border-white/5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] z-0">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      {/* Central Title Overlay with Glass Effect */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative p-10 bg-black/20 backdrop-blur-[2px] rounded-3xl border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
             <h1 className="text-6xl md:text-9xl font-tech font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-slate-500 tracking-tighter text-center mb-4 drop-shadow-[0_0_25px_rgba(34,211,238,0.3)]">
              TPI SOLUTION HUB
            </h1>
            <div className="flex justify-center gap-8">
                <p className="text-cyan-400 font-mono text-sm tracking-[0.5em] uppercase animate-pulse flex items-center gap-2">
                   <span className="w-2 h-2 bg-cyan-400 rounded-full"></span> Your AI Partner for Mission-Critical Success
                </p>
            </div>
        </div>
      </div>
      
      {/* Vignette & Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020204_100%)] z-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20"></div>
    </div>
  );
};

export default ParticleHero;