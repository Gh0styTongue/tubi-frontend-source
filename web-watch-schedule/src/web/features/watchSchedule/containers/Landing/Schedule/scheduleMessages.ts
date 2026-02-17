import { defineMessages } from 'react-intl';

const messages = defineMessages({
  title: {
    description: 'sechedule section title',
    defaultMessage: 'Live Programming for {title}',
  },
  desc: {
    description: 'sechedule section description',
    defaultMessage: 'Use the "Remind Me" button to get an email reminder an hour before an episode is streaming.',
  },
  descForSportsEvent: {
    description: 'sechedule section description for sports event',
    defaultMessage: 'Use the "Remind Me" button to get an email reminder an hour before a match is streaming.',
  },
  noShowing: {
    description: 'no showing message',
    defaultMessage: 'No showing of {title}',
  },
  noShowingForSportsEvent: {
    description: 'no showing message for sports event',
    defaultMessage: 'No matches scheduled',
  },
  today: {
    description: 'today',
    defaultMessage: 'Today',
  },
  liveProgramTitle: {
    description: 'program title when live',
    defaultMessage: '{title} - {episodeTitle} {left, plural, =0 {1 min} one {1 min} other {{left} mins}} left',
  },
  programTitle: {
    description: 'program title',
    // duration is always longer than 1 min so we don't consider singular case
    defaultMessage: '{title} - {episodeTitle} {duration} mins',
  },
  loadMore: {
    description: 'load more button',
    defaultMessage: 'More Programming',
  },
});

export default messages;
