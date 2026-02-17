import { Video } from '@tubitv/icons';
import { Button, Spinner, SpinnerSize } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { loadEPGContentIds } from 'common/actions/epg';
import { LIVE_CONTENT_MODES } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isAllContainerIdsLoadedSelector } from 'common/selectors/epg';
import { fetchFeaturedProgrammings } from 'web/features/watchSchedule/actions/landing';
import landingMessages from 'web/features/watchSchedule/containers/Landing/landingMessages';
import {
  featuredEpgItemsLoadedSelector,
  featuredEpgItemsLoadingSelector,
} from 'web/features/watchSchedule/selectors/landing';

import ChannelList from './ChannelList';
import styles from './LiveChannels.scss';
import messages from './liveChannelsMessages';

const LiveSection = () => {
  const dispatch = useAppDispatch();
  const isEpgAllContainerIdsLoaded = useAppSelector(isAllContainerIdsLoadedSelector);
  const isFeaturedEpgItemsLoaded = useAppSelector(featuredEpgItemsLoadedSelector);
  const isFeaturedEpgItemsLoading = useAppSelector(featuredEpgItemsLoadingSelector);
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (!isEpgAllContainerIdsLoaded) {
      dispatch(loadEPGContentIds(LIVE_CONTENT_MODES.all));
    }
  }, [dispatch, isEpgAllContainerIdsLoaded]);

  useEffect(() => {
    if (isEpgAllContainerIdsLoaded && !isFeaturedEpgItemsLoaded) {
      dispatch(fetchFeaturedProgrammings());
    }
  }, [dispatch, isFeaturedEpgItemsLoaded, isEpgAllContainerIdsLoaded]);

  const buttonProps = {
    className: styles.button,
    icon: Video,
    iconSize: 'large' as const,
    tag: formatMessage(landingMessages.free),
    children: formatMessage(messages.button),
    onClick: () => {
      tubiHistory.push(WEB_ROUTES.live);
    },
  };

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <h2>{formatMessage(messages.title)}</h2>
        <p>{formatMessage(messages.desc)}</p>
        <Button {...buttonProps} />
        <div className={classNames(styles.content, { [styles.withSpinner]: isFeaturedEpgItemsLoading })}>
          {isFeaturedEpgItemsLoading ? <Spinner size={SpinnerSize.LG} /> : <ChannelList />}
        </div>
      </div>
    </div>
  );
};

export default LiveSection;
