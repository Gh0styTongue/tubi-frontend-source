import type { Tail } from 'ts-essentials';

import * as eventTypes from 'common/constants/event-types';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

export const trackDialogEvent = (...args: Tail<Parameters<typeof buildDialogEvent>>) => {
  const [type, subType, action, extraCtx] = args;
  trackEvent(
    eventTypes.DIALOG,
    buildDialogEvent(getCurrentPathname(), type, subType, action, extraCtx)
  );
};
