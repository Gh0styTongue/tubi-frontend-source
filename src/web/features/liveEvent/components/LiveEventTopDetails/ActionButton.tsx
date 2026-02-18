/* istanbul ignore file */
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { Button } from '@tubitv/web-ui';
import type { FC, MutableRefObject, MouseEvent } from 'react';
import React, { memo, useCallback, useEffect } from 'react';
import { injectIntl } from 'react-intl';
import type { WrappedComponentProps } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import type { useActionButton } from 'common/features/liveEvent/hooks/useActionButton';
import { messages } from 'common/features/liveEvent/hooks/useActionButton';
import { LiveEventContentStatus, type LiveEvent } from 'common/features/liveEvent/types';
import { getLiveEventPlayId } from 'common/features/liveEvent/utils';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { videoByContentIdSelector } from 'common/selectors/video';
import trackingManager from 'common/services/TrackingManager';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import redirect from 'common/utils/redirect';
import { getDeepLinkForVideo, getUrl } from 'common/utils/urlConstruction';
import { matchesRoute } from 'common/utils/urlPredicates';
import useReminder from 'web/rd/components/ContentDetail/RemindButton/useReminder';

import styles from './LiveEventTopDetails.scss';

const ActionButton: FC<{
  game: LiveEvent,
  containerSlug?: string,
  onClickRef?: MutableRefObject<(() => void) | null>
} & ReturnType<typeof useActionButton> & WrappedComponentProps> = ({
  message,
  buttonStatus,
  icon,
  game,
  intl,
  containerSlug,
  onClickRef,
}) => {
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const pathname = getCurrentPathname();
  const isSEOPage = matchesRoute(WEB_ROUTES.nfl, pathname) || matchesRoute(WEB_ROUTES.tiktokawards, pathname);
  const isHomePage = matchesRoute(WEB_ROUTES.home, pathname);
  const buttonDisabled = ['available', 'not_available'].includes(buttonStatus);
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);
  const deviceId = useAppSelector(state => state.auth.deviceId);
  const content = useAppSelector((state) => game ? videoByContentIdSelector(state, game.id) : null);

  const { dispatchReminderAction } = useReminder({
    contentId: game?.id,
    contentTitle: game?.title,
    contentType: game?.type,
    contentRatings: content?.ratings,
  });
  const createNavigateToPageComponent = useCallback(() => {
    if (isHomePage) {
      trackingManager.createNavigateToPageComponent({
        startX: 0,
        startY: 0,
        containerSlug: containerSlug || '',
        componentType: ANALYTICS_COMPONENTS.containerComponent,
      });
    }
  }, [containerSlug, isHomePage]);

  const freeTag = isMobile || buttonStatus === 'signin_required' ? intl.formatMessage(messages.free) : undefined;

  const mobileRedirect = useCallback(() => {
    if (!content) return;

    redirect(getDeepLinkForVideo(content, deviceId, {
      stopTracking: !isThirdPartySDKTrackingEnabled,
    }));
  }, [content, deviceId, isThirdPartySDKTrackingEnabled]);

  const handleInternalClick = useCallback(() => {
    if (!game || !content) return;
    const detailsUrl = getUrl({
      id: game!.id,
      title: game?.title,
      type: game.type,
    });
    const liveUrl = game?.player_type === 'fox' ? detailsUrl : `${WEB_ROUTES.live}/${getLiveEventPlayId(game)}`;

    switch (buttonStatus) {
      case 'set_reminder':
      case 'reminder_set':
        dispatchReminderAction?.();
        break;
      case 'signin_required':
        if (isMobile) {
          mobileRedirect();
        } else {
          createNavigateToPageComponent();
          const redirectUrl = isSEOPage ? pathname : game.status === LiveEventContentStatus.Live ? liveUrl : detailsUrl;
          tubiHistory.push(`${WEB_ROUTES.signIn}?redirect=${encodeURIComponent(redirectUrl)}`);
        }
        break;
      case 'live':
        createNavigateToPageComponent();
        if (isMobile) {
          mobileRedirect();
        } else {
          tubiHistory.push(liveUrl);
        }
        break;
      case 'details':
        createNavigateToPageComponent();
        tubiHistory.push(detailsUrl);
        break;
      default:
        break;
    }
  }, [buttonStatus, content, createNavigateToPageComponent, dispatchReminderAction, game, isMobile, isSEOPage, mobileRedirect, pathname]);

  useEffect(() => {
    if (onClickRef) {
      onClickRef.current = handleInternalClick;
    }
  }, [onClickRef, handleInternalClick]);

  const buttonProps = {
    appearance: buttonDisabled ? ('tertiary' as const) : ('primary' as const),
    children: message,
    icon,
    iconSize: 'large' as const,
    disabled: buttonDisabled,
    tag: freeTag,
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      handleInternalClick();
    },
  };

  return (

    <Button className={styles.button} {...buttonProps} />
  );
};

export default memo(injectIntl(ActionButton));
