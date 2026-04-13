export interface TournamentInfo {
  tournamentName: string;
  tournamentYear: string;
  clubLogoSrc: string | null;
  clubLogoFile: File | null;
  clubName: string;
  teamTotalBudget: number;
  maxPlayersPerTeam: number;
  playerBasePrice: number;
}

export interface PlayerCardState extends TournamentInfo {
  playerPhotoSrc: string | null;
  playerPhotoFile: File | null;
  /** True when the portrait was processed with background removal (use cutout layout on card). */
  playerPhotoBackgroundRemoved: boolean;
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
