/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import { Play } from '@tubitv/icons';
import { Attributes, Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import TubiOriginal from 'common/components/uilib/SvgLibrary/TubiOriginal';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import type { VideoType } from 'common/types/video';

import styles from '../SuperBowl.scss';
import messages from '../superBowlMessages';

export interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  description2?: string;
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
    title,
    description,
    description2,
    poster,
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
  const CardImage = (
    <div
      className={classNames(styles.contentCardImage, { [styles.card2]: !!description2 })}
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
          {!!description2 && <p className={styles.contentCardDescription2}>{description2}</p>}
        </div>
        {needsLogin ? (
          null
        ) : (
          <WatchNowButton linkTo={linkTo ?? WEB_ROUTES.home} />
        )}
      </div>
    </div>
  );
};

export default ContentCard;
