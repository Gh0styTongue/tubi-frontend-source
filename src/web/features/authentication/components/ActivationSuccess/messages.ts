import { defineMessages } from 'react-intl';

const messages = defineMessages({
  successTitle: {
    description: 'title text for success page',
    defaultMessage: 'You’re all set!',
  },
  successDescWithKids: {
    description: 'description text for success page (user with kid accounts)',
    defaultMessage: 'Your kids accounts are now ready to go on your TV. No extra sign-in needed.',
  },
  successDescWithoutKids: {
    description: 'description text for success page (user without kid account)',
    defaultMessage: 'Your account is now ready to go on your TV. No extra sign-in needed.',
  },
  button: {
    description: 'text for back to home button',
    defaultMessage: 'Back to Home',
  },
  help: {
    description: 'link text to help center',
    defaultMessage: 'Need help? <helpLink>Visit Help Center</helpLink>',
  },
});

export default messages;
