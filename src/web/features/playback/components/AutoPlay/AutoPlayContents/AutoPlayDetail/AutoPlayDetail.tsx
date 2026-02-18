import { ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import type { Video } from 'common/types/video';

import AutoPlayContentMetadata from './AutoPlayContentMetadata/AutoPlayContentMetadata';
import styles from './AutoPlayDetail.scss';

const messages = defineMessages({
  startingIn: {
    defaultMessage: 'Starting in {seconds} s',
    description: 'starting in an amount of seconds',
  },
});

export interface AutoPlayDetailProps {
  content: Video,
  className?: string,
  counter?: number,
  toUrl: string,
  onLinkClick: (e?: React.MouseEvent) => void,
}

const AutoPlayDetail: FC<AutoPlayDetailProps> = ({ content, className, counter, toUrl, onLinkClick }) => {
  const intl = useIntl();

  const handleLinkClick = useCallback((event?: React.MouseEvent) => {
    event?.preventDefault();
    onLinkClick(event);
  }, [onLinkClick]);

  const {
    title,
    description,
    year,
    duration,
    tags: genres = [],
    ratings = [],
    has_subtitle: showCC,
  } = content;

  return (
    <div className={classNames(styles.autoplayDetail, className)}>
      {counter ? (
        <div className={styles.counter}>
          {intl.formatMessage(messages.startingIn, { seconds: counter })}
        </div>
      ) : null}
      <div>
        <ATag
          onClick={handleLinkClick}
          to={toUrl}
          className={styles.title}
        >
          {title}
        </ATag>
      </div>
      <AutoPlayContentMetadata
        duration={duration}
        year={year}
        ratings={ratings}
        genres={genres}
        showCC={showCC}
      />
      <div className={styles.description}>{description}</div>
    </div>
  );
};

export default AutoPlayDetail;
