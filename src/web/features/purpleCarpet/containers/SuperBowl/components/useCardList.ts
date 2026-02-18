/* istanbul ignore file */
import { SB_DEPORTES_CONTENT_ID, SB_PREGAME_CONTENT_ID, SB_PURPLE_CARPET_CONTENT_ID, NFL_CONTENT_ID, FOX_SPORTS_CONTENT_ID } from 'web/features/purpleCarpet/containers/SuperBowl/sb-constants';

import type { ContentCardProps } from './ContentCard';

const useCardList: () => ContentCardProps[] = () => {
  return [
    {
      id: SB_PREGAME_CONTENT_ID,
      type: 'se',
      title: 'Fox Super Bowl LIX Pregame',
      description: 'Join us for FOX\'s expansive pregame coverage, including the Road to Super Bowl LIX, The Madden Cruiser: A Bayou Adventure with Bill Belichick, and the FOX Super Bowl LIX Pregame. Stay tuned for an interview between President Trump and FOX anchor Bret Baier at 3 PM ET.',
      airDatetime: '2025-02-09T16:00:00Z',
      needsLogin: true,
      hasCC: true,
      genreTags: ['Sports'],
      poster: 'https://mcdn.tubitv.com/tubitv-assets/img/purpleCarpetLanding/pregamelandscape.jpg',
      shouldIgnorePcStatus: true,
      linkToDetails: '/movies/500005036/fox-super-bowl-lix-pregame',
    },
    {
      id: SB_PURPLE_CARPET_CONTENT_ID,
      type: 'se',
      title: 'Tubi Red Carpet at Super Bowl LIX',
      description: 'A fresh new pre-game show with Olivia Culpo. Live at the VIP entrance of Caesar\'s Superdome, get a first look at who\'s arriving and what they\'re wearing.',
      airDatetime: '2025-02-09T20:30:00Z',
      hasCC: true,
      needsLogin: true,
      genreTags: ['Reality'],
      poster: 'https://mcdn.tubitv.com/tubitv-assets/img/purpleCarpetLanding/purplecarpet.jpg',
      shouldIgnorePcStatus: true,
      linkToDetails: '/movies/500005037/tubi-red-carpet-at-super-bowl-lix',
    },
    {
      id: SB_DEPORTES_CONTENT_ID,
      type: 'se',
      title: 'Super Bowl LIX en español',
      description: 'Mira el Super Bowl en vivo desde el Caesars Superdome en Nueva Orleans. ¡Regístrate ahora para transmitirlo en vivo y gratis en Tubi o míralo en FOX!',
      airDatetime: '2025-02-09T23:30:00Z',
      hasCC: true,
      needsLogin: true,
      genreTags: ['Sports'],
      poster: 'https://mcdn.tubitv.com/tubitv-assets/img/purpleCarpetLanding/deportes.jpg',
      shouldIgnorePcStatus: true,
      linkToDetails: '/movies/500005039/super-bowl-lix-en-espa-ol',
    },
    {
      id: NFL_CONTENT_ID,
      type: 'l',
      title: 'NFL Channel',
      description: 'Get 24/7, always-on access to NFL content on NFL Channel! The NFL Channel features Live Game Day Coverage, NFL Game Replays, Original Shows, Emmy-Award winning series and more, available FREE!',
      airDatetime: '',
      hasCC: false,
      rating: '',
      genreTags: [],
      isTubiOriginal: false,
      poster: 'https://canvas-lb.tubitv.com/opts/GbtiOh3MDLc6Nw==/9bcffbd6-3363-44c1-a648-28edc3379383/CNIHEMAEOgUxLjEuNg==',
      shouldIgnorePcStatus: true,
      linkTo: '/live/613761/nfl-channel',
    },
    {
      id: FOX_SPORTS_CONTENT_ID,
      type: 'l',
      title: 'FOX Sports on Tubi',
      description: 'FOX Sports is the #1 live event sports brand in the industry. Watch exclusive live sports, highlights, daily studio content, and original programming here.',
      airDatetime: '',
      hasCC: false,
      rating: '',
      genreTags: [],
      isTubiOriginal: false,
      poster: 'https://canvas-lb.tubitv.com/opts/f4T0pZ_W0zXBiw==/8638df55-9aa3-485a-967a-6bb7cdbcd169/CNIHEMAEOgUxLjEuNg==',
      shouldIgnorePcStatus: true,
      linkTo: '/live/613683/fox-sports-on-tubi',
    },
  ];
};

export default useCardList;
