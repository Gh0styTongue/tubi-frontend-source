import { useBreakpoint } from '@tubitv/web-ui';
import dayjs from 'dayjs';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import useAppSelector from 'common/hooks/useAppSelector';
import { getSeasonAndEpisodeNumberText } from 'common/utils/episode';
import LiveLabel from 'web/features/watchSchedule/components/LiveLabel/LiveLabel';
import {
  isSportsEventSelector,
  liveChannelUrlSelector,
  nowSelector,
  programmingByContentIdSelector,
  upcomingProgramSelector,
} from 'web/features/watchSchedule/selectors/landing';

import { SmallScreenLayout, SmallMediumScreenLayout, LargeScreenLayout } from './Layouts';
import styles from './ProgramDetail.scss';
import messages from '../bannerMessages';

const ProgramDetail = () => {
  const { formatMessage } = useIntl();
  const bp = useBreakpoint();
  const isSportsEvent = useAppSelector(isSportsEventSelector);
  const now = useAppSelector(nowSelector);
  const program = useAppSelector((state) => upcomingProgramSelector(state, now));

  const programming = useAppSelector((state) => {
    return program && programmingByContentIdSelector(state, program.content_id);
  })!;

  const liveChannelLink = useAppSelector((state) => {
    return program && liveChannelUrlSelector(state, program.content_id);
  })!;

  if (!program) {
    return null;
  }

  const startTime = dayjs(program.start_time);
  const endTime = dayjs(program.end_time);
  const isLive = now.isAfter(startTime) && now.isBefore(endTime);

  const isSmallScreen = (bp.xs || bp.sm) && !bp.sMd;
  const isSmallMediumScreen = bp.sMd && !bp.md;

  const commonProgrammingTitleAttrs = {
    title: programming.title,
    a: (chunks: React.ReactNode) => (
      <React.Fragment>
        &nbsp;<Link to={liveChannelLink}>{chunks}</Link>
      </React.Fragment>
    ),
  };

  let programmingTitle = formatMessage(messages.programmingTitle, {
    ...commonProgrammingTitleAttrs,
    b: (chunks: React.ReactNode) => <b>{chunks}</b>,
    time: now.isSame(startTime, 'days')
      ? formatMessage(messages.todayTime, { time: startTime.format('h:mm A') })
      : startTime.format('MMM D, h:mm A'),
  });

  const commonProgramTitleAttrs = {
    title: isSportsEvent
      ? program.episode_title
      : `${getSeasonAndEpisodeNumberText({
        formatMessage,
        season: program.season_number as number,
        episode: program.episode_number as number,
      })} - ${program.episode_title}`,
    br: isSmallScreen ? <br /> : <React.Fragment>&nbsp;</React.Fragment>,
  };

  let programTitle = formatMessage(messages.programTitle, {
    ...commonProgramTitleAttrs,
    duration: endTime.diff(startTime, 'minutes'),
  });

  if (isLive) {
    programmingTitle = formatMessage(messages.liveProgrammingTitle, {
      ...commonProgrammingTitleAttrs,
      badge: <LiveLabel />,
      span: (chunks) => <span>{chunks}</span>,
    });

    programTitle = formatMessage(messages.liveProgramTitle, {
      ...commonProgramTitleAttrs,
      left: endTime.diff(now, 'minutes'),
    });
  }

  if (isSportsEvent) {
    programTitle = commonProgramTitleAttrs.title;
  }

  const props = {
    isLive,
    liveChannelLink,
    program,
    programTitle,
    programmingTitle,
  };

  let Layout = LargeScreenLayout;
  if (isSmallScreen) {
    Layout = SmallScreenLayout;
  } else if (isSmallMediumScreen) {
    Layout = SmallMediumScreenLayout;
  }

  return (
    <div className={styles.root}>
      <Layout {...props} />
    </div>
  );
};

export default ProgramDetail;
