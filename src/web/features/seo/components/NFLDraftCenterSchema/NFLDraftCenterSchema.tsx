/* istanbul ignore file */
import React from 'react';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

const genJsonLd = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': 'NFL Draft Center | 2025 NFL Draft Coverage & Analysis',
    'description': ' Get full 2025 NFL Draft coverage April 24-26 live from Lambeau Field and free on the NFL Channel on Tubi. Check the draft order, catch first pick by the Tennessee Titans, stay up on team needs, and get live analyses on NFL Draft Center.',
    'url': 'https://tubitv.com/nfl-draft-center',
    'image': 'https://mcdn.tubitv.com/tubitv-assets/img/draftCenter/bannerImage.jpg',
    'datePublished': '2025-04-15',
    'author': {
      '@type': 'Organization',
      'name': 'Tubi',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Tubi',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://mcdn.tubitv.com/tubitv-assets/img/logo-light.png',
      },
    },
    'about': {
      '@type': 'SportsEvent',
      'name': 'NFL Draft 2025',
      'startDate': '2025-04-24T20:00:00-04:00',
      'endDate': '2025-04-26T23:59:00-04:00',
      'sport': 'American Football',
    },
    'mainEntity': {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'Who’s rising on NFL draft boards?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'NFL Draft Center and Mock Draft Live track player movement and key trends as we get closer to draft day. Stay in the know on who’s climbing into Round 1 and who might be a sleeper pick on day 3.',
          },
        },
        {
          '@type': 'Question',
          'name': 'When is the NFL Draft?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'April 24-26, 2025.',
          },
        },
        {
          '@type': 'Question',
          'name': 'What time does the NFL Draft start?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Day 1 (April 24): 8 PM ET, Day 2 (April 25): 7 PM ET, Day 3 (April 26): 12 PM ET.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Where can I watch the NFL Draft?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Watch every pick on NFL ChannelNetwork via NFL Draft Center live and for free on Tubi.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Who will be the number 1 pick?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Stay tuned to Mock Draft Live for updates.',
          },
        },
      ],
    },
  };
};

const EventSchema = () => {
  return <JsonLdScript jsonLd={genJsonLd() as any} />;
};

export default EventSchema;
