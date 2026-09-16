export type Mode = 'singles' | 'doubles';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PartnerInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  seed: number | null;
  status: RegistrationStatus;
}

export interface Pair {
  id: string;
  p1: Player;
  p2: Player;
}

export interface Player {
  id?: string;
  name: string;
  seed?: number | null;
  status?: RegistrationStatus;
  mode?: Mode;
  assignedMode?: Mode;
  bye?: boolean;
  phone?: string;              // ← NEW
  partner?: PartnerInfo | null;
}

export interface SetScore {
  p1: number;
  p2: number;
}

export interface MatchDetail {
  sets?: SetScore[];
  winnerIndex?: 0 | 1;
  isWalkover?: boolean;
}

export type Slot = Player | null;
export type BracketData = Slot[][];
export type MatchDetails = (MatchDetail | null)[][];

export interface TournamentState {
  bracketData: BracketData;
  matchDetails: MatchDetails;
  playersList: Player[];
  registrations?: Player[];
}

export interface MatchInfo {
  r: number;
  slot: number;
  matchIdx: number;
  p1: Player;
  p2: Player;
}

export interface PendingWalkover {
  r: number;
  matchIdx: number;
  existingPlayer: Player;
  winnerIndex: 0 | 1;
}

export interface TournamentStats {
  total: number;
  size: number;
  byes: number;
  seeds: number;
}