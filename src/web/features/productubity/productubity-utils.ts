/* istanbul ignore file */
/**
 * This feature will only be available for 3 months and then this file can be removed
 * @TODO cbengtson
 */
import { addEventListener } from 'common/utils/dom';
import { trackLogging } from 'common/utils/track';

function productubityEventHandler(event: Event) {
  const customEvent = event as CustomEvent<{
    installed?: boolean;
    enabled?: boolean;
    type?: string;
  }>;

  if (customEvent.detail) {
    let subtype = '';
    if (customEvent.detail.installed) {
      subtype = 'tubity_installed';
    } else if (customEvent.detail.enabled) {
      subtype = 'tubity_enabled';
    } else if (!customEvent.detail.enabled) {
      subtype = 'tubity_disabled';
    }

    if (subtype) {
      trackLogging({
        type: 'CLIENT:INFO',
        level: 'info',
        subtype,
        message: {
          pageUrl: typeof window !== 'undefined' && window.location ? window.location.pathname : null,
          toggleType: customEvent.detail.type,
        },
      });
    }
  }
}

/**
 * Sets up an event listener for the 'productubityEvent' that is sent from the chrome extension.
 */
export function setUpProductubityEvents() {
  if (typeof window !== 'undefined') {
    addEventListener(window, 'productubityEvent', productubityEventHandler);
  }
}

