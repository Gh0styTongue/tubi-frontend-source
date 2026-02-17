import { defineMessages } from 'react-intl';

const messages = defineMessages({
  watchOnTubiAppText: {
    description: 'banner text of watch on the big screen',
    defaultMessage: 'Watch the game on the big screen',
  },
  viewSupportedDevicesText: {
    description: 'button text of view supported devices button',
    defaultMessage: 'View supported devices',
  },
  disasterTip: {
    defaultMessage: 'We’re having trouble connecting. You can still watch {name}!',
    description: 'Banner text for disaster mode',
  },
  fallbackEventName: {
    description: 'The fallback for major event name',
    defaultMessage: 'the game',
  },
});

export default messages;
