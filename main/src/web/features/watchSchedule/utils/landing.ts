import dayjs from 'dayjs';
import type { RouterState as NextState, RedirectFunction as Replace } from 'react-router';
import type { Store } from 'redux';

import { WEB_ROUTES } from 'common/constants/routes';
import { isKidsModeSelector, isUsCountrySelector } from 'common/selectors/ui';
import type { Program as EpgProgram } from 'common/types/epg';
import type { StoreState } from 'common/types/storeState';
import { SPANISH_CONTENT_IDS } from 'web/features/watchSchedule/constants/landing';
import type { Program } from 'web/features/watchSchedule/types/landing';

export type OnEnterHook = (store: Store<StoreState>, nextState: NextState, replace: Replace) => void;

export const assetsGenerator = (folderName?: string) => {
  return (filename: string) =>
    `https://mcdn.tubitv.com/tubitv-assets/img/watch-schedule/${[folderName, filename].filter(Boolean).join('/')}`;
};

export const watchScheduleOnEnterHook: OnEnterHook = (store, _nextState, replace) => {
  const state = store.getState();

  if (isKidsModeSelector(state) || !isUsCountrySelector(state)) {
    return replace(WEB_ROUTES.home);
  }
};

export const orderByStartTime = (a: Program, b: Program) => dayjs(a.start_time).diff(b.start_time);

export const enrichProgramsWithContentId = (programs: EpgProgram[], contentId: number) =>
  programs.map((program) => ({
    ...program,
    content_id: contentId,
  }));

export const isSpanishContent = (contentId: number) => SPANISH_CONTENT_IDS.includes(contentId);
