'use client';
import React, { useState } from 'react';
import Header from '../components/Header';
import TournamentPicker from '../components/TournamentPicker';
import TournamentSetup from '../components/TournamentSetup';
import FormPanel from '../components/FormPanel';
import PreviewPanel from '../components/PreviewPanel';
import AuctionWheel from '../components/AuctionWheel';
import { PlayerCardState, TournamentInfo } from '../types';
import { createTournament, createPlayer } from '../lib/api';

type AppView = 'picker' | 'setup' | 'create' | 'wheel';

const defaultPlayerFields: Omit<PlayerCardState, keyof TournamentInfo> = {
  playerPhotoSrc: null,
  playerPhotoFile: null,
  playerName: '',
  jerseyNumber: '',
  playerAge: '',
  playerPhone: '',
  playerNationality: '',
  battingHand: 'Right Hand',
  bowlingHand: 'Right Arm',
  bowlingStyle: '',
  roles: [],
};

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

  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'wheel'>('create');

  const [state, setState] = useState<PlayerCardState>({
    ...tournament,
    ...defaultPlayerFields,
  });

  const [showCard, setShowCard] = useState(false);

  // Handle picking an existing tournament (go to wheel directly)
  const handlePickTournament = (t: {
    id: number;
    name: string;
    year: string;
    club_name: string;
    club_logo_url: string | null;
  }) => {
    setSelectedTournament(t);
    setTournamentId(t.id);
    setTournament({
      tournamentName: t.name,
      tournamentYear: t.year,
      clubLogoSrc: t.club_logo_url,
      clubLogoFile: null,
      clubName: t.club_name,
    });
    setState((prev) => ({
      ...prev,
      tournamentName: t.name,
      tournamentYear: t.year,
      clubLogoSrc: t.club_logo_url,
      clubLogoFile: null,
      clubName: t.club_name,
    }));
    setView('wheel');
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
    setTournamentId(null);
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
      setTournamentId(result.id);
      setSelectedTournament({
        id: result.id,
        name: tournament.tournamentName,
        year: tournament.tournamentYear,
        club_name: tournament.clubName,
        club_logo_url: result.club_logo_url || tournament.clubLogoSrc,
      });
      setState((prev) => ({
        ...prev,
        ...tournament,
      }));
      setMode('create');
      setView('create');
    } catch (error) {
      console.error('Failed to save tournament:', error);
      setMode('create');
      setView('create');
      setState((prev) => ({
        ...prev,
        ...tournament,
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleEditTournament = () => {
    setView('setup');
    setShowCard(false);
  };

  const handleGenerate = async () => {
    setShowCard(true);
    setSaveMessage(null);

    if (tournamentId && state.playerName.trim()) {
      try {
        setSaving(true);
        await createPlayer({
          tournament: tournamentId,
          name: state.playerName,
          photo: state.playerPhotoFile,
          jersey_number: state.jerseyNumber,
          age: state.playerAge,
          phone: state.playerPhone,
          nationality: state.playerNationality,
          batting_hand: state.battingHand,
          bowling_hand: state.bowlingHand,
          role: state.roles.length > 0 ? state.roles[0] : '',
        });
        setSaveMessage('✅ Player saved successfully!');
      } catch (error) {
        console.error('Failed to save player:', error);
        setSaveMessage('⚠️ Card generated but failed to save to database');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleNewPlayer = () => {
    setState({
      ...tournament,
      ...defaultPlayerFields,
    });
    setShowCard(false);
    setSaveMessage(null);
  };

  const handleBackToPicker = () => {
    setView('picker');
    setSelectedTournament(null);
    setTournamentId(null);
    setShowCard(false);
    setSaveMessage(null);
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

  // ── VIEW: Wheel (selected an existing tournament) ──
  if (view === 'wheel') {
    return (
      <>
        <Header />
        {/* Mode Switcher Tabs */}
        <div className="mode-switcher">
          <button
            className="mode-tab"
            onClick={handleBackToPicker}
          >
            ← Tournaments
          </button>
          <button
            className={`mode-tab ${mode === 'create' ? 'active' : ''}`}
            onClick={() => { setMode('create'); setView('create'); }}
          >
            🏏 Create Player Card
          </button>
          <button
            className={`mode-tab ${mode === 'wheel' ? 'active' : ''}`}
            onClick={() => setMode('wheel')}
          >
            🎰 Auction Wheel
          </button>
        </div>
        <AuctionWheel
          tournamentId={tournamentId}
          tournamentName={tournament.tournamentName}
          tournamentYear={tournament.tournamentYear}
          clubLogoSrc={tournament.clubLogoSrc}
          clubName={tournament.clubName}
          onBack={handleBackToPicker}
        />
      </>
    );
  }

  // ── VIEW: Create Player Card ──
  return (
    <>
      <Header />
      {/* Mode Switcher Tabs */}
      <div className="mode-switcher">
        <button
          className="mode-tab"
          onClick={handleBackToPicker}
        >
          ← Tournaments
        </button>
        <button
          className={`mode-tab ${mode === 'create' ? 'active' : ''}`}
          onClick={() => setMode('create')}
        >
          🏏 Create Player Card
        </button>
        <button
          className={`mode-tab ${mode === 'wheel' ? 'active' : ''}`}
          onClick={() => { setMode('wheel'); setView('wheel'); }}
        >
          🎰 Auction Wheel
        </button>
      </div>

      {mode === 'create' ? (
        <div className="main">
          <FormPanel
            state={state}
            setState={setState}
            tournament={tournament}
            onGenerate={handleGenerate}
            onEditTournament={handleEditTournament}
            onNewPlayer={handleNewPlayer}
            showCard={showCard}
            saving={saving}
          />
          <PreviewPanel state={state} showCard={showCard} saveMessage={saveMessage} />
        </div>
      ) : (
        <AuctionWheel
          tournamentId={tournamentId}
          tournamentName={tournament.tournamentName}
          tournamentYear={tournament.tournamentYear}
          clubLogoSrc={tournament.clubLogoSrc}
          clubName={tournament.clubName}
          onBack={handleBackToPicker}
        />
      )}
    </>
  );
}
