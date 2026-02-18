import { ActionLevel } from '@adrise/player';
import { controlActions } from '@adrise/player/lib/action';
import { Play, Account24, MyListFilled, MyListOutline } from '@tubitv/icons';
import type { ButtonProps } from '@tubitv/web-ui';
import { Button, useBreakpointIfAvailable } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import React, { useCallback, useRef, Fragment } from 'react';
import { defineMessages } from 'react-intl';

import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { isMatureContentGatedSelector, needsLoginSelector } from 'common/features/authentication/selectors/needsLogin';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { latestEpisodeShortTitleSelector } from 'common/selectors/history';
import { isKidsModeEnabledSelector, isMobileDeviceSelector } from 'common/selectors/ui';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import type { Video, VideoType } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getLoginRedirect } from 'common/utils/urlConstruction';
import { useIntl } from 'i18n/intl';
import { trackContentDetailNavComponentInteractionEvent } from 'ott/utils/contentDetailNav';
import type { AddToQueueProviderProps } from 'web/components/AddToQueue/AddToQueueProvider/AddToQueueProvider';
import AddToQueueProvider from 'web/components/AddToQueue/AddToQueueProvider/AddToQueueProvider';
import { usePlayerPortal } from 'web/features/playback/contexts/playerPortalContext/playerPortalContext';
import MoreActions from 'web/rd/components/ContentDetail/MoreActions/MoreActions';
import RemindButton from 'web/rd/components/ContentDetail/RemindButton/RemindButton';
import ShareButton from 'web/rd/components/ContentDetail/ShareButton/ShareButton';

import styles from './ButtonGroup.scss';
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
  playInApp: {
    description: 'Play in app button text',
    defaultMessage: 'Play in the App',
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
  isNewDesign?: boolean;
  episodeId?: string;
  content?: Video;
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
  isNewDesign,
  episodeId,
  content,
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isFloating } = usePlayerPortal();
  const playerState = useAppSelector((state) => state.player.playerState);
  const myListRef = useRef<HTMLButtonElement>(null);
  const isMobileDevice = useAppSelector(isMobileDeviceSelector);
  const isSeries = type === SERIES_CONTENT_TYPE;
  const contentId = isSeries ? convertSeriesIdToContentId(id) : id;
  const isInHistory = useAppSelector((state): boolean => {
    if (type === SERIES_CONTENT_TYPE || isNewDesign) {
      return !!state.history.contentIdMap[contentId];
    }
    return false;
  });
  const episodeShortTitle = useAppSelector((state): string => {
    if (content?.series_id) {
      return latestEpisodeShortTitleSelector(state, {
        seriesId: convertSeriesIdToContentId(content.series_id),
        formatMessage,
        episodeId: contentId,
      });
    }
    if (type !== SERIES_CONTENT_TYPE) return '';
    return latestEpisodeShortTitleSelector(state, {
      seriesId: contentId,
      formatMessage,
      episodeId,
    });
  });
  const isKidsMode = useAppSelector(isKidsModeEnabledSelector);
  const isMatureContentGated = useAppSelector((state) => isMatureContentGatedSelector(state, contentId));
  const needsLogin = useAppSelector(state => needsLoginSelector(state, contentId));
  const bp = useBreakpointIfAvailable();
  let responsiveMode: 'text' | 'tooltip' = 'text';
  if (isNewDesign) {
    responsiveMode = bp?.xl ? 'text' : 'tooltip';
  }

  const isInWebMobileDetailsRedesign = isMobileDevice;

  const addToQueueContent: AddToQueueProviderProps['children'] = useCallback(
    ({ dispatchQueueAction, isInQueue }) => {
      const myListButtonIcon = isInQueue ? MyListFilled : MyListOutline;
      const myListButtonText = formatMessage(isInQueue ? messages.removeFromMyList : messages.addToMyList);
      return (
        <Button
          ref={myListRef}
          onClick={dispatchQueueAction}
          appearance="tertiary"
          className={classnames(styles.myListButton, responsiveMode === 'text' ? styles.text : (styles as any).tooltip)}
          icon={isNewDesign ? myListButtonIcon : undefined}
          iconSize="large"
          tooltip={responsiveMode === 'tooltip' ? myListButtonText : undefined}
        >
          {responsiveMode === 'text' ? myListButtonText : null}
        </Button>
      );
    },
    [formatMessage, isNewDesign, responsiveMode]
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
  } else if (isNewDesign) {
    primaryButtonProps = {
      children: formatMessage(isInHistory ? messages.resume : messages.play),
    };
  }

  if (isInWebMobileDetailsRedesign) {
    primaryButtonProps = {
      children: formatMessage(messages.playInApp),
      tag: formatMessage(messages.free),
    };
  }

  const handlePrimaryButtonClick = useCallback(() => {
    trackContentDetailNavComponentInteractionEvent({
      componentSectionIndex: isInHistory && !isInWebMobileDetailsRedesign
        ? ContentDetailPageNavOption.ContinueWatching
        : ContentDetailPageNavOption.Play,
    });
    if (isMobileDevice || isFloating) {
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
  }, [dispatch, isInHistory, isMobileDevice, onClickWatch, playerState, isInWebMobileDetailsRedesign, isFloating]);

  const showSignInButton = isMatureContentGated || needsLogin;
  const showWatchButton = (!showSignInButton && (isSeriesDetail || isNewDesign || isInWebMobileDetailsRedesign));

  const signInButtonProps = {
    className: styles.signInButton,
    children: formatMessage(messages.signInToPlay),
    icon: Account24,
    onClick: () => {
      tubiHistory.push(WEB_ROUTES.signIn + getLoginRedirect(location.pathname, location.query));
    },
  };

  const reactionsButtons = <ContentDetailReactions
    contentId={contentId}
    seriesContentId={belongSeries ? convertSeriesIdToContentId(`${belongSeries}`) : undefined}
    isNewDesign={isNewDesign}
  />;
  const addToQueueButton = (
    <AddToQueueProvider id={id} belongSeries={belongSeries}>
      {addToQueueContent}
    </AddToQueueProvider>
  );
  const shareButton = <ShareButton title={title} contentId={id} type={type} isNewDesign={isNewDesign} />;
  const moreActionsButton = <MoreActions title={title} contentId={id} isNewDesign={isNewDesign} />;
  let buttonsForAvailableContent = (
    <Fragment>
      {showSignInButton ? <Button {...signInButtonProps} /> : null}
      {showWatchButton ? (
        <Button {...primaryButtonProps} onClick={handlePrimaryButtonClick} className={styles.watchButton} icon={Play} />
      ) : null}
      {!isKidsMode ? (
        <div className={styles.line}>{reactionsButtons}</div>
      ) : null}
      {addToQueueButton}
      <div className={styles.line}>
        {shareButton}
        {moreActionsButton}
      </div>
    </Fragment>
  );

  if (isNewDesign) {
    buttonsForAvailableContent = (
      <Fragment>
        {showSignInButton ? <Button {...signInButtonProps} /> : null}
        {showWatchButton ? (
          <Button {...primaryButtonProps} onClick={handlePrimaryButtonClick} className={styles.watchButton} icon={Play} />
        ) : null}
        <div className={styles.line}>
          {!isKidsMode ? reactionsButtons : null}
          {addToQueueButton}
          {shareButton}
          {moreActionsButton}
        </div>
      </Fragment>
    );
  }

  if (isInWebMobileDetailsRedesign) {
    buttonsForAvailableContent = (
      <Fragment>
        {showSignInButton ? <Button {...signInButtonProps} /> : null}
        {showWatchButton ? (
          <Button {...primaryButtonProps} onClick={handlePrimaryButtonClick} className={styles.watchButton} icon={Play} />
        ) : null}
      </Fragment>
    );
  }

  return (
    <div className={classnames(styles.buttonGroup, className, { [styles.newDesign]: isNewDesign })}>
      {showRemindMe ? (
        <RemindButton
          contentId={contentId}
          contentType={type}
          contentTitle={title}
          className={classnames(remindButtonClassName, styles.remindButton)}
          appearance={isNewDesign ? 'primary' : undefined}
        />
      ) : (
        buttonsForAvailableContent
      )}
    </div>
  );
};

export default ButtonGroup;
