import { ActionLevel } from '@adrise/player';
import { controlActions } from '@adrise/player/lib/action';
import { isMobileWebkit } from '@adrise/utils/lib/ua-sniffing';
import { Play, Account24 } from '@tubitv/icons';
import type { ButtonProps } from '@tubitv/web-ui';
import { Button } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import React, { useCallback, useRef, Fragment } from 'react';
import { defineMessages } from 'react-intl';

import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { isMatureContentGatedSelector } from 'common/features/authentication/selectors/needsLogin';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isWebkitMobileInstallBannerEnabledSelector } from 'common/selectors/experiments/webIosPlaybackSelector';
import { latestEpisodeShortTitleSelector } from 'common/selectors/history';
import { isKidsModeSelector, isMobileDeviceSelector } from 'common/selectors/ui';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import type { Video, VideoType } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getLoginRedirect } from 'common/utils/urlConstruction';
import { useIntl } from 'i18n/intl';
import { trackContentDetailNavComponentInteractionEvent } from 'ott/utils/contentDetailNav';
import type { AddToQueueProviderProps } from 'web/components/AddToQueue/AddToQueueProvider/AddToQueueProvider';
import AddToQueueProvider from 'web/components/AddToQueue/AddToQueueProvider/AddToQueueProvider';
import MoreActions from 'web/rd/components/ContentDetail/MoreActions/MoreActions';
import RemindButton from 'web/rd/components/ContentDetail/RemindButton/RemindButton';
import ShareButton from 'web/rd/components/ContentDetail/ShareButton/ShareButton';

import styles from './ButtonGroup.scss';
import { InstallButton } from './InstallButton/InstallButton';
import ContentDetailReactions from '../ContentDetailReactions/ContentDetailReactions';

export const messages = defineMessages({
  signInToPlay: {
    description: 'Sign in to play button text',
    defaultMessage: 'Sign In to Play',
  },
  playNow: {
    description: 'Play now (free) button text',
    defaultMessage: 'Play Now',
  },
  free: {
    description: 'free tag on Watch now button',
    defaultMessage: 'Free',
  },
  addToMyList: {
    description: 'Add to My List button text',
    defaultMessage: 'Add to My List',
  },
  removeFromMyList: {
    description: 'Remove from My List button text',
    defaultMessage: 'Remove from My List',
  },
  play: {
    description: 'Play',
    defaultMessage: 'Play',
  },
  watchLastEpisode: {
    description: 'welcome message',
    defaultMessage: 'Play Latest Episode',
  },
  resume: {
    description: 'Resume',
    defaultMessage: 'Resume',
  },
});

export interface ButtonGroupProps {
  id: string;
  belongSeries?: string | number;
  isRecurring: boolean;
  type: VideoType;
  title: string;
  onClickWatch?: VoidFunction | null;
  className?: string;
  remindButtonClassName?: string;
  isSeriesDetail?: boolean;
  showRemindMe: boolean;
  video: Video;
  // are we rendering the button group under the poster in the left sidebar?
  isInLeftSidebar?: boolean;
}

const ButtonGroup: FC<ButtonGroupProps> = ({
  isRecurring,
  id,
  belongSeries,
  type,
  title,
  onClickWatch,
  className,
  isSeriesDetail,
  showRemindMe,
  remindButtonClassName,
  isInLeftSidebar,
  video,
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const playerState = useAppSelector((state) => state.player.playerState);
  const userAgent = useAppSelector((state) => state.ui.userAgent);
  const myListRef = useRef<HTMLButtonElement>(null);
  const isMobileDevice = useAppSelector(isMobileDeviceSelector);
  const contentId = type === SERIES_CONTENT_TYPE ? convertSeriesIdToContentId(id) : id;
  const isInHistory = useAppSelector((state): boolean => {
    if (type === SERIES_CONTENT_TYPE) {
      return !!state.history.contentIdMap[contentId];
    }
    return false;
  });
  const episodeShortTitle = useAppSelector((state): string => {
    if (type !== SERIES_CONTENT_TYPE) return '';
    return latestEpisodeShortTitleSelector(state, {
      seriesId: contentId,
      formatMessage,
    });
  });
  const enableWebIosInstallBanner = useAppSelector(isWebkitMobileInstallBannerEnabledSelector);
  const isKidsMode = useAppSelector(isKidsModeSelector);
  const isMatureContentGated = useAppSelector((state) => isMatureContentGatedSelector(state, contentId));

  const addToQueueContent: AddToQueueProviderProps['children'] = useCallback(
    ({ dispatchQueueAction, isInQueue }) => {
      return (
        <Button
          ref={myListRef}
          onClick={dispatchQueueAction}
          appearance="tertiary"
          className={classnames(styles.myListButton)}
        >
          {formatMessage(isInQueue ? messages.removeFromMyList : messages.addToMyList)}
        </Button>
      );
    },
    [formatMessage]
  );

  let primaryButtonProps: PropsWithChildren<ButtonProps> = {
    children: formatMessage(messages.playNow),
    tag: formatMessage(messages.free),
  };
  if (isRecurring) {
    primaryButtonProps = {
      children: isInHistory ? formatMessage(messages.resume) : formatMessage(messages.watchLastEpisode),
    };
  } else if (episodeShortTitle) {
    primaryButtonProps = {
      children: `${formatMessage(isInHistory ? messages.resume : messages.play)} ${episodeShortTitle}`,
    };
  }

  const handlePrimaryButtonClick = () => {
    trackContentDetailNavComponentInteractionEvent({
      componentSectionIndex: isInHistory
        ? ContentDetailPageNavOption.ContinueWatching
        : ContentDetailPageNavOption.Play,
    });
    if (isMobileDevice) {
      onClickWatch?.();
      return;
    }
    if (playerState === 'inited' || playerState === 'paused') {
      dispatch(controlActions.play(ActionLevel.UI));
    } else if (playerState === 'playing') {
      dispatch(controlActions.pause());
    } else {
      onClickWatch?.();
    }
  };

  const showSignInButton = isMatureContentGated;
  const showWatchButton = !showSignInButton && isSeriesDetail;
  const showInstallButton = enableWebIosInstallBanner && !isSeriesDetail && isMobileWebkit(userAgent);

  const signInButtonProps = {
    className: styles.signInButton,
    children: formatMessage(messages.signInToPlay),
    icon: Account24,
    onClick: () => {
      tubiHistory.push(WEB_ROUTES.signIn + getLoginRedirect(location.pathname, location.query));
    },
  };

  const buttonsForAvailableContent = (
    <Fragment>
      {showSignInButton ? <Button {...signInButtonProps} /> : null}
      {showWatchButton ? (
        <Button {...primaryButtonProps} onClick={handlePrimaryButtonClick} className={styles.watchButton} icon={Play} />
      ) : null}
      {showInstallButton && <InstallButton isInLeftSidebar={isInLeftSidebar} video={video} />}
      {!isKidsMode ? (
        <div className={styles.line}>
          <ContentDetailReactions
            contentId={contentId}
            seriesContentId={belongSeries ? convertSeriesIdToContentId(`${belongSeries}`) : undefined}
          />
        </div>
      ) : null}
      <AddToQueueProvider id={id} belongSeries={belongSeries}>
        {addToQueueContent}
      </AddToQueueProvider>
      <div className={styles.line}>
        <ShareButton title={title} contentId={id} type={type} />
        <MoreActions title={title} contentId={id} />
      </div>
    </Fragment>
  );

  return (
    <div className={classnames(styles.buttonGroup, className)}>
      {showRemindMe ? (
        <RemindButton contentId={contentId} contentType={type} contentTitle={title} className={remindButtonClassName} />
      ) : (
        buttonsForAvailableContent
      )}
    </div>
  );
};

export default ButtonGroup;
