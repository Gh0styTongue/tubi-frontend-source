import { defineMessages } from 'react-intl';

export default defineMessages({
  metaTitle: {
    description: 'Metadata title for SEO',
    defaultMessage: '{name} - Free Movies and TV Shows | Tubi TV',
  },
  metaDescription: {
    description: 'Metadata description for SEO',
    defaultMessage: '{titleCount, select, 0 {Watch {name}\'s movies and TV shows for free on Tubi. Find movies and TV shows {name} has acted in, directed, produced, or written.} other {Watch {name}\'s movies and TV shows for free. Stream {titles} now on Tubi.}}',
  },
  heading: {
    description: 'Heading for the page',
    defaultMessage: '{name}\'s Movies and TV Shows',
  },
  noResult: {
    description: 'No result found',
    defaultMessage: 'No movies or TV shows for this person right now. Please try again later.',
  },
  featuredTitle: {
    description: 'Featured section title',
    defaultMessage: 'Featured on Tubi',
  },
  connectionsTitle: {
    description: 'Connections section title',
    defaultMessage: '{name}\'s Connections',
  },
});
