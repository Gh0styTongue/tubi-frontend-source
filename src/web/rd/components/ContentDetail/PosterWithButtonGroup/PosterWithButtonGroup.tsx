import { Poster } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React from 'react';

import { useProgressSubscription } from 'common/features/playback/hooks/usePlayerProgress';
import type { Series } from 'common/types/series';
import type { Video } from 'common/types/video';
import ButtonGroup from 'web/rd/components/ContentDetail/ButtonGroup/ButtonGroup';
import type { ContentDetailProps } from 'web/rd/components/ContentDetail/ContentDetail';

import styles from './PosterWithButtonGroup.scss';

interface Props
  extends Pick<
    ContentDetailProps,
    'onClickWatch' | 'posterUrl' | 'content' | 'belongSeries' | 'isSeriesDetail'
  > {
  className?: string;
  isContentUnavailable: boolean;
  showRemindMe: boolean;
  posterSrcSet?: string;
  posterSizes?: string;
  posterAlt?: string;
}

const PosterWithButtonGroup: FC<Props> = ({
  onClickWatch,
  posterUrl,
  posterSrcSet,
  posterSizes,
  posterAlt,
  content,
  belongSeries,
  isContentUnavailable,
  className,
  isSeriesDetail,
  showRemindMe,
}) => {
  const { id, is_recurring: isRecurring, title, type } = content as Video & Series; // TODO(zhuo): better type;

  const { duration, position } = useProgressSubscription();

  return (
    <div className={classnames(styles.posterContainer, className)}>
      <Poster
        alt={posterAlt}
        src={posterUrl}
        srcSet={posterSrcSet}
        sizes={posterSizes}
        progress={isContentUnavailable ? undefined : (position / duration)}
      />
      <ButtonGroup
        id={id}
        belongSeries={belongSeries}
        isRecurring={isRecurring}
        type={type}
        title={title}
        onClickWatch={onClickWatch}
        isSeriesDetail={isSeriesDetail}
        showRemindMe={showRemindMe}
      />
    </div>
  );
};

export default PosterWithButtonGroup;
