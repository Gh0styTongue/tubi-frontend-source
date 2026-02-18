import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { Attributes } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import { START_TRAILER, FINISH_TRAILER } from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import type { Video } from 'common/types/video';
import { trackEvent } from 'common/utils/track';
import { makeFullUrl } from 'common/utils/urlManipulation';
import baseStyles from 'src/web/features/watchSchedule/containers/Landing/Banner/Banner.scss';
import messages from 'src/web/features/watchSchedule/containers/Landing/Banner/bannerMessages';
import ComingSoonLabel from 'web/components/ContentDetail/ComingSoonLabel';
import TruncatedText from 'web/components/TruncatedText/TruncatedText';
import { getContentId } from 'web/features/upcoming/utils/landing';

import styles from './Banner.scss';
import RemindButton from './RemindButton/RemindButton';

interface Props {
  content: Video;
}

const Banner: React.FC<Props> = ({ content }) => {
  const { formatMessage } = useIntl();
  const videoRef = React.createRef<HTMLVideoElement>();

  const {
    id,
    type,
    title,
    year,
    ratings,
    tags = [],
    has_subtitle: captionsAvailable,
    availability_starts: availabilityStarts,
    landscape_images: landscapeImages = [],
    trailers,
  } = content;

  const contentId = getContentId(content);
  const imageUrl = makeFullUrl(landscapeImages[0]);
  const trailerUrl = trailers?.[0]?.url;

  const attributesProps = {
    label: <span className={baseStyles.text}>{[year, ...tags].filter(Boolean).join(' · ')}</span>,
    rating: ratings?.[0]?.value,
    cc: captionsAvailable,
  };

  const trackStartTrailerEvent = useCallback(() => {
    trackEvent(START_TRAILER, { video_id: id, video_player: PlayerDisplayMode.BANNER });
  }, [id]);

  const trackFinishTrailerEvent = useCallback(() => {
    trackEvent(FINISH_TRAILER, { video_id: id, end_position: Math.floor((videoRef.current?.currentTime || 0) * 1000) });
  }, [id, videoRef]);

  return (
    <div className={classNames(baseStyles.root, styles.root)}>
      <div className={styles.trailer}>
        <video
          ref={videoRef}
          controls
          autoPlay
          poster={imageUrl}
          onPlay={trackStartTrailerEvent}
          onEnded={trackFinishTrailerEvent}
        >
          <source src={trailerUrl} type="video/mp4" />
        </video>
      </div>

      <div className={classNames(baseStyles.main, styles.main)}>
        <ComingSoonLabel className={styles.comingSoonLabel} date={availabilityStarts} />
        <h1>{title}</h1>
        <div className={baseStyles.metadata}>
          <Attributes {...attributesProps} />
          <TruncatedText maxLine={5} readMoreText={formatMessage(messages.readMore)}>
            {content.description?.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </TruncatedText>
          <RemindButton contentId={contentId} contentType={type} contentTitle={title} />
        </div>

        <Link className={baseStyles.brandWrapper} target="_blank" to={WEB_ROUTES.home}>
          <div className={baseStyles.glowTop} />
          <div className={baseStyles.glowBottom} />
          <div className={baseStyles.brand}>
            <Tubi className={baseStyles.logo} />
            <p>{formatMessage(messages.brandSlogan)}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Banner;
