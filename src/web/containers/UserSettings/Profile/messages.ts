import { defineMessages } from 'react-intl';

export default defineMessages({
  saveSetting: {
    description: 'message if user leaves page without saving settings changes',
    defaultMessage: 'Navigating away will discard your new settings. Are you sure you want to leave?',
  },
  notificationTitle: {
    description: 'successfully changed email toast notification title',
    defaultMessage: 'Email changed! Please verify your email address',
  },
  notificationDesc: {
    description: 'successfully changed email toast notification description ',
    defaultMessage: 'Thanks for updating your email. We sent you an email to verify your address. Use the link in the email to complete the process.',
  },
  notificationButton: {
    description: 'successfully changed email toast notification button to close',
    defaultMessage: 'Done',
  },
  invalidEmail: {
    description: 'invalid email error message',
    defaultMessage: 'Valid Email Required!',
  },
  invalidName: {
    description: 'invalid first name error message',
    defaultMessage: 'Valid First Name Required!',
  },
  generalError: {
    description: 'general error message',
    defaultMessage: 'Something went wrong...',
  },
  myAccount: {
    description: 'my account user settings page title',
    defaultMessage: 'My Account',
  },
  myAccountDesc: {
    description: 'my account user settings page description',
    defaultMessage: 'Manage your profile, parental controls, notifications and history settings here.',
  },
  myAccountKidsDesc: {
    description: 'my account user settings page description for kid account',
    defaultMessage: 'Manage your account, notifications and history settings here.',
  },
  save: {
    description: 'save changes button text',
    defaultMessage: 'Save',
  },
  saving: {
    description: 'save changes button text during settings being saved',
    defaultMessage: 'Saving...',
  },
  saved: {
    description: 'save changes button text when settings have been saved',
    defaultMessage: 'Saved!',
  },
  leaveConfirmTitle: {
    description: 'title for leave confirmation modal',
    defaultMessage: 'Unsaved Changes',
  },
  stayButton: {
    description: 'stay button text in leave confirmation modal',
    defaultMessage: 'Stay',
  },
  leaveButton: {
    description: 'leave button text in leave confirmation modal',
    defaultMessage: 'Leave',
  },
});
