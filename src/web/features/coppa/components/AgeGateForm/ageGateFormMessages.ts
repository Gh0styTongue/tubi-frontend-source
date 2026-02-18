import { defineMessages } from 'react-intl';

export default defineMessages({
  headerForNewUser: {
    description: 'header message for new user',
    defaultMessage: 'Welcome to Tubi, {username}',
  },
  headerForReturningUser: {
    description: 'header message for returning user',
    defaultMessage: 'Welcome back, {username}',
  },
  headerForGuestUser: {
    description: 'header message for guest user',
    defaultMessage: 'How old are you?',
  },
  headerForMagicLink: {
    description: 'header message for magic link',
    defaultMessage: 'Tubi’s Better When We Know You',
  },
  subheader: {
    description: 'subheader message for returning user',
    defaultMessage: 'To continue, please enter your age and gender',
  },
  subheaderForGuest: {
    description: 'subheader message for returning user',
    defaultMessage: 'To continue, please enter your age',
  },
  subheaderForYOB: {
    description: 'subheader message for exit kids mode',
    defaultMessage: 'To continue, please verify your year of birth',
  },
  subheaderForMagicLink: {
    description: 'subheader message for magic link',
    defaultMessage: 'Fill out the fields below to help us serve up more personalized recommendations on what to watch.',
  },
  coppaErrorMessage: {
    description: 'blah',
    defaultMessage: 'blah',
  },
  dobHeaderLabel: {
    description: 'label for date of birth header',
    defaultMessage: 'Date of Birth',
  },
  birthMonthLabel: {
    description: 'label for birth month field',
    defaultMessage: 'Month',
  },
  birthDayLabel: {
    description: 'label for birth day field',
    defaultMessage: 'Day',
  },
  birthYearLabel: {
    description: 'label for birth year field',
    defaultMessage: 'Year',
  },
  genderHeaderLabel: {
    description: 'label for gender header',
    defaultMessage: 'Gender',
  },
  genderFieldLabel: {
    description: 'label for gender field',
    defaultMessage: 'Choose Gender',
  },
  firstNameFieldLabel: {
    description: 'label for first name field',
    defaultMessage: 'First Name',
  },
  submitLabel: {
    description: 'label for submit button',
    defaultMessage: 'Continue',
  },
  startWatching: {
    description: 'label for start watching button',
    defaultMessage: 'Start Watching',
  },
  support: {
    description: 'text for why age gate prompts',
    defaultMessage: 'Why do we ask for this information?',
  },
  support2: {
    description: 'text for why age gate modal prompts',
    defaultMessage: 'We process this information as described in Tubi\'s Privacy Policy and Terms of Use.\n'
      + 'For more information, see <termsUrl>www.tubi.tv/privacy</termsUrl> and <termsUrl>www.tubi.tv/terms</termsUrl>.\n'
      + 'Questions? Let us know at <supportEmail>www.tubi.tv/support</supportEmail>',
  },
  termsAgreementForMagicLink: {
    description: 'legal agreement copy for terms and privacy',
    defaultMessage: 'By registering, you agree to Tubi\'s <termsLink>Terms of Use</termsLink> and <privacyLink>Privacy Policy</privacyLink>',
  },
  birthYearLabel2: {
    description: 'label for birth year field',
    defaultMessage: 'Year of Birth',
  },
  ageLabel: {
    description: 'label for age field',
    defaultMessage: 'Age',
  },
  years: {
    description: 'label for age field placeholder',
    defaultMessage: 'Years',
  },
  personalizationAgreement: {
    description: 'text for opt-in option on CRM personalization',
    defaultMessage: 'Please send me personalised emails about what’s new and recommended at Tubi, as well as Tubi features and experiences, using my account information. Unsubscribe anytime.',
  },
  termsAgreement: {
    description: 'legal agreement copy for terms and privacy',
    defaultMessage: 'By continuing, you agree that you have read and understand Tubi\'s <privacyLink>Privacy Policy</privacyLink> and agree to Tubi\'s <termsLink>Terms of Use</termsLink>.',
  },
});
