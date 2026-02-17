import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { defineMessages } from 'react-intl';

import { isWindowsDevice } from 'client/utils/clientTools';
import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { getMicrosoftAppStoreUrl } from 'common/utils/urlConstruction';

import { addFixedBanner } from '../actions/fixedBanner';
import type { BannerConfig, ShowBannerProps } from '../types/fixedBanner';

const messages = defineMessages({
  title: {
    description: 'title of the Windows app install prompt',
    defaultMessage: 'Tubi is better on the app',
  },
  description: {
    description: 'description of the Windows app install prompt',
    defaultMessage: 'Open the Windows Tubi app for extra easy access.',
  },
  acceptButton: {
    description: 'primary CTA of the Windows app install prompt',
    defaultMessage: 'Get the app',
  },
  dismissButton: {
    description: 'dismiss CTA of the Windows app install prompt',
    defaultMessage: 'Not now',
  },
});

const EXCLUDED_ROUTES: string[] = [WEB_ROUTES.activate];

const WINDOWS_PROMPT_SHOWN_V3 = 'windows_prompt_shown_v3'; // fixed banner

/* istanbul ignore next */
const WINDOWS_CAMPAIGN_ID = __PRODUCTION__ && !__IS_ALPHA_ENV__ ? 'web-install-banner' : 'web-install-banner-test';

const trackDialogEvent = (action: DialogAction) => {
  const dialogEvent = buildDialogEvent(getCurrentPathname(), DialogType.INFORMATION, 'better_on_the_app', action);
  trackEvent(eventTypes.DIALOG, dialogEvent);
};

export const handleWindowsInstallPromptAccept = () => {
  trackDialogEvent(DialogAction.ACCEPT_DELIBERATE);
  window.location.href = getMicrosoftAppStoreUrl(WINDOWS_CAMPAIGN_ID);
};

export const handleWindowsInstallPromptDismiss = () => {
  trackDialogEvent(DialogAction.DISMISS_DELIBERATE);
};

const hasSeenPromptV3 = () => {
  return getLocalData(WINDOWS_PROMPT_SHOWN_V3) === '1';
};

const canShow = () =>
  isWindowsDevice() && !EXCLUDED_ROUTES.includes(getCurrentPathname()) && !hasSeenPromptV3(); // only show the prompt once

// set local storage to track if the prompt was shown
const updateLocalData = () => {
  setLocalData(WINDOWS_PROMPT_SHOWN_V3, '1');
};

const show = ({ dispatch, intl }: ShowBannerProps) => {
  const banner = {
    title: intl.formatMessage(messages.title),
    description: intl.formatMessage(messages.description),
    buttons: [
      {
        title: intl.formatMessage(messages.acceptButton),
        action: handleWindowsInstallPromptAccept,
        primary: true,
      },
      {
        title: intl.formatMessage(messages.dismissButton),
        action: handleWindowsInstallPromptDismiss,
      },
    ],
  };
  dispatch(addFixedBanner(banner));
  trackDialogEvent(DialogAction.SHOW);
  updateLocalData();
};

const config: BannerConfig = {
  canShow,
  show,
};

export default config;
