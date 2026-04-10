'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SpinWheelProps {
  names: string[];
  onResult: (index: number) => void;
  spinning: boolean;
  onSpinEnd: () => void;
}

// Premium color palette – alternating rich gradients
const SEGMENT_COLORS = [
  ['#0ea5e9', '#0284c7'], // sky blue
  ['#6366f1', '#4f46e5'], // indigo
  ['#8b5cf6', '#7c3aed'], // violet
  ['#14b8a6', '#0d9488'], // teal
  ['#f59e0b', '#d97706'], // amber
  ['#ef4444', '#dc2626'], // red
  ['#ec4899', '#db2777'], // pink
  ['#10b981', '#059669'], // emerald
  ['#3b82f6', '#2563eb'], // blue
  ['#f97316', '#ea580c'], // orange
  ['#a855f7', '#9333ea'], // purple
  ['#06b6d4', '#0891b2'], // cyan
];

export default function SpinWheel({ names, onResult, spinning, onSpinEnd }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const animRef = useRef<number>(0);
  const [winner, setWinner] = useState<number | null>(null);
  const tickRef = useRef(0);

  const size = 440;
  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const innerRadius = 35;
  const ledRingRadius = size / 2 - 8;

  const drawWheel = useCallback((angle: number, tick: number) => {
    const canvas = canvasRef.current;
    if (!canvas || names.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    const sliceAngle = (2 * Math.PI) / names.length;
    const numLeds = Math.max(names.length * 3, 24);

    // ── Outer glow ring ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 14, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0,212,255,0.12)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 10, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0,212,255,0.06)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // ── LED lights around the rim ──
    for (let i = 0; i < numLeds; i++) {
      const ledAngle = (2 * Math.PI / numLeds) * i;
      const x = center + Math.cos(ledAngle) * ledRingRadius;
      const y = center + Math.sin(ledAngle) * ledRingRadius;
      const isLit = (i + tick) % 3 === 0;

      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
      if (isLit) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = 'rgba(0,212,255,0.2)';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ── Draw segments ──
    names.forEach((name, i) => {
      const startAngle = angle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const colors = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

      // Gradient fill
      const grad = ctx.createLinearGradient(
        center + Math.cos(startAngle + sliceAngle / 2) * outerRadius * 0.3,
        center + Math.sin(startAngle + sliceAngle / 2) * outerRadius * 0.3,
        center + Math.cos(startAngle + sliceAngle / 2) * outerRadius,
        center + Math.sin(startAngle + sliceAngle / 2) * outerRadius
      );
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, outerRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner highlight arc
      ctx.beginPath();
      ctx.arc(center, center, outerRadius - 2, startAngle + 0.01, endAngle - 0.01);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── Text ──
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);

      const fontSize = names.length > 16 ? 9 : names.length > 10 ? 11 : names.length > 6 ? 13 : 15;
      ctx.font = `bold ${fontSize}px 'Rajdhani', sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Text shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(
        name.length > 12 ? name.substring(0, 11) + '…' : name,
        outerRadius - 20 + 1,
        1
      );

      // Main text
      ctx.fillStyle = '#fff';
      ctx.fillText(
        name.length > 12 ? name.substring(0, 11) + '…' : name,
        outerRadius - 20,
        0
      );

      ctx.restore();
    });

    // ── Decorative inner ring ──
    ctx.beginPath();
    ctx.arc(center, center, innerRadius + 18, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Center hub ──
    // Outer ring of center
    const hubGrad = ctx.createRadialGradient(center, center, innerRadius - 10, center, center, innerRadius + 5);
    hubGrad.addColorStop(0, '#1e293b');
    hubGrad.addColorStop(1, '#0f172a');
    ctx.beginPath();
    ctx.arc(center, center, innerRadius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner hub
    const innerGrad = ctx.createRadialGradient(center, center, 0, center, center, innerRadius);
    innerGrad.addColorStop(0, '#1e3a5f');
    innerGrad.addColorStop(1, '#0a1628');
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hub glow
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(0,212,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center text
    ctx.fillStyle = '#00d4ff';
    ctx.font = "bold 11px 'Rajdhani', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', center, center - 4);
    ctx.font = "bold 8px 'Rajdhani', sans-serif";
    ctx.fillStyle = 'rgba(0,212,255,0.6)';
    ctx.fillText('THE WHEEL', center, center + 8);

    // ── Pointer (top) ──
    ctx.save();
    ctx.shadowColor = '#e63946';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(center - 16, 18);
    ctx.lineTo(center + 16, 18);
    ctx.lineTo(center, 42);
    ctx.closePath();
    ctx.fillStyle = '#e63946';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pointer highlight
    ctx.beginPath();
    ctx.moveTo(center - 10, 21);
    ctx.lineTo(center, 36);
    ctx.lineTo(center + 2, 22);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();
    ctx.restore();

  }, [names, size, center, outerRadius, innerRadius, ledRingRadius]);

  // Initial draw
  useEffect(() => {
    drawWheel(angleRef.current, 0);
  }, [names, drawWheel]);

  // Spin animation
  useEffect(() => {
    if (!spinning || names.length === 0) return;

    setWinner(null);

    const totalRotation = Math.PI * 2 * (6 + Math.random() * 6) + Math.random() * Math.PI * 2;
    const duration = 5000 + Math.random() * 2000;
    const startTime = performance.now();
    const startAngle = angleRef.current;

    // Quartic ease-out for a realistic slow-down
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    let ledTick = 0;
    let lastLedTime = 0;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);

      angleRef.current = startAngle + totalRotation * easedProgress;

      // LED animation speed decreases as wheel slows
      const ledInterval = 60 + progress * 400; // Faster at start, slower at end
      if (time - lastLedTime > ledInterval) {
        ledTick++;
        lastLedTime = time;
      }

      drawWheel(angleRef.current, ledTick);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Determine winner
        const sliceAngle = (2 * Math.PI) / names.length;
        const normalizedAngle = ((2 * Math.PI) - (angleRef.current % (2 * Math.PI)) + (3 * Math.PI / 2)) % (2 * Math.PI);
        const winnerIndex = Math.floor(normalizedAngle / sliceAngle) % names.length;
        setWinner(winnerIndex);
        onResult(winnerIndex);
        onSpinEnd();
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning, names, drawWheel, onResult, onSpinEnd]);

  // Ambient LED animation when not spinning
  useEffect(() => {
    if (spinning || names.length === 0) return;

    let tick = 0;
    let lastTime = 0;
    const ambientAnimate = (time: number) => {
      if (time - lastTime > 300) {
        tick++;
        lastTime = time;
        drawWheel(angleRef.current, tick);
      }
      animRef.current = requestAnimationFrame(ambientAnimate);
    };
    animRef.current = requestAnimationFrame(ambientAnimate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning, names, drawWheel]);

  return (
    <div className="spin-wheel-wrapper">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="spin-wheel-canvas"
      />
    </div>
  );
}
