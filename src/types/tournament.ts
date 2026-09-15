// Re-export the canonical types so nothing here drifts from lib/types.
export type {
  Mode,
  PartnerInfo,
  Player,
  RegistrationStatus,
} from '../lib/types';

export type TournamentMode = 'singles' | 'doubles';

export type AdminTab = 'draw' | 'validation';