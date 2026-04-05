'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import TournamentPicker from '../components/TournamentPicker';
import TournamentSetup from '../components/TournamentSetup';
import TournamentDetail from '../components/TournamentDetail';
import { TournamentInfo } from '../types';
import { createTournament } from '../lib/api';

type AppView = 'picker' | 'setup' | 'detail';

interface SelectedTournament {
  id: number;
  name: string;
  year: string;
  club_name: string;
  club_logo_url: string | null;
}

export default function Home() {
  const [view, setView] = useState<AppView>('picker');
  const [selectedTournament, setSelectedTournament] = useState<SelectedTournament | null>(null);

  const [tournament, setTournament] = useState<TournamentInfo>({
    tournamentName: '',
    tournamentYear: '',
    clubLogoSrc: null,
    clubLogoFile: null,
    clubName: '',
  });

  const [saving, setSaving] = useState(false);

  // Handle picking an existing tournament
  const handlePickTournament = (t: {
    id: number;
    name: string;
    year: string;
    club_name: string;
    club_logo_url: string | null;
  }) => {
    setSelectedTournament(t);
    setTournament({
      tournamentName: t.name,
      tournamentYear: t.year,
      clubLogoSrc: t.club_logo_url,
      clubLogoFile: null,
      clubName: t.club_name,
    });
    setView('detail');
  };

  // Handle creating a new tournament
  const handleCreateNew = () => {
    setTournament({
      tournamentName: '',
      tournamentYear: '',
      clubLogoSrc: null,
      clubLogoFile: null,
      clubName: '',
    });
    setSelectedTournament(null);
    setView('setup');
  };

  const handleLockTournament = async () => {
    try {
      setSaving(true);
      const result = await createTournament({
        name: tournament.tournamentName,
        year: tournament.tournamentYear,
        club_name: tournament.clubName,
        club_logo: tournament.clubLogoFile,
      });
      setSelectedTournament({
        id: result.id,
        name: tournament.tournamentName,
        year: tournament.tournamentYear,
        club_name: tournament.clubName,
        club_logo_url: result.club_logo_url || tournament.clubLogoSrc,
      });
      setView('detail');
    } catch (error) {
      console.error('Failed to save tournament:', error);
      // Still navigate to detail even if save fails
      setView('detail');
    } finally {
      setSaving(false);
    }
  };

  const handleBackToPicker = () => {
    setView('picker');
    setSelectedTournament(null);
  };

  // ── VIEW: Tournament Picker (Home) ──
  if (view === 'picker') {
    return (
      <>
        <Header />
        <TournamentPicker
          onSelect={handlePickTournament}
          onCreateNew={handleCreateNew}
        />
      </>
    );
  }

  // ── VIEW: Tournament Setup (Create New) ──
  if (view === 'setup') {
    return (
      <>
        <Header />
        <div className="setup-back-row">
          <button className="auction-back-btn" onClick={handleBackToPicker}>
            ← Back to Tournaments
          </button>
        </div>
        <TournamentSetup
          tournament={tournament}
          setTournament={setTournament}
          onContinue={handleLockTournament}
          saving={saving}
        />
      </>
    );
  }

  // ── VIEW: Tournament Detail ──
  return (
    <>
      <Header />
      {selectedTournament && (
        <TournamentDetail
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.name}
          tournamentYear={selectedTournament.year}
          clubName={selectedTournament.club_name}
          clubLogoSrc={selectedTournament.club_logo_url}
          onBack={handleBackToPicker}
        />
      )}
    </>
  );
}
