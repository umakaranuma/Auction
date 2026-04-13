export interface TournamentInfo {
  tournamentName: string;
  tournamentYear: string;
  clubLogoSrc: string | null;
  clubLogoFile: File | null;
  /** Wide branding image (e.g. event title artwork), shown beside the club logo on player cards */
  tournamentBannerSrc: string | null;
  tournamentBannerFile: File | null;
  clubName: string;
  teamTotalBudget: number;
  maxPlayersPerTeam: number;
  playerBasePrice: number;
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
