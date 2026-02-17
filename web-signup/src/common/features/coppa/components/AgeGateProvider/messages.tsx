import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  required: {
    description: 'error message for required fields',
    defaultMessage: 'Required Field',
  },
  invalidBirthYear: {
    description: 'error text for invalid birth year',
    defaultMessage: 'Please enter a valid year of birth',
  },
  invalidAge: {
    description: 'error text for invalid age',
    defaultMessage: 'Please enter a valid age',
  },
  wrongInfo: {
    description: 'When user enters wrong date of birth',
    defaultMessage: 'It looks like you entered the wrong info.',
  },
  potentiallyInvalidAge: {
    description: 'When date of birth is potentially invalid',
    defaultMessage: 'Please be sure the information you added is correct',
  },
});
