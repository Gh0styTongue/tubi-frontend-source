import { defineMessages } from 'react-intl';

export default defineMessages({
  header: {
    description: 'header message',
    defaultMessage: 'Check Your Email Inbox',
  },
  headerWeb: {
    description: 'header message for web',
    defaultMessage: 'Check Your Inbox',
  },
  headerForRegistration: {
    description: 'header message for sign up',
    defaultMessage: 'You’ve got mail!',
  },
  subject: {
    description: 'subject message',
    defaultMessage: 'Please click the verification link sent to your email:',
  },
  subjectWeb: {
    description: 'subject message for web',
    defaultMessage: 'Go to this email inbox and click the instant sign-in link:',
  },
  subjectForRegistration: {
    description: 'subject message for sign up',
    defaultMessage: 'To continue creating your account, please check your email inbox and click the verification link sent to:',
  },
  notification: {
    description: 'notification message',
    defaultMessage: 'This screen will refresh once you have verified your email.',
  },
  notificationWeb: {
    description: 'notification message for web',
    defaultMessage: 'This screen will refresh once you have clicked the link in your email.',
  },
  notificationForRegistration: {
    description: 'notification message for web',
    defaultMessage: 'This screen will refresh automatically when you verify the email address above.',
  },
  notification2: {
    description: 'second notification message',
    defaultMessage: 'If you can’t find the email in your inbox, check your Spam folder.',
  },
  notificationContinueAsGuest: {
    description: 'notification message with continue as guest option',
    defaultMessage: 'Haven\'t received an email? You can still continue as Guest.',
  },
  resend: {
    description: 'resend button text',
    defaultMessage: 'Resend Verification Link',
  },
  resendWeb: {
    description: 'resend button text for web',
    defaultMessage: 'Resend Sign-In Link',
  },
  changeEmail: {
    description: 'change email button text',
    defaultMessage: 'Use Different Email',
  },
  continueAsGuest: {
    description: 'continue as guest button text',
    defaultMessage: 'Continue as Guest',
  },
  alertHeader: {
    description: 'alert header message',
    defaultMessage: 'Too Many Attempts...',
  },
  alertBodyLine1: {
    description: 'alert body message',
    defaultMessage: 'Multiple verification emails have already been sent to {email}',
  },
  alertBodyLine2: {
    description: 'alert body message',
    defaultMessage: 'Please remember to check your spam folder',
  },
  tooManyAttempts: {
    description: 'alert message for web',
    defaultMessage: 'Too many attempts. Try again later.',
  },
  checkStatusError: {
    description: 'alert message for web',
    defaultMessage: 'This verification link has expired. For a new verification link, please click on Resend Sign-in Link.',
  },
  close: {
    description: 'close button text',
    defaultMessage: 'Close',
  },
  emailSent: {
    description: 'email sent message',
    defaultMessage: 'Email sent!',
  },
  enterPassword: {
    description: 'enter password link text',
    defaultMessage: '<or>or</or> <link>Enter Password Instead</link>',
  },
  voiceGuide: {
    description: 'enter password link text',
    defaultMessage: 'Press up and down to navigate between options. Press back to go to the sign in page.',
  },
  voiceGuideSuccess: {
    description: 'voice guide when successfully signed in',
    defaultMessage: 'You are now signed in. Will automatically return to the home screen in a few seconds.',
  },
});
