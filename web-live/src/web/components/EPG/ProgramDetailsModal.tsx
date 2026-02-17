import { convertToDate, toAMOrPM } from '@adrise/utils/lib/time';
import { toCSSUrl } from '@adrise/utils/lib/url';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { Subtitles, Close } from '@tubitv/icons';
import React, { Fragment, useCallback, useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { RatingWithDescriptor } from 'common/components/VideoComponents/VideoComponents';
import * as eventTypes from 'common/constants/event-types';
import { webKeys } from 'common/constants/key-map';
import type { VideoRating } from 'common/types/video';
import { buildDialogEvent } from 'common/utils/analytics';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { getProgramRowTitle } from 'common/utils/epg';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import Overlay from 'web/components/Overlay/Overlay';

import styles from './ProgramDetailsModal.scss';

const messages = defineMessages({
  startsAt: {
    description: 'program start time',
    defaultMessage: 'Starts at {time}',
  },
  setReminder: {
    description: 'set reminder button text for linear program',
    defaultMessage: 'Set Reminder',
  },
  reminderSet: {
    description: 'State shows your have set the video into your reminder list',
    defaultMessage: 'Remove Reminder',
  },
});

export interface ProgramDetails {
  backgroundImage: string;
  logoImage: string;
  title: string;
  subTitle?: string;
  description: string;
  hasSubtitle: boolean;
  startTime: string;
  ratings?: VideoRating[];
  keywords?: string[];
  // When the program information is currently unavailable, `programId` will not exist. Therefore, ProgramDetailsModal needs to handle the case when programId is undefined to avoid JS errors.
  programId?: number;
  programKey: string;
  channelId: string;
}

export interface ProgramDetailsModalProps {
  isOpen: boolean;
  close: (programId?: number) => void;
  programDetails: ProgramDetails;
}

const ProgramDetailsModal = ({ programDetails, isOpen, close }: ProgramDetailsModalProps) => {
  const handleOnClick = useCallback(() => {
    close(programDetails?.programId);
  }, [programDetails, close]);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      if (e.keyCode === webKeys.escape) {
        e.preventDefault();
        e.stopPropagation();
        handleOnClick();
      }
    };

    if (isOpen) {
      addEventListener(document, 'keydown', keyboardHandler);
    }

    return () => {
      if (isOpen) {
        removeEventListener(document, 'keydown', keyboardHandler);
      }
    };
  }, [handleOnClick, isOpen]);

  return (
    <Overlay isOpen={isOpen} onClickOverlay={handleOnClick} nodeRef={modalRef}>
      <div data-test-id="program-details-modal" ref={modalRef} className={styles.modal}>
        <div className={styles.close}>
          <Close onClick={handleOnClick} />
        </div>
        {programDetails ? <ProgramDetailsModalImpl isOpen={isOpen} programDetails={programDetails} /> : null}
      </div>
    </Overlay>
  );
};

const ProgramDetailsModalImpl = ({ programDetails, isOpen }: Omit<ProgramDetailsModalProps, 'close'>) => {
  const intl = useIntl();

  const programTitle = getProgramRowTitle({
    keywords: programDetails.keywords,
    title: programDetails.title,
    episode_title: programDetails.subTitle,
  });

  useEffect(() => {
    if (isOpen) {
      const dialogEvent = buildDialogEvent(
        getCurrentPathname(),
        DialogType.PROGRAM_INFORMATION,
        ANALYTICS_COMPONENTS.epgComponent,
        DialogAction.SHOW,
        { video_id: programDetails.programId }
      );
      trackEvent(eventTypes.DIALOG, dialogEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const startTimeDate = convertToDate(programDetails.startTime);

  return (
    <Fragment>
      <div
        className={styles.background}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(16, 20, 31, 0) 42.42%, #1C1F29 100%), ${toCSSUrl(
            programDetails.backgroundImage
          )}`,
        }}
      />
      <div className={styles.details}>
        <div className={styles.logo}>
          <img src={programDetails.logoImage} alt={programTitle} />
        </div>
        <div className={styles.title}>{programTitle}</div>
        <div className={styles.timeTagContainer}>
          {startTimeDate ? (
            <div className={styles.time}>
              {intl.formatMessage(messages.startsAt, {
                time: `${toAMOrPM(startTimeDate)}`,
              })}
            </div>
          ) : null}
          <div className={styles.tags}>
            {programDetails.hasSubtitle ? <Subtitles className={styles.ccIcon} /> : null}
            <RatingWithDescriptor rating={programDetails.ratings} />
          </div>
        </div>
        <div className={styles.description}>{programDetails.description}</div>
      </div>
    </Fragment>
  );
};

export default ProgramDetailsModal;
