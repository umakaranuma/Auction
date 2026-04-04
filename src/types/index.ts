export interface PlayerCardState {
  tournamentName: string;
  tournamentYear: string;
  clubLogoSrc: string | null;
  clubName: string;
  playerPhotoSrc: string | null;
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
