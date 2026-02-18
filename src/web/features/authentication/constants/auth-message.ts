import { defineMessages } from 'react-intl';

const messages = defineMessages({
  emailUserAlreadyExists: {
    description: 'error text when sign up shows email taken',
    defaultMessage: 'Email has already been used.',
  },
  invalidBirthday: {
    description: 'error text for invalid birthday',
    defaultMessage: 'Birthday is invalid',
  },
  signupEmailInvalid: {
    description: 'error text when email checking shows email invalid',
    defaultMessage: 'The email provided is invalid.',
  },
  errorDuringRegistration: {
    description: 'text for general error during registration',
    defaultMessage: 'There was an error during registration.',
  },
  tooManyRequest: {
    description: 'error text for too many requests',
    defaultMessage: 'Too many requests. Please try again later.',
  },
  unknownError: {
    description: 'error text for unknown error',
    defaultMessage: 'Unknown error. Please try again later.',
  },
});

export default messages;
