import { defineMessages } from 'react-intl';

const messages = defineMessages({
  forAdults: {
    description: 'for adults tab',
    defaultMessage: 'For Adults',
  },
  forKids: {
    description: 'for kids tab',
    defaultMessage: 'For Kids',
  },
  forAdultsHeader: {
    description: 'header text for adding adult account',
    defaultMessage: 'Sign In or Add an Account',
  },
  forAdultsDesc: {
    description: 'description text for adding adult account',
    defaultMessage: 'Free forever · No credit card required · Only takes a minute',
  },
  forKidsHeader: {
    description: 'header text for adding kids account',
    defaultMessage: 'Add a Kids Account',
  },
  forKidsDesc: {
    description: 'description text for adding kids account (no existing account)',
    defaultMessage: 'Sign in to an adult account to create a kids account.',
  },
  forKidsDescWithExistingAccount: {
    description: 'description text for adding kids account (with existing account)',
    defaultMessage: 'Choose an adult account to manage the kids account.',
  },
  addAdultAccount: {
    description: 'button text for adding adult account',
    defaultMessage: 'Add Adult Account',
  },
  addAdultAccountTitle: {
    description: 'title text for adding adult account',
    defaultMessage: 'How would you like to add an adult account?',
  },
  adultAccountSetupTitle: {
    description: 'title text for filling adult account details',
    defaultMessage: 'Adult Account Setup',
  },
  fulfillDetails: {
    description: 'submit button text',
    defaultMessage: 'Start Watching',
  },
  welcomeBack: {
    description: 'welcome back text',
    defaultMessage: 'Welcome back!',
  },
  forgotPassword: {
    description: 'forgot password link text',
    defaultMessage: 'Forgot your password? <resetLink>Reset it here</resetLink>',
  },
  selectAccountHeader: {
    description: 'header text for selecting kids account',
    defaultMessage: 'Select an account to start watching',
  },
  selectAccountDesc: {
    description: 'description text for selecting account',
    defaultMessage: '{username}, these kids accounts are linked to your account:',
  },
  addKidsAccount: {
    description: 'button text for adding kids account',
    defaultMessage: 'Add Kids Account',
  },
});

export default messages;
