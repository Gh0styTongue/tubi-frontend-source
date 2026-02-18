import { defineMessages } from 'react-intl';

export const settingChangeModalMessages = defineMessages({
  header: {
    description: 'Modal header for content settings updated confirmation',
    defaultMessage: 'Content Settings Updated',
  },
  subheader: {
    description: 'Modal subheader explaining the change',
    defaultMessage: 'You will be directed to Tubi Kids.',
  },
  alert: {
    description: 'Modal alert message showing the changed setting',
    defaultMessage: 'Content Settings changed to:{br}{changedSetting}',
  },
  confirmBtn: {
    description: 'Confirm button text',
    defaultMessage: 'Confirm',
  },
  cancelBtn: {
    description: 'Cancel button text',
    defaultMessage: 'Cancel',
  },
  okBtn: {
    description: 'OK button text',
    defaultMessage: 'OK',
  },
});
