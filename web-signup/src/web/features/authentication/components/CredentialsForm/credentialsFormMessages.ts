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
  registerButtonLabel: {
    description: 'label for next button',
    defaultMessage: 'Next',
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
  passwordBlanksError: {
    description: 'error message for spaces in password',
    defaultMessage: 'Password cannot contain a blank space(s)',
  },
  passwordLengthError: {
    description: 'error message for password length',
    defaultMessage: 'Length must be between 6 and 30',
  },
  passwordMismatchError: {
    description: 'error message if passwords do not match',
    defaultMessage: 'Passwords do not match',
  },
  invalidEmail: {
    description: 'error message if the email is invalid',
    defaultMessage: 'Invalid email address',
  },
  welcome: {
    description: 'welcoming user with message',
    defaultMessage: 'Let\'s get you set up',
  },
  free: {
    description: 'value proposition label',
    defaultMessage: 'It\'s free. No subscription required',
  },
});
