import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

const PlayerDisplayTypeMap: Record<keyof typeof PlayerDisplayMode, number> = {
  [PlayerDisplayMode.DEFAULT]: 1,
  [PlayerDisplayMode.BANNER]: 2,
  [PlayerDisplayMode.IN_APP_PICTURE_IN_PICTURE]: 3,
  [PlayerDisplayMode.VIDEO_IN_GRID]: 4,
  [PlayerDisplayMode.PICTURE_IN_PICTURE]: 5,
};

export const getPlayerDisplayType = (displayMode: PlayerDisplayMode): number => {
  return PlayerDisplayTypeMap[displayMode] ?? 0;
};
