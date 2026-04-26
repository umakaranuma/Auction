'use client';
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface PlayerFromAPI {
  id: number;
  name: string;
  club?: string | null;
  photo_url: string | null;
  jersey_number: string;
  age: string;
  phone: string;
  nationality: string;
  batting_hand: 'Right Hand' | 'Left Hand';
  bowling_hand: 'Right Arm' | 'Left Arm';
  role: string;
  auction_status: 'pending' | 'sold' | 'unsold';
  sold_price: number | null;
  sold_to: string;
  created_at?: string;
}

interface TeamFromAPI {
  id: number;
  tournament: number;
  name: string;
  logo_url: string | null;
  created_at: string;
}

interface TeamSquadPosterProps {
  team: TeamFromAPI;
  players: PlayerFromAPI[];
  tournamentName: string;
  tournamentYear: string;
  clubLogoSrc: string | null;
  onClose: () => void;
}

/** Helper: get initials for fallback avatar */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/** Per-team unique gradient pairs for visual variety */
const TEAM_GRADIENTS: readonly [string, string][] = [
  ['#ff6b35', '#f72585'],
  ['#4361ee', '#3a0ca3'],
  ['#06d6a0', '#118ab2'],
  ['#e63946', '#c9184a'],
  ['#f77f00', '#fcbf49'],
  ['#7209b7', '#560bad'],
  ['#2ec4b6', '#0096c7'],
  ['#ff006e', '#8338ec'],
];

function getTeamGradient(teamId: number): [string, string] {
  return TEAM_GRADIENTS[teamId % TEAM_GRADIENTS.length];
}

export default function TeamSquadPoster({
  team,
  players,
  tournamentName,
  tournamentYear,
  clubLogoSrc,
  onClose,
}: TeamSquadPosterProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [grad1, grad2] = getTeamGradient(team.id);

  const handleDownload = async () => {
    if (!posterRef.current || downloading) return;
    setDownloading(true);

    try {
      // Wait for images to fully load
      const images = posterRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalHeight > 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );

      // Wait for layout to settle
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      const el = posterRef.current;
      const canvas = await html2canvas(el, {
        backgroundColor: '#060d1a',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Remove any images that failed to load to prevent createPattern crash
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((clonedImg) => {
            if (!clonedImg.complete || clonedImg.naturalWidth === 0 || clonedImg.naturalHeight === 0) {
              clonedImg.remove();
            }
          });
        },
      });

      const link = document.createElement('a');
      const safeName = team.name.trim().replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'team';
      link.download = `${safeName}_squad.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download squad poster:', err);
      alert('Failed to download squad poster. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Determine grid layout based on player count
  const count = players.length;
  let cols: number;
  if (count <= 3) cols = count;
  else if (count <= 4) cols = 2;
  else if (count <= 6) cols = 3;
  else if (count <= 8) cols = 4;
  else if (count <= 10) cols = 5;
  else if (count <= 15) cols = 5;
  else if (count <= 20) cols = 5;
  else cols = 6;

  // Split into rows for nice layout
  const rows: PlayerFromAPI[][] = [];
  for (let i = 0; i < players.length; i += cols) {
    rows.push(players.slice(i, i + cols));
  }

  // Poster dimensions — match grid cell width (110px) + gap (6px) + padding (40px)
  const posterWidth = Math.max(580, cols * 116 + 40);

  return (
    <div className="squad-poster-overlay" onClick={onClose}>
      <div className="squad-poster-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Controls */}
        <div className="squad-poster-controls">
          <button className="squad-poster-close" onClick={onClose}>
            ✕
          </button>
          <h3 className="squad-poster-dialog-title">Team Squad Poster</h3>
          <button
            className="squad-poster-download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? '⏳ Generating...' : '📥 Download as Image'}
          </button>
        </div>

        {/* Scrollable poster preview */}
        <div className="squad-poster-scroll">
          {/* ═══ THE POSTER ═══ */}
          <div
            ref={posterRef}
            className="squad-poster"
            style={
              {
                width: `${posterWidth}px`,
                '--squad-grad-1': grad1,
                '--squad-grad-2': grad2,
              } as React.CSSProperties
            }
          >
            {/* Background decorative elements */}
            <div className="squad-poster-bg-pattern" />
            <div className="squad-poster-bg-glow" />

            {/* ── Header: Tournament branding ── */}
            <div className="squad-poster-header">
              <div className="squad-poster-header-line" />
              {clubLogoSrc && (
                <img
                  className="squad-poster-club-logo"
                  src={clubLogoSrc}
                  alt="Club"
                  crossOrigin="anonymous"
                />
              )}
              <div className="squad-poster-header-text">
                <div className="squad-poster-event-name">{tournamentName}</div>
                {tournamentYear && (
                  <div className="squad-poster-event-year">{tournamentYear}</div>
                )}
              </div>
            </div>

            {/* ── Team Identity ── */}
            <div className="squad-poster-team-section">
              <div className="squad-poster-team-logo-wrap">
                {team.logo_url ? (
                  <img
                    src={team.logo_url}
                    alt={team.name}
                    className="squad-poster-team-logo"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="squad-poster-team-logo-fallback">
                    {getInitials(team.name)}
                  </div>
                )}
              </div>
              <div className="squad-poster-team-name">{team.name}</div>
              <div className="squad-poster-squad-label">SQUAD {tournamentYear}</div>
              <div className="squad-poster-team-divider" />
            </div>

            {/* ── Players Grid ── */}
            <div className="squad-poster-grid">
              {rows.map((row, ri) => (
                <div
                  key={ri}
                  className="squad-poster-row"
                  style={{
                    justifyContent:
                      row.length < cols ? 'center' : 'center',
                  }}
                >
                  {row.map((p) => (
                    <div key={p.id} className="squad-poster-player">
                      <div className="squad-poster-player-photo-wrap">
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt={p.name}
                            className="squad-poster-player-photo"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="squad-poster-player-photo-fallback">
                            {getInitials(p.name)}
                          </div>
                        )}
                        {p.jersey_number && (
                          <div className="squad-poster-player-jersey">
                            #{p.jersey_number}
                          </div>
                        )}
                      </div>
                      <div className="squad-poster-player-name">{p.name}</div>
                      {p.role && (
                        <div className="squad-poster-player-role">{p.role}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div className="squad-poster-footer">
              <div className="squad-poster-footer-divider" />
              <div className="squad-poster-footer-text">
                <span className="squad-poster-footer-brand">CRICNOVA</span>
                <span className="squad-poster-footer-sep">·</span>
                <span>{players.length} Players</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
