import { LockClosedFilled24 } from '@tubitv/icons';
import classNames from 'classnames';
import type { CSSProperties, FC } from 'react';
import React, { useCallback, useState } from 'react';

import { LINEAR_CONTENT_TYPE, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import { PurpleCarpetBadges } from 'common/features/purpleCarpet/components/Badges/Badges';
import { useEventData } from 'common/features/purpleCarpet/hooks/usePurpleCarpet';
import { shouldLockPurpleCarpetSelector } from 'common/features/purpleCarpet/selector';
import { PurpleCarpetContentStatus } from 'common/features/purpleCarpet/type';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import type { Video } from 'common/types/video';
import { getUrl } from 'common/utils/urlConstruction';

import styles from './PurpleCarpetPreview.scss';

export const PurpleCarpetPreview: FC<{content: Video, marked?: boolean, style?: CSSProperties}> = ({ content, style, marked }) => {
  const shouldLockPurpleCarpet = useAppSelector(shouldLockPurpleCarpetSelector);
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const data = useEventData(content);
  const [isHovered, setIsHovered] = useState(false);

  const onClick = useCallback(() => {
    const url = getUrl({
      id: data!.id,
      title: data?.title,
      type: data?.status === PurpleCarpetContentStatus.Live && !isMobile && !shouldLockPurpleCarpet ? LINEAR_CONTENT_TYPE : VIDEO_CONTENT_TYPE,
    });
    tubiHistory.push(url);
  }, [data, shouldLockPurpleCarpet, isMobile]);

  const mouseEnterHandler = useCallback(() => {
    setIsHovered(true);
  }, []);
  const mouseLeaveHandler = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (!data) return null;
  const { id, landscapeImage, needs_login } = data;
  const loginIcon = shouldLockPurpleCarpet && needs_login ? (
    <div className={styles.lockIcon}>
      <LockClosedFilled24 />
    </div>
  ) : null;
  const badge = (
    <div className={styles.badges}>
      <PurpleCarpetBadges id={id} displayTimer={false} size="small" />
    </div>
  );
  const poster = (
    <div className={styles.posterWrapper}>
      <div
        className={classNames(styles.poster, {
          [styles.zoomPoster]: isHovered,
        })}
        style={{ backgroundImage: `url(${landscapeImage})` }}
      />
      <div className={classNames(styles.overlay, {
        [styles.hovered]: isHovered,
      })}
      />
    </div>
  );

  return (
    <div
      className={classNames(styles.purpleCarpetPreview, {
        [styles.marked]: marked,
      })}
      style={{ ...style }}
      onClick={onClick}
      onMouseEnter={isMobile ? undefined : mouseEnterHandler}
      onMouseLeave={isMobile ? undefined : mouseLeaveHandler}
    >
      {poster}
      {loginIcon}
      {badge}
    </div>
  );
};
