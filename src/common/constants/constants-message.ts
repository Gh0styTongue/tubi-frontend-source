/* istanbul ignore file */
import { AccountPageType } from '@tubitv/analytics/lib/pages';
import { defineMessages } from 'react-intl';

export const TITLES_NUMBER_EN = '50,000';

const messages = defineMessages({
  accountPanelTitle: {
    description: 'title of Account panel',
    defaultMessage: 'Account',
  },
  accountPanelDescription: {
    description: 'description of Account panel',
    defaultMessage: 'You can manage your account here.',
  },
  ttsPanelTitle: {
    description: 'title of Text-to-Speech panel',
    defaultMessage: 'Text-To-Speech',
  },
  parentalPanelTitle: {
    description: 'title of Parental Controls panel',
    defaultMessage: 'Parental Controls',
  },
  videoPanelTitle: {
    description: 'title of Video Previews panel',
    defaultMessage: 'Video',
  },
  videoPreviews: {
    description: 'subtitle of Video Previews panel',
    defaultMessage: 'Video Previews',
  },
  videoPreviewsDescription: {
    description: 'description on the video preview enable switch',
    defaultMessage: 'You can turn the Video Preview functionality on or off, which allows you to preview the video while browsing',
  },
  autostart: {
    description: 'subtitle of autostart panel',
    defaultMessage: 'Autostart',
  },
  autostartDescription: {
    description: 'description on the autostart enable switch',
    defaultMessage: 'You can turn the Autostart functionality on or off, which allows you to automatically start playback of video once the preview ends',
  },
  autoplay: {
    description: 'subtitle of autoplay panel',
    defaultMessage: 'Autoplay Next Video',
  },
  autoplayDescription: {
    description: 'description on the autoplay enable switch',
    defaultMessage: 'Content is set up to automatically play another video when what you\'re watching is about to end',
  },
  ccPanelTitle: {
    description: 'title of Closed Captions panel',
    defaultMessage: 'Closed Captions',
  },
  aboutPanelTitle: {
    description: 'title of About panel',
    defaultMessage: 'About',
  },
  termsPanelTitle: {
    description: 'title of Terms of Service panel',
    defaultMessage: 'Terms of Service',
  },
  privacyPanelTitle: {
    description: 'title of Privacy Policy panel',
    defaultMessage: 'Privacy Center',
  },
  yourPrivacyChoicesPanelTitle: {
    description: 'title of Your Privacy Choices panel',
    defaultMessage: 'Your Privacy Choices',
  },
  signOutTitle: {
    description: 'title of Sign Out panel',
    defaultMessage: 'Sign Out',
  },
  aboutTubi: {
    description: 'sub title of About panel',
    defaultMessage: 'About Tubi',
  },
  aboutTubiDescriptionNonUS: {
    description: 'short description about Tubi, with invitation to follow socials. This is for non-US users.',
    defaultMessage: 'Tubi is the leading free, premium video streaming app. We have a large and diverse library of content with thousands of titles and 3x fewer ads than cable TV. Follow us on Facebook, Instagram and Twitter.',
  },
  aboutTubiDescriptionUS: {
    description: 'short description about Tubi, with invitation to follow socials. This is for US users.',
    defaultMessage: 'Tubi is the leading free, premium video streaming app. We have the largest and most diverse library of content with over {titlesNumber} titles and 3x fewer ads than cable TV. Follow us on Facebook, Instagram and Twitter.',
  },
  needHelp: {
    description: 'sub title of About panel',
    defaultMessage: 'Need Help?',
  },
  visit: {
    description: 'visit, and space at the end',
    defaultMessage: 'Visit',
  },
  thirdPartyContactUs: {
    description: 'support team contact, with space at the end',
    defaultMessage: 'Reach out to our Support Team at',
  },
  off: {
    description: 'label for off button toggle',
    defaultMessage: 'Off',
  },
  on: {
    description: 'label for on button toggle',
    defaultMessage: 'On',
  },
  reportAProblemTitle: {
    description: 'title of Report a Problem panel',
    defaultMessage: 'Report a Problem',
  },
  exit: {
    description: 'title of Exit panel',
    defaultMessage: 'Exit',
  },
});

const LINK: 'link' = 'link';
const BR: 'br' = 'br';

export const SETTINGS_PANEL = {
  account: {
    id: 'account',
    title: messages.accountPanelTitle,
    description: messages.accountPanelDescription,
  },
  tts: {
    id: 'tts',
    title: messages.ttsPanelTitle,
  },
  parental: {
    id: 'parental',
    title: messages.parentalPanelTitle,
  },
  video: {
    id: 'video',
    title: messages.videoPanelTitle,
    sections: [{
      id: 'videoPreview',
      title: messages.videoPreviews,
      description: messages.videoPreviewsDescription,
      pageType: AccountPageType.VIDEO_PREVIEW,
      options: [
        {
          label: messages.on,
          value: 'VIDEO_PREVIEWS_ON',
        },
        {
          label: messages.off,
          value: 'VIDEO_PREVIEWS_OFF',
        },
      ],
    }, {
      id: 'autostartVideoPreview',
      title: messages.autostart,
      description: messages.autostartDescription,
      pageType: AccountPageType.AUTOSTART,
      options: [
        {
          label: messages.on,
          value: 'AUTOSTART_ON',
        },
        {
          label: messages.off,
          value: 'AUTOSTART_OFF',
        },
      ],
    }, {
      id: 'autoplayVideo',
      title: messages.autoplay,
      description: messages.autoplayDescription,
      pageType: AccountPageType.AUTOPLAY,
      options: [
        {
          label: messages.on,
          value: 'AUTOPLAY_ON',
        },
        {
          label: messages.off,
          value: 'AUTOPLAY_OFF',
        },
      ],
    }],
  },
  cc: {
    id: 'cc',
    title: messages.ccPanelTitle,
  },
  about: {
    id: 'about',
    title: messages.aboutPanelTitle,
    sections: [
      {
        title: messages.aboutTubi,
        description: messages.aboutTubiDescriptionNonUS,
        descriptionUS: messages.aboutTubiDescriptionUS,
      },
      {
        title: messages.needHelp,
        rawDescription: [
          [
            messages.visit,
            {
              type: LINK,
              content: 'https://tubitv.com/help-center',
            },
            {
              type: BR,
            },
          ],
          [
            messages.thirdPartyContactUs,
            {
              type: LINK,
              content: 'https://tubitv.com/support',
            },
          ],
        ],
      },
    ],
  },
  privacyCenter: {
    id: 'privacy',
    title: messages.privacyPanelTitle,
  },
  yourPrivacyChoices: {
    id: 'yourPrivacyChoices',
    title: messages.yourPrivacyChoicesPanelTitle,
  },
  reportAProblem: {
    id: 'reportAProblem',
    title: messages.reportAProblemTitle,
  },
  signOut: {
    id: 'signOut',
    title: messages.signOutTitle,
  },
  exit: {
    id: 'exit',
    title: messages.exit,
  },
};

export const monthOptionsMessages = defineMessages({
  jan: {
    description: 'january option',
    defaultMessage: 'January',
  },
  feb: {
    description: 'february option',
    defaultMessage: 'February',
  },
  mar: {
    description: 'march option',
    defaultMessage: 'March',
  },
  apr: {
    description: 'april option',
    defaultMessage: 'April',
  },
  may: {
    description: 'may option',
    defaultMessage: 'May',
  },
  june: {
    description: 'june option',
    defaultMessage: 'June',
  },
  july: {
    description: 'july option',
    defaultMessage: 'July',
  },
  aug: {
    description: 'aug option',
    defaultMessage: 'August',
  },
  sep: {
    description: 'september option',
    defaultMessage: 'September',
  },
  oct: {
    description: 'october option',
    defaultMessage: 'October',
  },
  nov: {
    description: 'november option',
    defaultMessage: 'November',
  },
  dec: {
    description: 'december option',
    defaultMessage: 'December',
  },
});

export const ageGateMessages = defineMessages({
  title: {
    description: 'Age gate title message',
    defaultMessage: 'Age Required',
  },
  greeting: {
    description: 'Age gate greeting message on title',
    defaultMessage: 'Welcome Back, {firstName}',
  },
  description: {
    description: 'Age gate description',
    defaultMessage: 'To continue please enter your date of birth.',
  },
  descriptionWithCopy: {
    description: 'Age gate description with copy',
    defaultMessage: 'To continue please enter your date of birth. This helps protect younger individuals in the Tubi community.',
  },
  descriptionYearOfBirth: {
    description: 'Age gate description alternative for year of birth',
    defaultMessage: 'To continue, please verify your year of birth.',
  },
  descriptionYearOfBirthWithCopy: {
    description: 'Age gate description alternative for year of birth with copy',
    defaultMessage: 'To continue, please verify your year of birth. This helps protect younger individuals in the Tubi community.',
  },
  descriptionAge: {
    description: 'Age gate description alternative for age',
    defaultMessage: 'To continue, please verify your age.',
  },
  descriptionAgeWithCopy: {
    description: 'Age gate description alternative for age with copy',
    defaultMessage: 'To continue, please verify your age. This helps protect younger individuals in the Tubi community.',
  },
  startWatching: {
    description: 'Age gate start watching button text for age gate modal',
    defaultMessage: 'Start Watching',
  },
  continue: {
    description: 'Age gate continue button text for age gate modal',
    defaultMessage: 'Continue',
  },
  errorText: {
    description: 'Generic error message',
    defaultMessage: 'Oops, an error occurred',
  },
  whyAskingForAge: {
    description: 'Why ask for age button',
    defaultMessage: 'Why is Tubi asking for my age?',
  },
});

export const sponsorshipMessages = defineMessages({
  broughtToYouBy: {
    description: 'Sponsorship text',
    defaultMessage: 'Brought to you by',
  },
});

export const commonVoiceMessages = defineMessages({
  pressBackForMenu: {
    description: 'accessibility voice message indicating how the user can access the menu',
    defaultMessage: 'Press back for menu.',
  },
  navigateAndSelect: {
    description: 'accessibility voice message indicating how the user can navigate and select an active option in the menu',
    defaultMessage: 'Press up and down to navigate. Press enter to select the active option.',
  },
  pressEnterToContinue: {
    description: 'accessibility voice message indicating how the user can continue',
    defaultMessage: 'Press enter to continue.',
  },
});

export const registrationRequireMessages = defineMessages({
  registrationTitle: {
    description: 'registration area title',
    defaultMessage: 'Log in to pick up where you left off',
  },
  action: {
    description: 'registration area button text',
    defaultMessage: 'Sign In & Watch for',
  },
  desc: {
    description: 'registration area description text',
    defaultMessage: 'You don\'t have to sign in. It\'s just better when you do.',
  },
  free: {
    description: 'FREE tag on registration button',
    defaultMessage: 'FREE',
  },
});
