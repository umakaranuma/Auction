'use client';
import React, { useState } from 'react';
import Header from '../components/Header';
import TournamentSetup from '../components/TournamentSetup';
import FormPanel from '../components/FormPanel';
import PreviewPanel from '../components/PreviewPanel';
import { PlayerCardState, TournamentInfo } from '../types';

const defaultPlayerFields: Omit<PlayerCardState, keyof TournamentInfo> = {
  playerPhotoSrc: null,
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

export default function Home() {
  const [tournament, setTournament] = useState<TournamentInfo>({
    tournamentName: '',
    tournamentYear: '',
    clubLogoSrc: null,
    clubName: '',
  });

  const [tournamentLocked, setTournamentLocked] = useState(false);

  const [state, setState] = useState<PlayerCardState>({
    ...tournament,
    ...defaultPlayerFields,
  });

  const [showCard, setShowCard] = useState(false);

  const handleLockTournament = () => {
    setTournamentLocked(true);
    setState(prev => ({
      ...prev,
      ...tournament,
    }));
  };

  const handleEditTournament = () => {
    setTournamentLocked(false);
    setShowCard(false);
  };

  const handleGenerate = () => {
    setShowCard(true);
  };

  const handleNewPlayer = () => {
    setState({
      ...tournament,
      ...defaultPlayerFields,
    });
    setShowCard(false);
  };

  if (!tournamentLocked) {
    return (
      <>
        <Header />
        <TournamentSetup tournament={tournament} setTournament={setTournament} onContinue={handleLockTournament} />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="main">
        <FormPanel
          state={state}
          setState={setState}
          tournament={tournament}
          onGenerate={handleGenerate}
          onEditTournament={handleEditTournament}
          onNewPlayer={handleNewPlayer}
          showCard={showCard}
        />
        <PreviewPanel state={state} showCard={showCard} />
      </div>
    </>
  );
}
