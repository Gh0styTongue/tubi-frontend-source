import { defineMessages } from 'react-intl';

const messages = defineMessages({
  gameBeforeTextWithoutLoggedIn: {
    description: 'banner text before the game',
    defaultMessage: 'Get ready for the World Cup™. Sign in to watch free on {date}. No credit card required.',
  },
  gameBeforeText: {
    description: 'banner text before the game',
    defaultMessage: 'The biggest tournament is coming. Watch free on {date}.',
  },
  watchOnTubiAppText: {
    description: 'banner text of watch on the big screen',
    defaultMessage: 'Watch the game on the big screen',
  },
  viewSupportedDevicesText: {
    description: 'button text of view supported devices button',
    defaultMessage: 'View supported devices',
  },
  disasterTip: {
    defaultMessage: 'We’re having trouble connecting. You can still watch the game!',
    description: 'Banner text for disaster mode',
  },
});

export default messages;
