/* istanbul ignore file */
import React from 'react';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

const genJsonLd = () => {
  return {
    '@context': 'http://schema.org/',
    '@type': 'WebPage',
    'name': 'Tubi 2025 Super Bowl LIX',
    'description': 'Watch Super Bowl LIX live on Tubi, streaming for free on February 9, 2025. Includes pre-game, halftime, and post-game shows, and an exclusive red carpet event.',
    'url': 'https://tubitv.com/superbowl',
    'dateCreated': '2025-02-01T18:30:00-05:00',
    'dateModified': '2025-02-01T18:30:00-05:00',
    'datePublished': '2025-02-01T18:30:00-05:00',
    'breadcrumb': {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': 'https://tubitv.com/',
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Super Bowl LIX',
          'item': 'https://tubitv.com/superbowl',
        },
      ],
    },
    'mainEntity': {
      '@type': 'SportsEvent',
      'name': 'Super Bowl LIX',
      'description': 'Watch Super Bowl LIX live on Tubi for free. Stream the full game, including pre-game, halftime show, and post-game coverage.',
      'startDate': '2025-02-09T18:30:00-05:00',
      'endDate': '2025-02-09T22:00:00-05:00',
      'location': {
        '@type': 'Place',
        'name': 'Caesars Superdome',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': '1500 Sugar Bowl Dr',
          'addressLocality': 'New Orleans',
          'addressRegion': 'LA',
          'postalCode': '70112',
          'addressCountry': 'US',
        },
      },
      'performer': {
        '@type': 'PerformingGroup',
        'name': 'Kendrick Lamar',
        'description': 'Kendrick Lamar will headline the halftime show, with special guest SZA.',
      },
      'organizer': {
        '@type': 'Organization',
        'name': 'National Football League',
        'url': 'https://www.nfl.com',
      },
      'offers': {
        '@type': 'Offer',
        'url': 'https://tubitv.com/superbowl',
        'price': '0',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock',
        'validFrom': '2025-01-27T00:00:00-05:00',
        'description': 'Stream Super Bowl LIX live for free on Tubi. No subscription or credit card required.',
      },
      'broadcastOfEvent': {
        '@type': 'BroadcastEvent',
        'name': 'Super Bowl LIX Live Stream',
        'description': 'Live stream of Super Bowl LIX, available for free on Tubi.',
        'startDate': '2025-02-09T18:30:00-05:00',
        'endDate': '2025-02-09T22:00:00-05:00',
        'url': 'https://tubitv.com/superbowl',
        'isAccessibleForFree': true,
        'inLanguage': 'en',
        'videoFormat': '4K',
        'broadcastAffiliateOf': {
          '@type': 'Organization',
          'name': 'FOX Sports',
          'url': 'https://www.foxsports.com',
        },
      },
    },
  };
};

const EventSchema = () => {
  return <JsonLdScript jsonLd={genJsonLd() as any} />;
};

export default EventSchema;
