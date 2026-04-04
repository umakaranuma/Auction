'use client';
import React, { useState } from 'react';
import Header from '../components/Header';
import TournamentSetup from '../components/TournamentSetup';
import FormPanel from '../components/FormPanel';
import PreviewPanel from '../components/PreviewPanel';
import { PlayerCardState, TournamentInfo } from '../types';
import { createTournament, createPlayer } from '../lib/api';

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

export default function Home() {
  const [tournament, setTournament] = useState<TournamentInfo>({
    tournamentName: '',
    tournamentYear: '',
    clubLogoSrc: null,
    clubLogoFile: null,
    clubName: '',
  });

  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [tournamentLocked, setTournamentLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [state, setState] = useState<PlayerCardState>({
    ...tournament,
    ...defaultPlayerFields,
  });

  const [showCard, setShowCard] = useState(false);

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
      setTournamentLocked(true);
      setState(prev => ({
        ...prev,
        ...tournament,
      }));
    } catch (error) {
      console.error('Failed to save tournament:', error);
      // Still allow to proceed even if save fails
      setTournamentLocked(true);
      setState(prev => ({
        ...prev,
        ...tournament,
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleEditTournament = () => {
    setTournamentLocked(false);
    setShowCard(false);
  };

  const handleGenerate = async () => {
    setShowCard(true);
    setSaveMessage(null);

    // Save player to backend
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

  if (!tournamentLocked) {
    return (
      <>
        <Header />
        <TournamentSetup
          tournament={tournament}
          setTournament={setTournament}
          onContinue={handleLockTournament}
          saving={saving}
        />
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
          saving={saving}
        />
        <PreviewPanel state={state} showCard={showCard} saveMessage={saveMessage} />
      </div>
    </>
  );
}
