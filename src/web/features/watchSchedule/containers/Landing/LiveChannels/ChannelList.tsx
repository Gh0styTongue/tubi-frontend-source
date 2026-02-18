import classNames from 'classnames';
import React from 'react';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import { encodeTitle } from 'common/utils/seo';
import { getPath } from 'web/features/seo/utils/seo';
import { featuredEpgItemsSelector } from 'web/features/watchSchedule/selectors/landing';

import styles from './LiveChannels.scss';

const VISIBLE_CHANNEL_NUM_ON_MOBILE = 6;

const LiveChannelList = () => {
  const items = useAppSelector(featuredEpgItemsSelector);

  return (
    <ul className={styles.channelList}>
      {items.map((item, idx) => {
        const { content_id: contentId, images, title } = item;

        return (
          <li
            key={contentId}
            className={classNames({
              [styles.lastItems]: idx + 1 > VISIBLE_CHANNEL_NUM_ON_MOBILE,
            })}
          >
            <Link to={getPath(WEB_ROUTES.liveDetail, { id: `${contentId}`, title: encodeTitle(title) })}>
              <img alt={title} src={images.landscape[0]} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default LiveChannelList;
