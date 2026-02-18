import { AppMode } from '@tubitv/analytics/lib/client';

export const getAppMode = ({
  isKidsModeEnabled,
  isEspanolModeEnabled,
}: {
  isKidsModeEnabled?: boolean,
  isEspanolModeEnabled?: boolean,
}) => {
  let appMode = AppMode.DEFAULT_MODE;
  if (isKidsModeEnabled) {
    appMode = AppMode.KIDS_MODE;
  } else if (isEspanolModeEnabled) {
    appMode = AppMode.ESPANOL_MODE;
  }
  return appMode;
};
