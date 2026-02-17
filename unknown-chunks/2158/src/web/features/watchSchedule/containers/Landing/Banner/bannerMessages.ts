import { defineMessages } from 'react-intl';

const messages = defineMessages({
  logoAlt: {
    description: 'logo image alt',
    defaultMessage: 'Tubi Logo',
  },
  brandSlogan: {
    description: 'brand slogan',
    defaultMessage: 'Watch thousands of movies and TV shows. No credit card needed. 100% legal. Free forever.',
  },
  todayTime: {
    description: 'time of today',
    defaultMessage: 'Today at {time}',
  },
  liveProgrammingTitle: {
    description: 'programming title when live',
    defaultMessage: '{badge} <span>Streaming on <a>{title}</a></span>',
  },
  programmingTitle: {
    description: 'programming title',
    defaultMessage: 'Next on <b>{time}</b> on <a>{title}</a>',
  },
  liveProgramTitle: {
    description: 'program title when live',
    defaultMessage: '{title}{br}{left, plural, =0 {1 min} one {1 min} other {{left} mins}} left',
  },
  programTitle: {
    description: 'program title',
    defaultMessage: '{title}{br}{duration} mins',
  },
  whenNotify: {
    description: 'when receiving notification',
    defaultMessage: 'Get an email an hour before this episode streams.',
  },
  whenNotifyForSportsEvent: {
    description: 'when receiving notification for sports event',
    defaultMessage: 'Get an email an hour before this match streams.',
  },
  readMore: {
    description: 'The label for the read more button',
    defaultMessage: 'Read more',
  },
});

export default messages;
