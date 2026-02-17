import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import classnames from 'classnames';
import remove from 'lodash/remove';
import type { FC } from 'react';
import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { connect, useDispatch } from 'react-redux';

import ArrowDownCircleIcon from 'common/components/uilib/SvgLibrary/ArrowDownCircleIcon';
import { setLiveLoading } from 'common/features/playback/actions/live';
import tubiHistory from 'common/history';
import { liveNewsVideosSelector } from 'common/selectors/video';
import trackingManager from 'common/services/TrackingManager';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { getUrlByVideo } from 'common/utils/urlConstruction';

import styles from './WebLiveChannelGuide.scss';

const messages = defineMessages({
  channelGuide: {
    description: 'The name of the channel guide list',
    defaultMessage: 'Channel Guide',
  },
});

interface OwnProps {
  currentId: string;
  isMobile?: boolean;
  fullscreen?: boolean;
  channelGuideControlActive?: boolean;
}

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

const ChannelGuideItem: FC<{
  data: Video;
  active?: boolean;
  open?: boolean;
  onClick: (video: Video) => void;
}> = ({ active, onClick: onUserClick, open, data }) => {
  const {
    title,
    thumbnails: [logo],
  } = data;
  const containerClasses = classnames(styles.channelGuideItem, {
    [styles.active]: active,
  });
  const arrowIconClasses = classnames(styles.arrowIcon, {
    [styles.open]: open,
  });
  const onClick = () => onUserClick(data);
  return (
    <div className={containerClasses} onClick={onClick}>
      <div className={styles.logo}>
        <img src={logo} alt={`Logo for ${title} channel`} />
      </div>
      <div className={styles.title}>{title}</div>
      {active ? <ArrowDownCircleIcon className={arrowIconClasses} /> : null}
    </div>
  );
};

const WebLiveChannelGuide: FC<Props> = ({ channelList, currentId, isMobile, fullscreen, channelGuideControlActive }) => {
  const list = [...channelList];
  const [currentChannel] = remove<Video>(list, (item) => item.id === currentId);
  const dispatch = useDispatch();
  const intl = useIntl();
  const [open, setOpen] = React.useState(false);

  const toggle = () => setOpen(!open);
  const onChannelItemClick = useCallback((video: Video) => {
    const previousIndex = channelList.findIndex(item => item.id === currentId);
    const currentIndex = channelList.findIndex(item => item.id === video.id);
    trackingManager.createNavigateToPageComponent({
      startX: previousIndex,
      startY: 0,
      endX: currentIndex,
      endY: 0,
      contentId: currentId,
      componentType: ANALYTICS_COMPONENTS.channelGuideComponent,
    });
    const toUrl = getUrlByVideo({ video });
    dispatch(setLiveLoading(true));
    tubiHistory.push(toUrl);
  }, [currentId, channelList, dispatch]);

  const channelGuideClasses = classnames(styles.channelGuide, {
    [styles.open]: open,
    [styles.mobile]: isMobile,
    [styles.fullscreen]: !!fullscreen,
    [styles.channelGuideControlActive]: !!channelGuideControlActive,
  });

  if (!currentChannel || !list.length) {
    return null;
  }
  return (
    <div className={channelGuideClasses}>
      <div className={styles.title}>{intl.formatMessage(messages.channelGuide)} </div>
      <ChannelGuideItem
        data={currentChannel}
        active
        onClick={toggle}
        open={open}
      />
      <div className={styles.scrollContainer}>
        {list.map((item) => (
          <ChannelGuideItem
            key={item.id}
            data={item}
            onClick={onChannelItemClick}
          />
        ))}
      </div>
    </div>
  );
};

function mapStateToProps(state: StoreState) {
  const channelList = liveNewsVideosSelector(state);

  return {
    channelList,
  };
}

export default connect(mapStateToProps)(WebLiveChannelGuide);
