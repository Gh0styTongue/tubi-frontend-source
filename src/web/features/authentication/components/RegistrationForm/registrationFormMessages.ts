import { defineMessages } from 'react-intl';

export default defineMessages({
  birthdayDayLabel: {
    description: 'label for birthday day',
    defaultMessage: 'Day',
  },
  birthdayMonthLabel: {
    description: 'label for birthday month',
    defaultMessage: 'Month',
  },
  birthdayYearLabel: {
    description: 'label for birthday year',
    defaultMessage: 'Year',
  },
  signInOrRegister: {
    description: 'alternate option message specifically for email existing',
    defaultMessage: 'Please <signInLink>Login</signInLink> or <resetPasswordLink>Reset your password</resetPasswordLink>',
  },
  coppaErrorMessage: {
    description: 'error message if user is underage and tries to register',
    defaultMessage: 'Sorry there was a problem',
  },
  emailRegHeading: {
    description: 'heading for email registration',
    defaultMessage: 'Register via Email',
  },
  firstNameLabel: {
    description: 'label for first name',
    defaultMessage: 'First Name',
  },
  emailLabel: {
    description: 'label for email',
    defaultMessage: 'Email',
  },
  emailHint: {
    description: 'hint text for email field',
    defaultMessage: 'We never share this',
  },
  passwordLabel: {
    description: 'label for first password field',
    defaultMessage: 'Password',
  },
  passwordHint: {
    description: 'hint text for first password field',
    defaultMessage: 'Pick something you can remember',
  },
  password2Label: {
    description: 'label for second password field (confirmation)',
    defaultMessage: 'Confirm Password',
  },
  password2Hint: {
    description: 'hint text for second password field',
    defaultMessage: 'This has to match the above password',
  },
  birthdayLabel: {
    description: 'label for birthday field',
    defaultMessage: 'Birthday',
  },
  genderLabel: {
    description: 'label for gender field',
    defaultMessage: 'Gender',
  },
  registerButtonLabel: {
    description: 'label for register button',
    defaultMessage: 'Register',
  },
  termsAgreement: {
    description: 'legal agreement copy for terms and privacy',
    defaultMessage: 'By continuing or registering, you agree that you have read and understood Tubi\'s <privacyLink>Privacy Policy</privacyLink> and agree to Tubi\'s <termsLink>Terms of Use</termsLink>.',
  },
  ownedAccountMessage: {
    description: 'prompt and link for users with account',
    defaultMessage: 'Already have an account? <signInLink>Sign In</signInLink>',
  },
  required: {
    description: 'error message for required fields',
    defaultMessage: 'Required Field',
  },
  invalidEmail: {
    description: 'error message if the email is invalid',
    defaultMessage: 'Invalid email address',
  },
  invalidMonth: {
    description: 'error message if the month is invalid',
    defaultMessage: 'Invalid Month',
  },
  invalidDay: {
    description: 'error message if the day is invalid',
    defaultMessage: 'Invalid Day',
  },
  invalidYear: {
    description: 'error message if the year is invalid',
    defaultMessage: 'Invalid Year',
  },
  invalidBirthday: {
    description: 'error message if the birthday is invalid',
    defaultMessage: 'Invalid Birthday',
  },
  futureBirthday: {
    description: 'error message if the birthday is in the future',
    defaultMessage: 'Birthday cannot be in the future',
  },
  welcome: {
    description: 'welcoming user with message',
    defaultMessage: 'Let\'s get you set up!',
  },
  free: {
    description: 'value proposition label',
    defaultMessage: 'It\'s free. No subscription required',
  },
});
