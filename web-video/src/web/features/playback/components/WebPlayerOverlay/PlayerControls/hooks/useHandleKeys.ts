import { useEffect } from 'react';

import { webKeys } from 'common/constants/key-map';
import {
  addEventListener,
  removeEventListener,
} from 'common/utils/dom';

interface UseHandleEscapeKeyParams {
  qualitySettingsVisible: boolean | undefined;
  qualityListRef: React.RefObject<HTMLDivElement>;
  handleQualitySettingsToggle: (visible: boolean) => void;
}

export const useHandleKeys = ({
  qualitySettingsVisible,
  qualityListRef,
  handleQualitySettingsToggle,
}: UseHandleEscapeKeyParams) => {
  useEffect(() => {
    const handleKeyboardEvent = (e: KeyboardEvent) => {
      if (qualitySettingsVisible) {
        if (e.keyCode === webKeys.tab && e.target instanceof HTMLElement && !qualityListRef.current?.contains(e.target)
          || e.keyCode === webKeys.escape) {
          handleQualitySettingsToggle(false);
        }
      }
    };
    addEventListener(window, 'keyup', handleKeyboardEvent);

    return () => {
      removeEventListener(window, 'keyup', handleKeyboardEvent);
    };
  }, [handleQualitySettingsToggle, qualitySettingsVisible, qualityListRef]);
};
