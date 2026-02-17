import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import { useCallback } from 'react';

import { START_POS_QUERY } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { positionSelector } from 'common/selectors/playerStore';
import { buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

export const useHandleAdvancedSettingsClick = (pause: () => void) => {
  const position = useAppSelector(positionSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);

  const handleAdvancedSettingsClick = useCallback(() => {
    pause();
    const event = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      component: 'BUTTON',
      buttonType: ButtonType.TEXT,
      buttonValue: 'advanced_subtitles',
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
    if (!isLoggedIn) {
      const startPosParam = /startPos=\d+/;
      if (!startPosParam.test(`${window.location}`)) {
        window.history.replaceState(null, '', addQueryStringToUrl(window.location.href, { [START_POS_QUERY]: position }));
      }
    }
  }, [pause, isLoggedIn, position]);

  return { handleAdvancedSettingsClick };
};
