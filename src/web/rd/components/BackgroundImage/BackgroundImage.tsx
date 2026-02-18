import classnames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useState, memo, useRef, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages } from 'react-intl';

import WebMobileDetailsRedesign from 'common/experiments/config/webMobileDetailsRedesign';
import useExperiment from 'common/hooks/useExperiment';
import type { Video } from 'common/types/video';
import { parseEpisodeInfo } from 'common/utils/episode';
import { useIntl } from 'i18n/intl';

import styles from './BackgroundImage.scss';

interface Props {
  preload?: boolean;
  src: string;
  srcMobile?: string;
  isMobileRedesign?: boolean;
  content?: Video;
  seriesContent?: Video;
  seriesTitle?: string;
  isNewDesign?: boolean;
}

const messages = defineMessages({
  posterAlt: {
    description: 'alternative text for poster background',
    defaultMessage: 'poster background',
  },
  episodeTitle: {
    description: 'episode title',
    defaultMessage: 'Season {season} Episode {episode} - {title}',
  },
});

// Matches the breakpoints defined here (<sMd):
// https://github.com/adRise/www/blob/924eaf07e6e978ad6936d7265a446e88faa237f2/packages/web-ui/src/styles/_responsive.scss#L13-L21
const desktopMediaQuery = '(min-width: 540px)';
const mobileMediaQuery = '(max-width: 539px)';

const BackgroundImage: FC<Props> = ({
  preload = false,
  src,
  srcMobile,
  isMobileRedesign,
  content,
  seriesContent,
  seriesTitle,
}) => {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const intl = useIntl();
  const { formatMessage } = intl;
  const imageStyle = classnames({
    [styles.load]: loaded,
  });
  const onLoad = useCallback(() => {
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (ref.current && ref.current.complete) {
      setTimeout(onLoad, 200);
    }
  }, [onLoad]);

  const webMobileDetailsRedesign = useExperiment(WebMobileDetailsRedesign);

  useEffect(() => {
    webMobileDetailsRedesign.logExposure();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract values from content prop
  const title = content?.title;
  const images = content?.images;
  const seriesId = content?.series_id;
  const isEpisode = !!seriesId;

  let artTitle = images?.title_art?.[0];
  if (seriesContent) {
    artTitle = seriesContent.images?.title_art?.[0];
  }

  const titleElement = useMemo(() => {
    if (!isMobileRedesign) {
      return null;
    }
    if (isEpisode && title) {
      const info = parseEpisodeInfo(title);
      return artTitle
        ? (
          <>
            <img className={styles.artTitle} src={artTitle} alt={title} />
            <h1 className={classnames(styles.title, styles.artTitleText)}>{title}</h1>
            <h2 className={styles.subTitle}>{info.season ? formatMessage(messages.episodeTitle, info) : title}</h2>
          </>
        )
        :
          <React.Fragment>
            <h1 className={styles.title}>{seriesTitle}</h1>
            <h2 className={styles.subTitle}>{info.season ? formatMessage(messages.episodeTitle, info) : title}</h2>
          </React.Fragment>;
    }

    return artTitle && title
      ? (
        <>
          <img className={styles.artTitle} src={artTitle} alt={title} />
          <h1 className={classnames(styles.title, styles.artTitleText)}>{title}</h1>
        </>
      )
      : title ? <h1 className={styles.title}>{title}</h1> : null;
  }, [isEpisode, artTitle, title, seriesTitle, formatMessage, isMobileRedesign]);

  return (
    <div className={classnames(styles.backgroundImage, { [styles.mobileRedesign]: isMobileRedesign })} data-test-id="web-background-image">
      {preload ? (
        <Helmet>
          <link rel="preload" as="image" href={src} media={desktopMediaQuery} />
          {srcMobile && <link rel="preload" as="image" href={srcMobile} media={mobileMediaQuery} />}
        </Helmet>
      ) : null}
      <picture>
        {srcMobile && <source srcSet={srcMobile} media={mobileMediaQuery} data-test-id="background-image-mobile-source" />}
        <img
          ref={ref}
          src={src}
          alt={intl.formatMessage(messages.posterAlt)}
          className={classnames(styles.image, imageStyle)}
          onLoad={onLoad}
        />
      </picture>
      {titleElement && (
        <div className={styles.titleContainer}>
          {titleElement}
        </div>
      )}
    </div>
  );
};

export default memo(BackgroundImage);
