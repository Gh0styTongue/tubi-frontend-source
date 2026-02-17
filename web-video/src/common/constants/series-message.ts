import { defineMessages } from 'react-intl';

const messages = defineMessages({
  seasonDropdownLabel: {
    description: 'The text shown to indicate which season of a series this is',
    defaultMessage: 'Season {seasonNumber}',
  },
  loading: {
    description: 'The text shown underneath the placeholder title for episodes of series that are still being loaded in',
    defaultMessage: 'Loading',
  },
});

export default messages;
