'use client';
import React, { useState } from 'react';
import Header from '../components/Header';
import FormPanel from '../components/FormPanel';
import PreviewPanel from '../components/PreviewPanel';
import { PlayerCardState } from '../types';

export default function Home() {
  const [state, setState] = useState<PlayerCardState>({
    tournamentName: '',
    tournamentYear: '',
    clubLogoSrc: null,
    clubName: '',
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
  });

  const [showCard, setShowCard] = useState(false);

  const handleGenerate = () => {
    setShowCard(true);
  };

  return (
    <>
      <Header />
      <div className="main">
        <FormPanel state={state} setState={setState} onGenerate={handleGenerate} />
        <PreviewPanel state={state} showCard={showCard} />
      </div>
    </>
  );
}
