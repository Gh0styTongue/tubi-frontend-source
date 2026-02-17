import { EPG } from '@tubitv/web-ui';
import React, { useCallback, useEffect, useMemo } from 'react';

import { loadEPGInfoByContentIds } from 'common/actions/epg';
import { toggleProgramDetailsModal } from 'common/actions/ui';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { byIdSelector, channelSelector } from 'common/selectors/epg';
import { getProgramDetailsByKey, transChannelInfo } from 'common/utils/epg';
import ProgramDetailsModal from 'web/components/EPG/ProgramDetailsModal';
import useEPGTimelineProps from 'web/hooks/useEPGTimelineProps';

import styles from './EpgRow.scss';

interface Props {
  channelId: string;
}

const EpgRow = ({ channelId }: Props) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadEPGInfoByContentIds([channelId]));
  }, [channelId, dispatch]);

  const byId = useAppSelector(byIdSelector);
  const channel = useAppSelector((state) => channelSelector(state, channelId));
  const { programKey, isOpen } = useAppSelector((state) => state.ui.programDetailsModal);

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

  const programDetailsByKey = useMemo(() => getProgramDetailsByKey([channelId], byId), [channelId, byId]);

  const channelInfoById = useMemo(
    () => ({
      [channelId]: transChannelInfo({
        id: channelId,
        channel,
        timelineStart: startTime.getTime(),
        timelineEnd: endTime.getTime(),
      }),
    }),
    [channel, channelId, startTime, endTime]
  );

  const onProgramClick = useCallback(
    (programKey: string, isInProgress: boolean) => {
      if (!isInProgress && programDetailsByKey[programKey]) {
        dispatch(toggleProgramDetailsModal({ isOpen: true, programKey }));
      }
    },
    [dispatch, programDetailsByKey]
  );

  const onModalClose = useCallback(() => {
    dispatch(toggleProgramDetailsModal({ isOpen: false, programKey: '' }));
  }, [dispatch]);

  const epgProps = {
    activeChannelId: channelId,
    advancedTimeCounter,
    backToLiveCTAText,
    channelInfoById,
    containers: [
      {
        id: '',
        name: '',
        channelIds: [channelId],
      },
    ],
    currentTime,
    endTime,
    onAdvanceTimeline,
    onProgramClick,
    onProgramInfoClick: (programKey: string) => onProgramClick(programKey, false),
    onRetreatTimeline,
    onTimelineBackToLive,
    startTime,
    timeFormatter,
  };

  const modalProps = {
    isOpen,
    programDetails: programDetailsByKey[programKey],
    close: onModalClose,
  };

  return (
    <div className={styles.root}>
      <EPG {...epgProps} />
      <ProgramDetailsModal {...modalProps} />
    </div>
  );
};

export default EpgRow;
