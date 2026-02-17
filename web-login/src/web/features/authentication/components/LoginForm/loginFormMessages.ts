import { defineMessages } from 'react-intl';

export default defineMessages({
  emailSignIn: {
    description: 'label for email sign in',
    defaultMessage: 'Sign In via Email',
  },
  magicLinkSignIn: {
    description: 'label for magic link sign in',
    defaultMessage: 'Continue with Email',
  },
  emailLabel: {
    description: 'label for email input',
    defaultMessage: 'Email',
  },
  passwordLabel: {
    description: 'label for password input',
    defaultMessage: 'Password',
  },
  signInButtonLabel: {
    description: 'label for email sign in button',
    defaultMessage: 'Sign In',
  },
  forgotPassword: {
    description: 'title for forgot password section',
    defaultMessage: 'Forgot password?',
  },
  noAccountPrompt: {
    description: 'prompt if user does not have an account',
    defaultMessage: 'Don\'t have an account?',
  },
  registerLink: {
    description: 'text for register link',
    defaultMessage: 'Register',
  },
  requiredError: {
    description: 'error message for a required field',
    defaultMessage: 'Required',
  },
  invalidEmailError: {
    description: 'error message for an invalid email',
    defaultMessage: 'Invalid email address',
  },
  welcome: {
    description: 'greeting message',
    defaultMessage: 'Welcome Back!',
  },
  termsAgreement: {
    description: 'legal agreement copy for terms and privacy',
    defaultMessage: 'By registering, you agree to Tubi\'s <termsLink>Terms of Use</termsLink> and <privacyLink>Privacy Policy</privacyLink>',
  },
  ownedAccountMessage: {
    description: 'prompt and link for users with account',
    defaultMessage: 'Already have an account? <signInLink>Sign In</signInLink>',
  },
  tooManyRequests: {
    description: 'text for too many requests',
    defaultMessage: 'Too many requests were sent, please try again later.',
  },
  signInWithoutPassword: {
    description: 'prompt and link for sign in without password',
    defaultMessage: 'Want to <signInLink>sign in without a password</signInLink>?',
  },
  continueButtonLabel: {
    description: 'label for continue with magic link button',
    defaultMessage: 'Continue',
  },
  newEmailAlert: {
    description: 'prompt and link for register',
    defaultMessage: 'This email has never been used.<linebreak></linebreak>Please <registerLink>create an account.</registerLink>',
  },
  emailAddress: {
    description: 'email address label text',
    defaultMessage: 'Signing in with:',
  },
  magicLinkButton: {
    description: 'button text of with magic link button',
    defaultMessage: 'Continue without Password',
  },
  enterYourPassword: {
    description: 'title of step 2 form',
    defaultMessage: 'Enter Your Password',
  },
});
