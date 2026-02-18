/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import { toAMOrPM, isSameDay } from '@adrise/utils/lib/time';
import { BellNotification, BellNotificationFilled, Live24, LockClosed24, Play } from '@tubitv/icons';
import { Attributes, Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import TubiOriginal from 'common/components/uilib/SvgLibrary/TubiOriginal';
import { LINEAR_CONTENT_TYPE, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import { usePurpleCarpetCountdown } from 'common/features/purpleCarpet/hooks/usePurpleCarpet';
import useAppSelector from 'common/hooks/useAppSelector';
import type { Video, VideoType } from 'common/types/video';
import { getDeepLinkForVideo, getUrl } from 'common/utils/urlConstruction';
import useReminder from 'web/rd/components/ContentDetail/RemindButton/useReminder';

import styles from '../SuperBowl.scss';
import messages from '../superBowlMessages';

export interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  poster: string;
  year?: number;
  seriesSeasonNum?: number;
  time?: string[];
  rating?: string;
  needsLogin?: boolean;
  genreTags?: string[] | React.ReactNode[];
  badges?: React.ReactNode[];
  hasCC?: boolean;
  oneLineAttributes?: boolean;
  isTubiOriginal?: boolean;
  handleClickCardButton?: () => void;
  linkTo?: string;
  airDatetime: string;
  shouldIgnorePcStatus?: boolean;
  type: VideoType;
  linkToDetails?: string;
  runTime?: string;
  isBottomContent?: boolean;
  disableLink?: boolean;
}

export const useCountDownTimer = ({ airDatetime, id, shouldIgnorePcStatus }: Pick<ContentCardProps, 'airDatetime' | 'id' | 'shouldIgnorePcStatus'>) => {
  const intl = useIntl();
  const startTime = new Date(airDatetime).getTime();
  const { timeDiff } = usePurpleCarpetCountdown(startTime, id, shouldIgnorePcStatus);
  const currentDate = useAppSelector((state) => state.ui.currentDate);
  const isToday = startTime ? isSameDay(new Date(startTime), currentDate) : false;
  const timeStrings: string[] = [];
  let dateString = '';
  if (!airDatetime) return {};

  if (timeDiff) {
    const date = intl.formatDate(startTime, {
      month: 'short',
      day: 'numeric',
    });
    dateString = !isToday
      ? intl.formatMessage(messages.gameLiveDate, {
        date,
      })
      : intl.formatMessage(messages.gameRemainDay, {
        time: toAMOrPM(startTime),
      });

    if (timeDiff.minutes) {
      timeStrings.push(
        intl.formatMessage(messages.gameRemainMin, {
          minutes: timeDiff.minutes,
        })
      );
    }
    if (timeDiff.hours) {
      timeStrings.unshift(
        intl.formatMessage(messages.gameRemainHour, {
          hours: timeDiff.hours || 0,
        })
      );
    }
    if (timeDiff.days) {
      timeStrings.unshift(
        intl.formatMessage(messages.gameRemainDay, {
          days: timeDiff.days,
        })
      );
    }
    if (!timeStrings.length) {
      timeStrings.push(
        intl.formatMessage(messages.gameRemainMin, {
          minutes: 1,
        })
      );
    }
  }

  return { timeStrings, dateString };
};

const isCurrentTimeAfterDate = (utcString: string, currentTime: Date) => {
  try {
    const date = new Date(utcString);
    return currentTime >= date;
  } catch (error) {
    return false;
    // do nothing
  }
};

const isCurrentTimeSameDay = (utcString: string, currentTime: Date) => {
  try {
    const date = new Date(utcString);
    const futureDateMs = date.getTime();
    const currentDateMs = currentTime.getTime();
    return (futureDateMs - currentDateMs) < 43200000; // 12 hours
  } catch (error) {
    return false;
    // do nothing
  }
};

const ReminderButton: React.FC<{ className?: string; linkTo?: string, content: ContentCardProps }> = ({
  content,
}) => {
  const intl = useIntl();
  const { dispatchReminderAction, hasReminderSet } = useReminder({
    contentId: content.id,
    contentTitle: content.title,
    contentType: content.type,
  });

  const handleClick = useCallback(() => {
    dispatchReminderAction?.();
  }, [dispatchReminderAction]);

  return (
    <div>
      <Button
        size="small"
        className={styles.reminderButton}
        icon={hasReminderSet ? BellNotificationFilled : BellNotification}
        onClick={handleClick}
      >
        {intl.formatMessage(hasReminderSet ? messages.reminderSet : messages.remindMe)}
      </Button>
    </div>
  );
};

export const SignInToWatchButton: React.FC<{ className?: string; linkTo?: string, content: ContentCardProps }> = (buttonProps) => {
  const {
    className,
    linkTo,
    content,
  } = buttonProps;

  const intl = useIntl();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const currentTime = useAppSelector((state) => state.ui.currentDate);
  const shouldShowWatchLive = isCurrentTimeAfterDate(content.airDatetime, currentTime);
  const shouldShowDetails = isCurrentTimeSameDay(content.airDatetime, currentTime);
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const deviceId = useAppSelector(state => state.auth.deviceId);
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);

  if (isLoggedIn) {
    if (shouldShowWatchLive) {
      let videoUrl = getUrl({
        id: content.id,
        title: content.title,
        type: LINEAR_CONTENT_TYPE, // to linear playback page
      });
      const ButtonComp = (
        <Button
          size="small"
          className={styles.signInButton}
          icon={Live24}
        >
          {intl.formatMessage(messages.watchLiveNow)}
        </Button>
      );
      if (isMobile) {
        videoUrl = getDeepLinkForVideo({
          type: LINEAR_CONTENT_TYPE,
          id: content.id,
          title: content.title,
          player_type: 'fox',
        } as Video, deviceId, {
          stopTracking: !isThirdPartySDKTrackingEnabled,
        });
        return (
          <a
            href={videoUrl}
            className={classNames(className, styles.signInButtonLink)}
          >
            {ButtonComp}
          </a>
        );
      }
      return (
        <Link
          to={videoUrl}
          className={classNames(className, styles.signInButtonLink)}
        >
          {ButtonComp}
        </Link>
      );
    }
    if (shouldShowDetails) {
      return (
        <Link
          to={getUrl({
            id: content.id,
            title: content.title,
            type: VIDEO_CONTENT_TYPE,
          })}
          className={classNames(className, styles.signInButtonLink)}
        >
          <Button
            size="small"
            className={styles.detailsButton}
            appearance="tertiary"
          >
            {intl.formatMessage(messages.details)}
          </Button>
        </Link>
      );
    }
    return (
      <ReminderButton {...buttonProps} />
    );
  }
  return (
    <Link
      to={linkTo ? `${WEB_ROUTES.register}?redirect=${encodeURIComponent(linkTo)}` : `${WEB_ROUTES.register}?redirect=${WEB_ROUTES.superBowl}`}
      className={classNames(className, styles.signInButtonLink)}
    >
      <Button
        size="small"
        className={styles.signInButton}
        tag={intl.formatMessage(messages.freeTag)}
        icon={LockClosed24}
      >
        {intl.formatMessage(messages.signInButton)}
      </Button>
    </Link>
  );
};

const WatchNowButton: React.FC<{ handleClick?: () => void; linkTo: string }> = ({ handleClick, linkTo }) => {
  const intl = useIntl();
  const isLoggedIn = useAppSelector(isLoggedInSelector);

  return (
    <Link to={linkTo}>
      <Button
        size="small"
        className={styles.signInButton}
        tag={isLoggedIn ? undefined : intl.formatMessage(messages.freeTag)}
        icon={Play}
        onClick={handleClick}
      >
        {intl.formatMessage(messages.watchNow)}
      </Button>
    </Link>
  );
};

const ContentCard: React.FC<ContentCardProps> = (contentProps) => {
  const {
    id,
    title,
    description,
    poster,
    airDatetime,
    needsLogin,
    year,
    genreTags,
    hasCC,
    rating,
    seriesSeasonNum,
    oneLineAttributes,
    isTubiOriginal,
    linkTo,
    linkToDetails,
    runTime,
    isBottomContent,
    disableLink,
  } = contentProps;
  let { badges } = contentProps;
  if (isTubiOriginal) {
    badges = [...(badges || []), <TubiOriginal className={styles.tubiOriginalIcon} />];
  }
  // PurpleCarpet should be not PurpleCarpetStatus.NotAvailable, otherwise it will not show the countdown timer
  const { timeStrings, dateString } = useCountDownTimer({ airDatetime, id, shouldIgnorePcStatus: true });

  const CardImage = (
    <div
      className={styles.contentCardImage}
      style={{ backgroundImage: `url(${poster})` }}
      role="img"
      aria-label={title}
    />
  );
  return (
    <div className={styles.contentCard}>
      {disableLink ?
        CardImage
        :
        <Link to={linkToDetails || linkTo!} title={title}>
          {CardImage}
        </Link>
      }

      <div className={classNames(styles.contentCardBody, { [styles.bottom]: isBottomContent })}>
        <div className={classNames(styles.contentCardBodyInner, { [styles.bottom]: isBottomContent })}>
          {timeStrings?.length || dateString ? (
            <div className={styles.labelRow}>
              {dateString ? <div className={styles.dateLabel}>{dateString}</div> : null}
              {timeStrings.map((time, index) => (
                <div key={index} className={styles.timeLabel}>
                  {time}
                </div>
              ))}
            </div>
          ) : null}
          <h2 className={styles.contentCardTitle}>{title}</h2>
          <div className={styles.attributes}>
            <Attributes
              oneLineAttributes={oneLineAttributes}
              year={year}
              rating={rating}
              tags={genreTags}
              badges={badges}
              cc={hasCC}
              seriesSeasonNum={seriesSeasonNum}
              isBadgeAfterRating
              runTime={runTime}
            />
          </div>
          <p className={styles.contentCardDescription}>{description}</p>
        </div>
        {needsLogin ? (
          <SignInToWatchButton linkTo={linkTo} content={contentProps} />
        ) : (
          <WatchNowButton linkTo={linkTo ?? WEB_ROUTES.home} />
        )}
      </div>
    </div>
  );
};

export default ContentCard;
