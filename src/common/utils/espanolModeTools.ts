import { setCookie } from 'client/utils/localDataStorage';
import { COOKIE_IS_ESPANOL_MODE_ENABLED } from 'common/constants/cookies';

// set Espanol mode status in cookie for web
export const setWebEspanolModeStatusInCookie = (isEspanolModeEnabled: boolean) => {
  setCookie(COOKIE_IS_ESPANOL_MODE_ENABLED, isEspanolModeEnabled ? 'true' : '');
};
