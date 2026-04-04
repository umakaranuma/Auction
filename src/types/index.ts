export interface TournamentInfo {
  tournamentName: string;
  tournamentYear: string;
  clubLogoSrc: string | null;
  clubLogoFile: File | null;
  clubName: string;
}

export interface PlayerCardState extends TournamentInfo {
  playerPhotoSrc: string | null;
  playerPhotoFile: File | null;
  playerName: string;
  jerseyNumber: string;
  playerAge: string;
  playerPhone: string;
  playerNationality: string;
  battingHand: 'Right Hand' | 'Left Hand';
  bowlingHand: 'Right Arm' | 'Left Arm';
  bowlingStyle: string;
  roles: string[];
}
