import { defineMessages } from 'react-intl';

const messages = defineMessages({
  guestHeader: {
    description: 'header text for guest user',
    defaultMessage: 'Adult Account Setup',
  },
  guestDesc: {
    description: 'description of tubi services',
    defaultMessage: 'Sign in to an adult account to create a kids account.',
  },
  almostDoneHeader: {
    description: 'header text for next action',
    defaultMessage: 'Well done, {firstName}!',
  },
  almostDoneDesc: {
    description: 'description for next action',
    defaultMessage: 'These kids accounts are linked to your adult account:',
  },
  completeSignIn: {
    description: 'button text for next action - complete sign in',
    defaultMessage: 'Start Watching',
  },
  addNewKidAccount: {
    description: 'button text for next action - add kid account',
    defaultMessage: 'Add New Kids Account',
  },
  setupKidsAccountHeader: {
    description: 'header text for setting up kids account',
    defaultMessage: 'Kids Account Setup',
  },
  setupKidsAccountDesc: {
    description: 'description text for setting up kids account',
    defaultMessage: 'Enter your kid\'s info to set up and personalize their kids account.',
  },
  tip: {
    description: 'tip text for setting up kids account',
    defaultMessage: 'This account will manage the Tubi Kids account.',
  },
  adminAccount: {
    description: 'text for admin account field',
    defaultMessage: 'Admin Account',
  },
  kidsFirstName: {
    description: 'hint text for inputting kids first name',
    defaultMessage: 'Kid’s First Name',
  },
  contentSetting: {
    description: 'hint text for choosing content setting level',
    defaultMessage: 'Content Setting',
  },
  pin: {
    description: 'hint text for inputting pin code',
    defaultMessage: 'PIN',
  },
  pinExisted: {
    description: 'text for pin (existed)',
    defaultMessage: 'PIN (Already Set)',
  },
  pinEnabled: {
    description: 'text for pin toggle (enabled)',
    defaultMessage: 'PIN Enabled',
  },
  pinDisabled: {
    description: 'text for pin toggle (disabled)',
    defaultMessage: 'PIN Disabled',
  },
  pinEnabledDesc: {
    description: 'additional text for pin code (enabled)',
    defaultMessage: 'When enabled, you must enter this PIN to exit Tubi Kids accounts.',
  },
  pinDisabledDesc: {
    description: 'additional text for pin code (disabled)',
    defaultMessage: 'You are choosing to disable the PIN for this kid. When enabled, you must enter this PIN to exit Tubi Kids accounts.',
  },
  pinExistedDesc: {
    description: 'additional text for existed pin code',
    defaultMessage: 'We’ve remembered your PIN from last time! This PIN prevents kids from changing Content Settings or leaving Tubi Kids. To edit your PIN, go to Settings.',
  },
  pinDescMore: {
    description: 'link for more about pin code',
    defaultMessage: 'Learn More',
  },
  terms: {
    description: 'terms text',
    defaultMessage: 'By clicking the “Finish Setup” button, you agree to <termsLink>Tubi’s Terms of Use</termsLink> and <privacyLink>Privacy Policy</privacyLink>.',
  },
  continue: {
    description: 'text for submit button',
    defaultMessage: 'Continue',
  },
  submit: {
    description: 'text for submit button',
    defaultMessage: 'Finish Setup',
  },
  help: {
    description: 'link text to help center',
    defaultMessage: 'Need help? <helpLink>Visit Help Center</helpLink>',
  },
});

export const contentSettingMessages = defineMessages({
  conetentSettingTitle: {
    description: 'title text for selecting content setting',
    defaultMessage: 'Select a content setting',
  },
  contentSettingDesc: {
    description: 'description text for selecting content setting',
    defaultMessage: 'Ratings explained',
  },
  optionPrefix: {
    description: 'text for age option prefix',
    defaultMessage: 'Age Rating',
  },
  youngest: {
    description: 'text for age option: youngest',
    defaultMessage: '1-3',
  },
  younger: {
    description: 'text for age option: younger',
    defaultMessage: '4-6',
  },
  older: {
    description: 'text for age option: older',
    defaultMessage: '7-9',
  },
  oldest: {
    description: 'text for age option: oldest',
    defaultMessage: '10-12',
  },
  optionHint: {
    description: 'hint text for each option',
    defaultMessage: 'Includes content up to',
  },
});

export const resultMessages = defineMessages({
  accountLimitTitle: {
    description: 'title for too many kid accounts',
    defaultMessage: 'Account Limit Reached',
  },
  accountLimitDesc: {
    description: 'description for too many kid accounts',
    defaultMessage: '7 Kid Accounts is the maximum for Tubi. To add a new Kid, delete an existing Kid account.',
  },
  button: {
    description: 'text for back to home button',
    defaultMessage: 'Back to Home',
  },
});

export const errorMessages = defineMessages({
  required: {
    description: 'error message for required fields',
    defaultMessage: 'Required Field',
  },
  invalidPIN: {
    description: 'error message for invalid PIN code',
    defaultMessage: 'PIN must be 4 digits (numbers only). Try again.',
  },
  duplicateKidName: {
    description: 'error message for duplicate kid name',
    defaultMessage: 'This name is already taken. Please try again.',
  },
});

export default messages;
