/* istanbul ignore file */
import React, { useMemo } from 'react';
import type { Graph } from 'schema-dts';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

const nflSchema = {
  '@context': 'https://schema.org' as const,
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://tubitv.com/nfl#webpage',
      'url': 'https://tubitv.com/nfl',
      'name': 'NFL on Tubi',
      'isPartOf': { '@id': 'https://tubitv.com/#website' },
      'primaryImageOfPage': { '@id': 'https://tubitv.com/nfl#hero' },
      'mainEntity': { '@id': 'https://tubitv.com/movies/500007362/green-bay-packers-at-detroit-lions#event' },
      'breadcrumb': { '@id': 'https://tubitv.com/nfl#breadcrumbs' },
      'mentions': [
        { '@id': 'https://tubitv.com/movies/500007362/green-bay-packers-at-detroit-lions#event' },
        { '@id': 'https://tubitv.com/movies/500007362/green-bay-packers-at-detroit-lions#broadcast' },
      ],
      'publisher': { '@id': 'https://tubitv.com/#organization' },
      'keywords': [
        'Packers vs Lions',
        'Detroit Lions',
        'Green Bay Packers',
        'NFL',
        'Thanksgiving football',
        'Watch Thanksgiving game free',
        'How to watch',
        'FOX broadcast',
        'live stream',
      ],
    },
    {
      '@type': 'ImageObject',
      '@id': 'https://tubitv.com/nfl#hero',
      'url': 'https://canvas-lb.tubitv.com/opts/kYJlvlx5YhDgbg==/61e85a29-31f4-42e2-8ce8-60246206cd3d/CM4MEIoHOgUxLjEuOA==',
      'width': 1920,
      'height': 1080,
      'caption': 'NFL on Tubi',
    },
    {
      '@type': 'ImageObject',
      '@id': 'https://tubitv.com/nfl#thumbnail',
      'url': 'https://canvas-lb.tubitv.com/opts/zjZ3XzDk_7b_YQ==/fd4987a7-b8c3-4ab0-9073-3919b6825956/CLAJELENOgUxLjEuNw==',
      'width': 622,
      'height': 888,
      'caption': 'Green Bay Packers vs. Detroit Lions — Thumbnail',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://tubitv.com/nfl#breadcrumbs',
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
          'name': 'NFL',
          'item': 'https://tubitv.com/nfl',
        },
      ],
    },
    {
      '@type': 'SportsEvent',
      '@id': 'https://tubitv.com/movies/500007362/green-bay-packers-at-detroit-lions#event',
      'name': 'Green Bay Packers vs. Detroit Lions',
      'alternateName': 'Packers vs. Lions — Thanksgiving Day Game',
      'sport': 'American Football',
      'description': 'Thanksgiving Day NFL matchup: Green Bay Packers vs. Detroit Lions.',
      'startDate': '2025-11-27T12:30:00-05:00',
      'endDate': '2025-11-27T15:30:00-05:00',
      'eventStatus': 'https://schema.org/EventScheduled',
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
      'isAccessibleForFree': true,
      'url': 'https://tubitv.com/nfl',
      'location': { '@id': 'https://www.fordfield.com/#place' },
      'homeTeam': { '@id': 'https://www.detroitlions.com/#team' },
      'awayTeam': { '@id': 'https://www.packers.com/#team' },
      'organizer': { '@id': 'https://tubitv.com/#organization/nfl' },
      'about': { '@id': 'https://tubitv.com/#organization/nfl' },
      'broadcastOfEvent': { '@id': 'https://tubitv.com/movies/500007362/green-bay-packers-at-detroit-lions#broadcast' },
      'potentialAction': {
        '@type': 'WatchAction',
        'target': [
          'https://tubitv.com/networks/fox',
          'tubi://live/fox',
        ],
      },
      'sameAs': [
        'https://www.nfl.com/schedules/',
        'https://www.espn.com/nfl/',
      ],
      'image': [
        { '@id': 'https://tubitv.com/nfl#hero' },
        { '@id': 'https://tubitv.com/nfl#thumbnail' },
      ],
      'keywords': [
        'NFL',
        'American Football',
        'Detroit Lions',
        'Green Bay Packers',
        'Thanksgiving Day',
        'Ford Field',
        'Lions vs Packers',
        'NFL Thanksgiving',
        'Watch NFL free',
        'Live NFL stream',
      ],
    },
    {
      '@type': 'BroadcastEvent',
      '@id': 'https://tubitv.com/movies/500007362/green-bay-packers-at-detroit-lions#broadcast',
      'name': 'Packers vs. Lions Thanksgiving Broadcast',
      'isLiveBroadcast': true,
      'startDate': '2025-11-27T12:30:00-05:00',
      'endDate': '2025-11-27T15:30:00-05:00',
      'broadcastTimezone': 'America/Detroit',
      'broadcastServiceTier': 'free',
      'broadcastOfEvent': { '@id': 'https://tubitv.com/movies/500007362/green-bay-packers-at-detroit-lions#event' },
      'broadcastAffiliateOf': { '@id': 'https://www.fox.com/#organization' },
      'broadcastChannel': {
        '@type': 'TelevisionChannel',
        'name': 'FOX',
      },
      'potentialAction': {
        '@type': 'WatchAction',
        'target': [
          'https://tubitv.com/networks/fox',
          'tubi://live/fox',
        ],
        'actionPlatform': [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
          'https://schema.org/IOSPlatform',
          'https://schema.org/AndroidPlatform',
        ],
      },
    },
    {
      '@type': 'SportsTeam',
      '@id': 'https://www.detroitlions.com/#team',
      'name': 'Detroit Lions',
      'sport': 'American Football',
      'url': 'https://www.detroitlions.com/',
      'sameAs': [
        'https://en.wikipedia.org/wiki/Detroit_Lions',
        'https://twitter.com/Lions',
      ],
    },
    {
      '@type': 'SportsTeam',
      '@id': 'https://www.packers.com/#team',
      'name': 'Green Bay Packers',
      'sport': 'American Football',
      'url': 'https://www.packers.com/',
      'sameAs': [
        'https://en.wikipedia.org/wiki/Green_Bay_Packers',
        'https://twitter.com/packers',
      ],
    },
    {
      '@type': 'Place',
      '@id': 'https://www.fordfield.com/#place',
      'name': 'Ford Field',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '2000 Brush St',
        'addressLocality': 'Detroit',
        'addressRegion': 'MI',
        'postalCode': '48226',
        'addressCountry': 'US',
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 42.3390,
        'longitude': -83.0456,
      },
      'url': 'https://www.fordfield.com/',
    },
    {
      '@type': 'Organization',
      '@id': 'https://tubitv.com/#organization',
      'name': 'Tubi',
      'url': 'https://tubitv.com',
      'logo': { '@id': 'https://tubitv.com/#logo' },
      'sameAs': [
        'https://www.facebook.com/Tubi',
        'https://twitter.com/Tubi',
        'https://www.instagram.com/tubi',
        'https://www.linkedin.com/company/tubi-tv',
        'https://www.youtube.com/c/Tubi',
        'https://www.tiktok.com/@tubi',
      ],
    },
    {
      '@type': 'ImageObject',
      '@id': 'https://tubitv.com/#logo',
      'url': 'https://mcdn.tubitv.com/tubitv-assets/img/repaint/branch-logo.png',
      'width': 512,
      'height': 512,
      'caption': 'Tubi logo',
      'representativeOfPage': false,
    },
    {
      '@type': 'Organization',
      '@id': 'https://tubitv.com/#organization/nfl',
      'name': 'National Football League',
      'url': 'https://www.nfl.com/',
      'sameAs': [
        'https://en.wikipedia.org/wiki/National_Football_League',
        'https://twitter.com/NFL',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://tubitv.com/#website',
      'url': 'https://tubitv.com',
      'name': 'Tubi',
      'publisher': { '@id': 'https://tubitv.com/#organization' },
    },
  ],
};

const NFLSchema = () => {
  const jsonLd = useMemo(() => nflSchema as Graph, []);
  return <JsonLdScript jsonLd={jsonLd} />;
};

export default NFLSchema;
