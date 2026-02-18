import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    description: 'Content settings title',
    defaultMessage: 'Content Settings',
  },
  subtitle: {
    description: 'Content settings subtitle explaining the feature',
    defaultMessage: 'Set content rating limits for your account to keep viewing safe and age-appropriate. If this selection is changed, you will be required to register or sign into Tubi.',
  },
  dropdownLabel: {
    description: 'Content rating dropdown label',
    defaultMessage: 'Content Rating',
  },
  save: {
    description: 'Save button text',
    defaultMessage: 'Save',
  },
  saving: {
    description: 'Save button text during settings being saved',
    defaultMessage: 'Saving...',
  },
  saved: {
    description: 'Save button text when settings have been saved',
    defaultMessage: 'Saved!',
  },
  pinSectionTitle: {
    description: 'PIN section title',
    defaultMessage: 'PIN',
  },
  pinSectionSubtitle: {
    description: 'PIN section subtitle explaining the feature',
    defaultMessage: 'You must enter this PIN to exit Tubi Kids accounts.',
  },
  createPin: {
    description: 'Create PIN button text',
    defaultMessage: 'Create PIN',
  },
  editPin: {
    description: 'Edit PIN button text',
    defaultMessage: 'Edit PIN',
  },
  notificationTitle: {
    description: 'Successfully changed content settings notification title',
    defaultMessage: 'Content Settings Updated',
  },
  notificationDesc: {
    description: 'Successfully changed content settings notification description',
    defaultMessage: 'Content settings changed to {rating}. Please allow 24 hours for other devices to update.',
  },
  notificationButton: {
    description: 'Notification dismiss button text',
    defaultMessage: 'Done',
  },
  warning: {
    description: 'Warning when leaving page without saving',
    defaultMessage: 'Navigating away will discard your new settings. Are you sure you want to leave?',
  },
});
