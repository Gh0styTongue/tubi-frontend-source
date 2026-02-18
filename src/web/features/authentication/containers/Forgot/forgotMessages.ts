import { defineMessages } from 'react-intl';

export default defineMessages({
  titleSuccess: {
    description: 'success title message after submitting forgot password',
    defaultMessage: 'You\'ve Got Mail!',
  },
  titleForgot: {
    description: 'title for /forgot',
    defaultMessage: 'Forgot Password',
  },
  titlePassword: {
    description: 'title for /password',
    defaultMessage: 'Set Your Password',
  },
  subtitleSuccess: {
    description: 'success subtitle message after submitting forgot password',
    defaultMessage: 'We\'ve emailed the associated account if it exists. Please check your mailbox and follow the instructions.',
  },
  subtitleForgot: {
    description: 'subtitle for /forgot',
    defaultMessage: 'Type your email address, so we can send you reset instructions.',
  },
  subtitlePassword: {
    description: 'subtitle for /password',
    defaultMessage: 'Type your email address, so we can send you a link with instructions on how to set your new password.',
  },
  hint: {
    description: 'input form field hint',
    defaultMessage: 'Enter your email',
  },
  email: {
    description: 'input form field label',
    defaultMessage: 'Email',
  },
  error: {
    description: 'input form field error',
    defaultMessage: 'Invalid email address',
  },
  required: {
    description: 'input form field required',
    defaultMessage: 'Required Field',
  },
  submit: {
    description: 'Submit form button text for /forgot',
    defaultMessage: 'Reset My Password',
  },
  submitPassword: {
    description: 'Submit form button text for /password',
    defaultMessage: 'Send',
  },
});
