import { useEffect } from 'react';

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_DURATION_MS = 10000;

/**
 * Sets accessibility attributes on the restart button to remove it from navigation.
 * Returns true if the button was found (regardless of whether it was modified),
 * indicating that we can stop watching for it.
 */
const setAccessibilityAttributes = (): boolean => {
  const button = document.getElementById('restartButton');
  if (!button) {
    return false;
  }

  // Only modify if not already set
  if (button.getAttribute('aria-hidden') !== 'true') {
    button.setAttribute('tabindex', '-1');
    button.setAttribute('aria-hidden', 'true');
  }

  return true;
};

/**
 * Hook that hides the restart button in the Fox player UI.
 * Uses MutationObserver to set accessibility attributes when the button appears.
 * Falls back to polling if MutationObserver is not supported.
 * CSS hiding is handled by global styles in WebFoxLivePlayer.scss and OTTFoxLivePlayback.scss.
 * Cleans up all resources when the component unmounts.
 */
const useForceHideRestartBtn = (): void => {
  useEffect(() => {
    // Try to set attributes immediately if button already exists
    const alreadyFound = setAccessibilityAttributes();

    let observer: MutationObserver | undefined;
    let pollInterval: ReturnType<typeof setInterval> | undefined;

    // If button not found yet, watch for it
    if (!alreadyFound) {
      // Use MutationObserver if supported, otherwise fall back to polling
      if (typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(() => {
          const found = setAccessibilityAttributes();
          if (found && observer) {
            observer.disconnect();
          }
        });

        const playerContainer = document.querySelector('.wpf-ui-uicontainer');
        const target = playerContainer || document.body;

        observer.observe(target, {
          childList: true,
          subtree: true,
        });
      } else {
        // Fallback: poll for the button (for older browsers/OTT platforms)
        let elapsed = 0;
        pollInterval = setInterval(() => {
          elapsed += POLL_INTERVAL_MS;
          const found = setAccessibilityAttributes();

          if (found || elapsed >= MAX_POLL_DURATION_MS) {
            clearInterval(pollInterval);
          }
        }, POLL_INTERVAL_MS);
      }
    }

    return () => {
      observer?.disconnect();
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);
};

export default useForceHideRestartBtn;

