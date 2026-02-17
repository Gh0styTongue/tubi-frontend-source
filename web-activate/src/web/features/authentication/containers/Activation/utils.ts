import { WEB_ROUTES } from 'common/constants/routes';
import {
  ACTIVATION_CODE_QUERY_PARAM,
  ACTIVATION_FLOW_QUERY_PARAM,
} from 'common/features/authentication/constants/auth';

export const activateDeviceHelpCenterLink =
  'https://tubitv.com/help-center/Setup-and-Troubleshooting/articles/4410093713179';

type RefererType = 'none' | 'activate_first';

export const createRedirectToActivateLocation = (activationCode?: string, referer?: RefererType) => {
  const params: Record<string, string> = {};
  if (activationCode) {
    params[ACTIVATION_CODE_QUERY_PARAM] = activationCode;
  }
  if (referer && referer !== 'none') {
    params[ACTIVATION_FLOW_QUERY_PARAM] = referer;
  }
  let search = Object.keys(params)
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  if (search) {
    search = `?${search}`;
  }
  return {
    pathname: WEB_ROUTES.activate,
    search,
  };
};

// @link https://github.com/adRise/adrise_unified_api/blob/master/apps/user_device/routes/activation_code.js#L33
export const ACTIVATION_CODE_LENGTH = 6;
// @link https://github.com/adRise/adrise_unified_api/blob/master/apps/user_device/routes/activation_code.js#L78
const ACTIVATION_CODE_CHAR_SET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const codeCharAreValid = (code: string) => {
  return !code
    .toUpperCase()
    .split('')
    .some((char) => {
      // if any of the character is not part of ACTIVATION_CODE_CHAR_SET return true
      return ACTIVATION_CODE_CHAR_SET.indexOf(char) === -1;
    });
};

export const formatCode = (value: string) => value.toUpperCase();
