import { defineMessages } from 'react-intl';

const messages = defineMessages({
  invalid: {
    description: 'error message during login attempt',
    defaultMessage: 'Invalid email/password combination',
  },
  loggedin: {
    description: 'Error message if user is trying to view a page when not logged in',
    defaultMessage: 'Need to login to access the routes',
  },
  unknown: {
    description: 'error message during login attempt, unknown error',
    defaultMessage: 'Unknown error. If issue persists please contact support',
  },
  password: {
    description: 'required password length not met error message',
    defaultMessage: 'Password length must be 6 to 30 characters long',
  },
  invalidPass: {
    description: 'invalid password error message',
    defaultMessage: 'Invalid password',
  },
  parentalError: {
    description: 'change parental setting error',
    defaultMessage: 'Unknown error. If problem persists, please contact support',
  },
  parentalUser: {
    description: 'change parental setting error',
    defaultMessage: 'User does not exist',
  },
  ottMagicLinkStatus: {
    description: 'Error message sending magic link',
    defaultMessage: 'StatusCode: {statusCode}. There was an error in attempting to send magic link',
  },
  ottRegistrationLinkStatus: {
    description: 'Error message sending registration link',
    defaultMessage: 'StatusCode: {statusCode}. There was an error in attempting to send registration link',
  },
  ottActivateAuth: {
    description: 'Error message activating OTT device',
    defaultMessage: 'Not authorized to request for an activation code',
  },
  ottActivateRate: {
    description: 'Error message activating OTT device',
    defaultMessage: 'Rate limit exceeded, please try again in a few minutes',
  },
  ottActivateInternal: {
    description: 'Error message activating OTT device',
    defaultMessage: 'Internal Error -- Please try again in a few minutes',
  },
  ottActivateStatus: {
    description: 'Error message activating OTT device',
    defaultMessage: 'StatusCode: {statusCode}. There was an error in attempting to get activation code',
  },
  activateError: {
    description: 'Error message activating device',
    defaultMessage: 'Error registering device. Activation Code not valid',
  },
  activateAuth: {
    description: 'Error message activating device',
    defaultMessage: 'Not authorized to activate that device',
  },
  activateUnknown: {
    description: 'Error message activating device',
    defaultMessage: 'Internal Error -- Please try again in a few minutes',
  },
  activateLoggedIn: {
    description: 'Error message activating device',
    defaultMessage: 'You must be logged in for this operation',
  },
  email: {
    description: 'forgot password message if email is invalid',
    defaultMessage: 'Please check your email address.',
  },
  token: {
    description: 'reset password missing token',
    defaultMessage: '`token` should not be empty',
  },
});

export default messages;
