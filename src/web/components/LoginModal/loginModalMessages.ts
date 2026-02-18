import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  or: {
    description: 'text for other login option',
    defaultMessage: 'OR',
  },
  register: {
    description: 'Register button text',
    defaultMessage: 'Register with Email',
  },
  remindLoginModalTitle: {
    description: 'title for remind modal',
    defaultMessage: 'Be the First to Know',
  },
  termsAgreement: {
    description: 'legal agreement copy for terms and privacy',
    defaultMessage: 'By clicking a button below, you agree to Tubi’s <termsLink>Terms of Use</termsLink> and <privacyLink>Privacy Policy</privacyLink>.',
  },
  chooseAccount: {
    description: 'choose account title',
    defaultMessage: 'Choose an account to continue.',
  },
  addAccount: {
    description: 'add account title',
    defaultMessage: 'Add account',
  },
  addAccountDescription: {
    description: 'add account description',
    defaultMessage: 'For adults and kids',
  },
  freeBadge: {
    description: 'free badge text',
    defaultMessage: 'Free',
  },
  maxAccounts: {
    description: 'max accounts description',
    defaultMessage: 'Maximum 8 accounts on Tubi. To add a new one, sign out of an existing account in Settings.',
  },
  contentNotAvailableForKids: {
    description: 'content not available for kids info',
    defaultMessage: "This content isn't available for kids.",
  },
  whoIsWatching: {
    description: 'who is watching title',
    defaultMessage: 'Who’s watching?',
  },
  welcome: {
    description: 'welcome notification',
    defaultMessage: 'Welcome, {username}!',
  },
});
