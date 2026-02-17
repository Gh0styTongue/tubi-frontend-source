import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    description: 'Parental controls title',
    defaultMessage: 'Parental Controls',
  },
  warning: {
    description: 'warning when you leave parental controls page without saving',
    defaultMessage: 'Navigating away will discard your new settings. Are you sure you want to leave?',
  },
  choose: {
    description: 'change parental control level text',
    defaultMessage: 'Choose the desired level of parental controls in order to restrict the content you\'ll be able to access on Tubi.',
  },
  dropdownLabel: {
    description: 'change parental control dropdown label',
    defaultMessage: 'Content Restrictions',
  },
  password: {
    description: 'password input label',
    defaultMessage: 'Password',
  },
  enterPw: {
    description: 'enter your password text',
    defaultMessage: 'Enter your password in order to save your configuration.',
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
  notificationTitle: {
    description: 'successfully changed email toast notification title',
    defaultMessage: 'Parental Controls Settings Change',
  },
  notificationDesc: {
    description: 'successfully changed email toast notification description ',
    defaultMessage: 'Parental controls settings is changed to {rating}. Please allow 24 hours for other devices to update',
  },
  notificationButton: {
    description: 'successfully changed email toast notification button to close',
    defaultMessage: 'Done',
  },
  notificationButtonWatch: {
    description: 'successfully changed email toast notification button to close',
    defaultMessage: 'Start Watching',
  },
});
