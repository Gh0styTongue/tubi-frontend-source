export const enum PurpleCarpetStatus {
  NotAvailable = 'notAvailable',
  Banner = 'banner',
  BeforeGame = 'before_game',
  DuringGame = 'during_game',
}

export const enum PurpleCarpetContentStatus {
  NotStarted = 'notStarted',
  Live = 'live',
  Ended = 'ended',
}

export interface WPFPlayer {
  removePlayer: () => Promise<void>;
  load: () => void;
}
