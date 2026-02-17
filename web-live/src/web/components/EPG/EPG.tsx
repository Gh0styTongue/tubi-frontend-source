import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { DialogType, DialogAction } from '@tubitv/analytics/lib/dialog';
import type { FilterItem } from '@tubitv/web-ui';
import { EPG as EPGComponent } from '@tubitv/web-ui';
import type { Location } from 'history';
import React, { Fragment, memo, useCallback, useEffect } from 'react';

import { getCookie, removeCookie } from 'client/utils/localDataStorage';
import { toggleProgramDetailsModal } from 'common/actions/ui';
import type { LiveContentMode } from 'common/constants/constants';
import { PROGRAM_KEY_URL_PARAM, COOKIE_REDIRECT_URL, LIVE_CONTENT_MODES } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { fetchLinearReminders } from 'common/features/linearReminder/actions/linearReminder';
import { setLiveActiveContent } from 'common/features/playback/actions/live';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import {
  buildComponentInteractionEvent,
  buildDialogEvent,
  mapEPGContainerOptionToAnalyticsSection,
} from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { useWebEPGData } from 'web/hooks/useEPG';
import useEPGTimelineProps from 'web/hooks/useEPGTimelineProps';

import ProgramDetailsModal from './ProgramDetailsModal';

const trackEPGInteractionEvent = (id: string, containerId: string, rowIndex: number, colIndex: number) => {
  const event = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction: 'CONFIRM',
    section: {
      category_slug: containerId,
      content_tile: {
        video_id: parseInt(id, 10),
        row: rowIndex + 1,
        col: colIndex + 1,
      },
    },
    component: 'EPG',
  });
  trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
};

export interface EPGProps {
  mode?: LiveContentMode;
  location?: Location;
}

const EPG = ({ mode = LIVE_CONTENT_MODES.all }: EPGProps) => {
  const {
    advancedTimeCounter,
    backToLiveCTAText,
    currentTime,
    endTime,
    onAdvanceTimeline,
    onRetreatTimeline,
    onTimelineBackToLive,
    startTime,
    timeFormatter,
  } = useEPGTimelineProps();

  const { contentIds, containers, channelInfoById, programDetailsByKey, onChannelEnteredView } = useWebEPGData(
    mode,
    startTime.getTime(),
    endTime.getTime()
  );

  const dispatch = useAppDispatch();
  const activeChannelId = useAppSelector((state) => state.live.activeContentId);
  useEffect(() => {
    if (activeChannelId === '' && contentIds[0]) {
      dispatch(
        setLiveActiveContent({
          contentId: contentIds[0],
          containerId: containers[0]?.id,
        })
      );
    }
  }, [activeChannelId, containers, contentIds, dispatch]);

  const { programKey: selectedProgramKey, isOpen: isProgramDetailsOpen } = useAppSelector(
    (state) => state.ui.programDetailsModal
  );

  // Load linear reminders
  useEffect(() => {
    dispatch(fetchLinearReminders());
  }, [dispatch]);

  const onChannelClick = useCallback(
    (id: string, containerId: string) => {
      const contentRowIndex = contentIds.indexOf(id);
      dispatch(
        setLiveActiveContent({
          contentId: id,
          containerId,
          contentIndex: contentRowIndex,
          programIndex: 0,
        })
      );
      trackEPGInteractionEvent(id, containerId, contentRowIndex, 0);
    },
    [contentIds, dispatch]
  );

  const showProgramDetails = useCallback(
    (programKey: string) => {
      if (programDetailsByKey[programKey]) {
        dispatch(toggleProgramDetailsModal({ isOpen: true, programKey }));
      }
    },
    [programDetailsByKey, dispatch]
  );

  // show program details modal after login
  const query = useLocation().query;

  useEffect(() => {
    if (query && query[PROGRAM_KEY_URL_PARAM] && getCookie(COOKIE_REDIRECT_URL)) {
      const programKey = query[PROGRAM_KEY_URL_PARAM] as string;
      if (programDetailsByKey[programKey]) {
        showProgramDetails(programKey);
        removeCookie(COOKIE_REDIRECT_URL);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programDetailsByKey]);

  const onProgramClick = useCallback(
    (programKey: string, isInProgress: boolean, containerId: string) => {
      const program = programDetailsByKey[programKey];
      if (isInProgress) {
        const contentRowIndex = contentIds.indexOf(program.channelId);
        dispatch(
          setLiveActiveContent({
            contentId: program.channelId,
            containerId,
            contentIndex: contentRowIndex,
            programIndex: 1,
          })
        );
        trackEPGInteractionEvent(program.channelId, containerId, contentRowIndex, 1);
      } else {
        showProgramDetails(programKey);
      }
    },
    [contentIds, dispatch, programDetailsByKey, showProgramDetails]
  );

  const onFilterClick = useCallback(({ id }: FilterItem) => {
    const event = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      section: mapEPGContainerOptionToAnalyticsSection(id),
      component: 'MIDDLE_NAV',
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
  }, []);

  const closeProgramDetails = useCallback(
    (programId?: number) => {
      const dialogEvent = buildDialogEvent(
        getCurrentPathname(),
        DialogType.PROGRAM_INFORMATION,
        ANALYTICS_COMPONENTS.epgComponent,
        DialogAction.DISMISS_DELIBERATE,
        { video_id: programId }
      );
      trackEvent(eventTypes.DIALOG, dialogEvent);
      dispatch(toggleProgramDetailsModal({ isOpen: false, programKey: '' }));
    },
    [dispatch]
  );

  return (
    <Fragment>
      <EPGComponent
        activeChannelId={activeChannelId}
        containers={containers}
        channelInfoById={channelInfoById}
        onChannelClick={onChannelClick}
        onProgramClick={onProgramClick}
        onProgramInfoClick={showProgramDetails}
        onFilterClick={onFilterClick}
        onChannelEnteredView={onChannelEnteredView}
        currentTime={currentTime}
        startTime={startTime}
        endTime={endTime}
        timeFormatter={timeFormatter}
        backToLiveCTAText={backToLiveCTAText}
        onAdvanceTimeline={onAdvanceTimeline}
        onRetreatTimeline={onRetreatTimeline}
        onTimelineBackToLive={onTimelineBackToLive}
        advancedTimeCounter={advancedTimeCounter}
      />
      <ProgramDetailsModal
        isOpen={isProgramDetailsOpen}
        close={closeProgramDetails}
        programDetails={programDetailsByKey[selectedProgramKey]}
      />
    </Fragment>
  );
};

export default memo(EPG);
