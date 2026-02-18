import { defineMessages } from 'react-intl';

export default defineMessages({
  activateDeviceTitle: {
    description: 'activate device heading',
    defaultMessage: 'Activate your device',
  },
  enterCodeInstructions: {
    description: 'enter code instructions',
    defaultMessage: 'Enter the code displayed on your TV',
  },
  invalidCodeTitle: {
    description: 'if there is an auth error heading',
    defaultMessage: 'Invalid code',
  },
  reEnterCodeInstructions: {
    description: 're enter code instructions',
    defaultMessage: 'Re-enter the code displayed on your TV',
  },
  codeRequired: {
    description: 'error message, activation code required',
    defaultMessage: 'Activation code is required',
  },
  invalidCode: {
    description: 'error message, invalid number of characters',
    defaultMessage: 'Invalid Code: Wrong number of characters',
  },
  invalidChars: {
    description: 'error message, invalid characters',
    defaultMessage: 'Invalid Code: One or more invalid characters',
  },
  activateCodeLabel: {
    description: 'activation code input label',
    defaultMessage: 'Activation Code',
  },
  success: {
    description: 'successfully activated device message',
    defaultMessage: 'Successfully Activated!',
  },
  activate: {
    description: 'activate device button text',
    defaultMessage: 'Activate',
  },
});
