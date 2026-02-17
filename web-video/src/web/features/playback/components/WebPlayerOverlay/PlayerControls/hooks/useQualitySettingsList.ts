import { useCallback, useEffect, useRef } from 'react';

const QUALITY_SETTINGS_TOGGLE_DELAY = 200;

interface UseQualitySettingsHandlersParams {
  // state is lifted up as it is needed in parent component
  // TODO: lift up more of this code to colocate with state
  qualitySettingsVisible: boolean | undefined;
  handleQualitySettingsToggle: (visible: boolean) => void;
}

export const useQualitySettingsList = ({
  qualitySettingsVisible,
  handleQualitySettingsToggle,
}: UseQualitySettingsHandlersParams) => {
  const hideQualityListTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const showQualityListTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const qualitySettingsVisibleRef = useRef(qualitySettingsVisible);
  qualitySettingsVisibleRef.current = qualitySettingsVisible;

  useEffect(() => {
    return () => {
      clearTimeout(hideQualityListTimerRef.current);
      clearTimeout(showQualityListTimerRef.current);
    };
  }, []);

  const showQualityList = useCallback(() => {
    clearTimeout(hideQualityListTimerRef.current);
    showQualityListTimerRef.current = setTimeout(() => {
      if (!qualitySettingsVisibleRef.current) {
        handleQualitySettingsToggle(true);
      }
    }, QUALITY_SETTINGS_TOGGLE_DELAY);
  }, [handleQualitySettingsToggle]);

  const hideQualityList = useCallback(() => {
    clearTimeout(showQualityListTimerRef.current!);
    hideQualityListTimerRef.current = setTimeout(() => {
      if (qualitySettingsVisibleRef.current) {
        handleQualitySettingsToggle(false);
      }
    }, QUALITY_SETTINGS_TOGGLE_DELAY);
  }, [handleQualitySettingsToggle]);

  const handleClickQualityIcon = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      showQualityList();
    },
    [showQualityList]
  );

  return { showQualityList, hideQualityList, handleClickQualityIcon };
};
