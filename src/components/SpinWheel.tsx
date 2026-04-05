'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SpinWheelProps {
  names: string[];
  onResult: (index: number) => void;
  spinning: boolean;
  onSpinEnd: () => void;
}

const COLORS = [
  '#00b4d8', '#0077b6', '#00d4ff', '#0096c7',
  '#0088a3', '#00c9e8', '#006d8e', '#00aecf',
  '#005f73', '#00bcd4', '#007ea7', '#00d0f0',
];

export default function SpinWheel({ names, onResult, spinning, onSpinEnd }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const spinSpeedRef = useRef(0);
  const animRef = useRef<number>(0);
  const [winner, setWinner] = useState<number | null>(null);

  const size = 380;
  const center = size / 2;
  const radius = size / 2 - 10;

  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || names.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    const sliceAngle = (2 * Math.PI) / names.length;

    // Draw slices
    names.forEach((name, i) => {
      const startAngle = angle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice fill
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();

      // Slice border
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${names.length > 12 ? 10 : names.length > 8 ? 12 : 14}px 'Rajdhani', sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;

      const displayName = name.length > 14 ? name.substring(0, 13) + '…' : name;
      ctx.fillText(displayName, radius - 16, 4);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a1628';
    ctx.fill();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 10px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', center, center + 4);

    // Pointer (top)
    ctx.beginPath();
    ctx.moveTo(center - 14, 4);
    ctx.lineTo(center + 14, 4);
    ctx.lineTo(center, 30);
    ctx.closePath();
    ctx.fillStyle = '#e63946';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer ring glow
    ctx.beginPath();
    ctx.arc(center, center, radius + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0,212,255,0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [names, size, center, radius]);

  // Initial draw
  useEffect(() => {
    drawWheel(angleRef.current);
  }, [names, drawWheel]);

  // Spin animation
  useEffect(() => {
    if (!spinning || names.length === 0) return;

    setWinner(null);

    // Random speed + extra rotations
    const totalRotation = Math.PI * 2 * (5 + Math.random() * 5) + Math.random() * Math.PI * 2;
    const duration = 4000 + Math.random() * 2000; // 4-6 seconds
    const startTime = performance.now();
    const startAngle = angleRef.current;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4); // Quartic ease-out

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);

      angleRef.current = startAngle + totalRotation * easedProgress;
      drawWheel(angleRef.current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Determine winner
        const sliceAngle = (2 * Math.PI) / names.length;
        // Pointer is at top (3π/2 or -π/2)
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

  return (
    <div className="spin-wheel-wrapper">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="spin-wheel-canvas"
      />
      {winner !== null && !spinning && (
        <div className="spin-wheel-winner-flash">
          🎉 {names[winner]}
        </div>
      )}
    </div>
  );
}
