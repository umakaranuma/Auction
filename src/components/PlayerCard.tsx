'use client';
import React, { useRef, useEffect } from 'react';
import { PlayerCardState } from '../types';

interface PlayerCardProps {
  state: PlayerCardState;
}

function drawBurstBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  // Deep navy gradient base
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0c1e3a');
  bgGrad.addColorStop(0.5, '#0a1628');
  bgGrad.addColorStop(1, '#06101e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Draw explosive spiky burst shapes
  function drawBurst(cx: number, cy: number, innerR: number, outerR: number, spikes: number, color: string, alpha: number) {
    ctx!.save();
    ctx!.globalAlpha = alpha;
    ctx!.fillStyle = color;
    ctx!.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx!.moveTo(x, y);
      else ctx!.lineTo(x, y);
    }
    ctx!.closePath();
    ctx!.fill();
    ctx!.restore();
  }

  // Draw sharp spike triangles
  function drawSpike(x: number, y: number, length: number, angle: number, width: number, color: string, alpha: number) {
    ctx!.save();
    ctx!.globalAlpha = alpha;
    ctx!.fillStyle = color;
    ctx!.translate(x, y);
    ctx!.rotate(angle);
    ctx!.beginPath();
    ctx!.moveTo(0, 0);
    ctx!.lineTo(length, -width / 2);
    ctx!.lineTo(length * 0.85, 0);
    ctx!.lineTo(length, width / 2);
    ctx!.closePath();
    ctx!.fill();
    ctx!.restore();
  }

  // Burst clusters — top-right
  drawBurst(W * 0.85, H * 0.15, 30, 120, 18, '#00aadd', 0.15);
  drawBurst(W * 0.9, H * 0.08, 20, 80, 14, '#00ccff', 0.12);
  drawBurst(W * 0.78, H * 0.22, 15, 60, 12, '#0099cc', 0.1);

  // Bottom-right
  drawBurst(W * 0.88, H * 0.82, 35, 140, 20, '#00aadd', 0.18);
  drawBurst(W * 0.95, H * 0.88, 25, 100, 16, '#00ccff', 0.12);
  drawBurst(W * 0.75, H * 0.9, 20, 70, 14, '#0088bb', 0.1);

  // Left side accents
  drawBurst(W * 0.08, H * 0.35, 15, 60, 12, '#0077aa', 0.1);
  drawBurst(W * 0.05, H * 0.65, 20, 75, 14, '#0099cc', 0.08);

  // Center-right behind player
  drawBurst(W * 0.6, H * 0.3, 50, 180, 22, '#0d2a50', 0.25);
  drawBurst(W * 0.55, H * 0.35, 30, 120, 16, '#0f3060', 0.15);

  // Spikes
  const spikeData: [number, number, number, number, number, string, number][] = [
    [W*0.92, H*0.12, 90, -0.3, 12, '#00bbee', 0.2],
    [W*0.85, H*0.05, 70, 0.5, 10, '#00aadd', 0.15],
    [W*0.95, H*0.2, 60, -1.2, 8, '#0099cc', 0.18],
    [W*0.02, H*0.4, 80, 0.8, 10, '#0077aa', 0.12],
    [W*0.88, H*0.75, 100, -0.6, 14, '#00bbee', 0.2],
    [W*0.92, H*0.92, 80, -2.0, 10, '#00aadd', 0.15],
    [W*0.1, H*0.7, 60, 0.4, 8, '#0088bb', 0.1],
    [W*0.7, H*0.85, 70, -1.0, 10, '#00ccff', 0.12],
  ];
  spikeData.forEach(s => drawSpike(s[0], s[1], s[2], s[3], s[4], s[5], s[6]));

  // Radial center glow
  const centerGlow = ctx.createRadialGradient(W * 0.5, H * 0.35, 10, W * 0.5, H * 0.35, 200);
  centerGlow.addColorStop(0, 'rgba(0,180,255,0.08)');
  centerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, W, H);

  // Subtle dots
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 30; i++) {
    const px = Math.random() * W;
    const py = Math.random() * H;
    const pr = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${190 + Math.random() * 20}, 100%, ${60 + Math.random() * 20}%)`;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export default function PlayerCard({ state }: PlayerCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const battShort = state.battingHand === 'Left Hand' ? 'LH' : 'RH';
  const bowlShort = state.bowlingHand === 'Left Arm' ? 'LA' : 'RA';

  useEffect(() => {
    if (canvasRef.current) {
      drawBurstBackground(canvasRef.current);
    }
  }, []);

  return (
    <div className="player-card" id="player-card">
      {/* Explosive burst background */}
      <canvas ref={canvasRef} className="card-bg-canvas" width={380} height={560} />

      {/* Tournament badge (top-left) */}
      <div className="card-tournament-badge">
        <div className="card-tournament-logo">
          {state.clubLogoSrc ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${state.clubLogoSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '50%',
              }}
            />
          ) : (
            <span className="card-tournament-logo-text">{state.clubName || 'LOGO'}</span>
          )}
        </div>
        <div className="card-tournament-text">
          <div className="card-tournament-name">{state.tournamentName || 'TOURNAMENT'}</div>
          <div className="card-tournament-year">{state.tournamentYear || '2025'}</div>
        </div>
      </div>

      {/* Hero player image */}
      <div className="card-hero-area">
        {state.playerPhotoSrc ? (
          <div
            className="card-hero-img"
            style={{
              backgroundImage: `url(${state.playerPhotoSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
            }}
          />
        ) : (
          <div className="card-hero-placeholder">🧑</div>
        )}
      </div>
      <div className="card-hero-gradient" />

      {/* Info section (bottom) */}
      <div className="card-info-section">
        <div className="card-profile-label">PLAYER PROFILE</div>
        <div className="card-player-name">
          {state.playerName ? state.playerName.toUpperCase() : 'PLAYER NAME'}
        </div>

        {/* Role tags */}
        {state.roles.length > 0 && (
          <div className="card-role-tags">
            {state.roles.map(role => (
              <span key={role} className={`card-role-tag ${role === 'Wicket-Keeper' ? 'red' : ''}`}>
                {role}
              </span>
            ))}
          </div>
        )}

        {/* Stats grid - 4 boxes */}
        <div className="card-stats-row">
          <div className="stat-box">
            <div className="stat-box-label">BATTING</div>
            <div className="stat-box-value">{battShort}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">BOWLING</div>
            <div className="stat-box-value">{bowlShort}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">JERSEY</div>
            <div className="stat-box-value">{state.jerseyNumber ? `#${state.jerseyNumber}` : '—'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">CONTACT</div>
            <div className="stat-box-value stat-box-value-small">{state.playerPhone || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
