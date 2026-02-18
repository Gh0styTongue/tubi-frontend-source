import { timeDiffInSeconds, toAMOrPM } from '@adrise/utils/lib/time';
import classNames from 'classnames';
import type { FC, ReactNode } from 'react';
import React, { useMemo } from 'react';
import type { MessageDescriptor } from 'react-intl';

import Badge from 'common/components/uilib/Badge/Badge';
import useAppSelector from 'common/hooks/useAppSelector';
import type { VideoRating, VideoSchedule } from 'common/types/video';
import { generateRatingDescriptorString } from 'common/utils/ratings';
import { secondsToHoursAndMinutes } from 'common/utils/timeFormatting';
import { SUPPORTED_LANGUAGE_LOCALE } from 'i18n/constants';
import { useIntl } from 'i18n/intl';
import type { TubiIntlShape } from 'i18n/intl';

import styles from './OTTContentMetaComponents.scss';

/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */
export const Delimiter: FC<{delimiter?: ReactNode}> = ({ delimiter }) => delimiter ?? <span className={styles.delimiter}>&middot;</span>;

export const StartedAt: FC<{
  startTime?: string;
  messages: Record<'startedAt', MessageDescriptor>;
}> = ({ startTime, messages }) => {
  const intl = useIntl();
  return startTime
    ? <div className={styles.startedAt}>{intl.formatMessage(messages.startedAt, { time: toAMOrPM(startTime) })}</div>
    : null;
};

export const TimeLeft: FC<{
  endTime?: string;
  /** Duration in seconds */ duration?: number;
  /** Elapsed time in seconds */ elapsed?: number;
  short?: boolean;
  accent?: boolean;
}> = ({ endTime, duration: durationProp, elapsed: elapsedProp, short, accent }) => {
  const intl = useIntl();
  const currentDate = useAppSelector(state => state.ui.currentDate);

  const duration = durationProp ?? timeDiffInSeconds(currentDate, endTime);
  const elapsedMs = elapsedProp ?? (endTime ? duration - timeDiffInSeconds(currentDate, endTime) : 0);
  const timeLeft = duration - elapsedMs;

  return (
    <div className={classNames(styles.timeLeft, { [styles.accent]: accent })}>
      {secondsToHoursAndMinutes(timeLeft, {
        formatMessage: intl.formatMessage,
        remaining: true,
        short,
      })}
    </div>
  );
};

export const Duration: FC<{ duration?: string | number; short?: boolean; className?: string, intl: TubiIntlShape }> = ({ duration = 0, short, className, intl }) => {
  const humanReadDuration = secondsToHoursAndMinutes(parseFloat(`${duration}`), { formatMessage: intl.formatMessage, short });
  if (!humanReadDuration) {
    return null;
  }
  const durationCls = classNames(styles.duration, className);
  return <div className={durationCls}>{humanReadDuration}</div>;
};

export const Progress: FC<{schedule?: VideoSchedule}> = ({
  schedule = { start_time: 0, end_time: 0 },
}) => {
  const [startTs, endTs] = useMemo(
    () => [
      new Date(schedule.start_time).getTime(),
      new Date(schedule.end_time).getTime(),
    ] as const,
    [schedule]
  );
  const now = useAppSelector(state => state.ui.currentDate.getTime());

  const duration = endTs - startTs;
  const elapsed = now - startTs;

  return (
    <progress
      aria-label="Elapsed Time"
      value={elapsed}
      max={duration}
      className={styles.progress}
    />
  );
};

export const SeriesInfo: FC<{
  seasonsCount?: number;
  messages: Record<'tvShow' | 'seasons' | 'season', MessageDescriptor>;
  showLabel?: boolean;
}> = ({ seasonsCount, messages, showLabel = true }) => {
  const intl = useIntl();

  const seriesLabel = intl.formatMessage(messages.tvShow);
  let seasonsLabel;
  if (seasonsCount && seasonsCount > 0) {
    seasonsLabel =
      seasonsCount > 1
        ? `${seasonsCount} ${intl.formatMessage(messages.seasons)}`
        : `1 ${intl.formatMessage(messages.season)}`;
  }
  return (
    <>
      { showLabel ? <span className={styles.series}>{seriesLabel}</span> : null }
      { seasonsLabel && showLabel ? <Delimiter /> : null }
      { seasonsLabel ? <span className={styles.series}>{seasonsLabel}</span> : null }
    </>
  );
};

// year component
export const Year: FC<{ year?: number; cls?: string }> = ({ year, cls }) => {
  const hostCls = classNames(styles.year, cls);
  return year ? <div className={hostCls} data-test-id="releaseYear">{year}</div> : null;
};

export const Period: FC<{ period?: string; cls?: string }> = ({ period, cls }) => {
  const hostCls = classNames(styles.period, cls);
  return period ? <div className={hostCls}>{period}</div> : null;
};

// language component
export const Language: FC<{ language?: string; cls?: string; separator?: string }> = ({ language, cls, separator }) => {
  const hostCls = classNames(styles.language, cls);
  if (language) {
    if (separator) {
      const langELe: (JSX.Element | string)[] = [];
      language.split(/\s*,\s*/).forEach((item, index) => {
        if (item) {
          if (index !== 0) langELe.push(separator);
          langELe.push(
            <div className={hostCls} key={index}>
              {item}
            </div>,
          );
        }
      });
      return <>{langELe}</>;
    }
    // if not specify separator, multiple languages will separated by comma as default
    return <div className={hostCls}>{language}</div>;
  }
  return null;
};

// Genre as a plain comma separated list;
export const GenreList: FC<{ genres?: string[]; cls?: string; delimiter?: ReactNode }> = ({
  genres = [],
  cls,
  delimiter = ', ',
}) => {
  if (genres.length === 0) return null;
  const genreCls = classNames(styles.genreList, cls);
  return (
    <div className={genreCls}>
      {genres.slice(0, 3).map((genre, idx, arr) => (
        <React.Fragment key={genre}>
          {genre}
          {idx < arr.length - 1 && delimiter}
        </React.Fragment>
      ))}
    </div>
  );
};

export const League: FC<{league?: string}> = ({ league }) => league != null ? <div className={styles.league}>{league}</div> : null;

export const ChannelTitle: FC<{channelTitle?: string}> = ({ channelTitle }) => channelTitle != null ? <div className={styles.channelTitle}>{channelTitle}</div> : null;

export const Rating: FC<{ ratings: VideoRating[]; cls?: string }> = ({ ratings = [], cls }) => {
  const ratingArr = ratings.map((item) => item.value);
  if (ratingArr.length === 0) return null;
  const className = classNames(styles.rating, styles.ratingBadge, cls);
  const text = ratingArr[0];
  return <Badge text={text} className={className} />;
};

export const FullHD: FC<{ cls?: string }> = ({ cls }) => {
  const className = classNames(styles.fullHDBadge, cls);
  return <Badge text="Full HD" className={className} />;
};

export const RatingDescriptor: FC<{ ratings: VideoRating[]; cls?: string }> = ({ ratings = [], cls }) => {
  if (ratings.length === 0) return null;
  const className = classNames(styles.rating, styles.ratingBadge, styles.ratingDescriptor, cls);
  const text = generateRatingDescriptorString(ratings[0].descriptors, true);
  if (!text) return null;
  return <span className={className}>{text}</span>;
};

/**
 * OTT cast row is a simple version of the new-brand therefore a simple component
 * makes more sense than trying to make Director work for both
 */
export const Casts: FC<{
  castType?: string;
  castList: string[];
  isCastListVertical?: boolean;
  className?: string;
  maxRow?: number;
  language?: typeof SUPPORTED_LANGUAGE_LOCALE[keyof typeof SUPPORTED_LANGUAGE_LOCALE];
}> = ({
  castType,
  castList = [],
  isCastListVertical = false,
  className,
  maxRow = 4,
  language = SUPPORTED_LANGUAGE_LOCALE.EN_US,
}) => {
  if (!castType || !castList.length) return null;

  return (
    <div data-test-id="ott-component-casts" className={classNames(styles.castSection, className)}>
      <span
        className={classNames(styles.castType, {
          [styles.castTypeOnLanguageES]: isCastListVertical && language === SUPPORTED_LANGUAGE_LOCALE.ES_MX,
          [styles.castTypeOnLanguageEN]: isCastListVertical && language === SUPPORTED_LANGUAGE_LOCALE.EN_US,
        })}
      >
        {castType}
      </span>
      {isCastListVertical ? (
        <span className={classNames(styles.castList, styles.castListVertical, styles[`maxRowIs${maxRow}` as keyof typeof styles])}>
          {castList.map((v) => (
            <span key={v} className={styles.castListItem}>
              {v}
            </span>
          ))}
        </span>
      ) : (
        <span className={classNames(styles.castList, styles.castListHorizontal)}>{castList.join(', ')}</span>
      )}
    </div>
  );
};

export const highContrast = styles.highContrast;
