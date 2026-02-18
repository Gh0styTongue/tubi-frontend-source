import { useCallback, useState } from 'react';

import { getLocalData, setLocalData } from 'client/utils/localDataStorage';

export const AD_MODAL_DISMISSED_KEY = 'appQrCodeDismissed';

// using a value other than 'true' helps us be clear that the result
// we get back will be a string and not a boolean
export const AD_DISMISSED_VALUE = 'yes';

/**
 * The QR code modal can be dismissed once; this state
 * is persisted and it is never shown again unless
 * the user clears their local storage &/or cookies.
 */
export const useIsModalDismissed = () => {
  const [isDismissed, _setIsDismissed] = useState(() => {
    const storedValue = getLocalData(AD_MODAL_DISMISSED_KEY);
    // if we haven't persisted anything, the modal has not
    // yet been dismissed
    return storedValue === AD_DISMISSED_VALUE;
  });

  const dismissModal = useCallback(() => {
    _setIsDismissed(true);
    setLocalData(AD_MODAL_DISMISSED_KEY, AD_DISMISSED_VALUE);
  }, []);

  return { isDismissed, dismissModal };
};
