import type { WithContext, Movie, TVEpisode } from 'schema-dts';
import type { MarkRequired } from 'ts-essentials';

import { SERIES_CONTENT_TYPE, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import type { Series } from 'common/types/series';
import type { Video, VideoRating } from 'common/types/video';
import { getUrlByVideo, androidDeepLinkVideoPlayBack } from 'common/utils/urlConstruction';
import { makeFullUrl } from 'common/utils/urlManipulation';
import { getBasicPersonObject } from 'web/features/seo/components/PersonSchema/PersonSchema';

import { toISO6801Duration } from './toISO6801Duration';

// TODO: This effectively resolves to `any`.
//  Ticket to fix it: https://app.clubhouse.io/tubi/story/165551/improve-type-safety-of-src-common-utils-movieepisodejsonld-ts
type JsonLdObj = ReturnType<typeof JSON.parse>;

/**
 * Make sure to include availability as it might not be already included if video objects in the store
 * this is how you can get JSON-LD for both Movie and TV-Episode.
 * const movie = MovieEpisodeJsonLd(video);
 * movie.getJsonLd();
 */
export default class MovieEpisodeJsonLd {
  private readonly props: MarkRequired<
    Video,
    | 'posterarts'
    | 'hero_images'
    | 'thumbnails'
    | 'backgrounds'
    | 'tags'
    | 'ratings'
    | 'actors'
    | 'directors'
    | 'landscape_images'
  > & { country?: string; seriesId?: string };

  private readonly url: string;

  private metaAttributesAndConditions: {
    updateMeta: (...arg: any[]) => any;
    condition?: boolean;
  }[];

  private readonly androidDeepLink: ReturnType<typeof androidDeepLinkVideoPlayBack>;

  private validRatings: VideoRating[] = [];

  /**
   * the following are required by us but please checkout the following link for required and recommended
   * by Google for each type
   * https://search.google.com/structured-data/testing-tool/
   * @param props
   * @param props.id
   * @param props.title
   * @param props.type
   */
  constructor(props: Video | Series) {
    /* istanbul ignore next */
    const {
      id,
      title,
      description,
      type,
      year,
      duration,
      availability_ends,
      availability_starts,
      posterarts = [],
      hero_images = [],
      thumbnails = [],
      backgrounds = [],
      tags = [],
      ratings = [],
      actors = [],
      directors = [],
      series_id: seriesId,
      landscape_images = [],
      publisher_id,
    } = props as Video;
    const { country } = props as Series;
    this.props = {
      id,
      title,
      description,
      type,
      year,
      country,
      duration,
      availability_ends,
      availability_starts,
      posterarts,
      hero_images,
      thumbnails,
      backgrounds,
      tags,
      ratings,
      actors,
      directors,
      seriesId,
      landscape_images,
      publisher_id,
    };
    this.url = getUrlByVideo({ video: props as Video, absolute: true });
    this.androidDeepLink = this.getAndroidDeepLink();

    /**
     * set of attributes that we support for Json-LD
     * They are added if the (optional) condition given is true
     * updateMeta is a function which returns a new meta object based on the meta object passed to it
     */
    this.metaAttributesAndConditions = [
      {
        updateMeta: this.getReleasedEvent,
        condition: typeof year === 'number' && !!year,
      },
      {
        updateMeta: this.getReleasedEventLocation,
        condition: !!country,
      },
      {
        updateMeta: this.getDuration,
        condition: !!(duration && parseInt(`${duration}`, 10)),
      },
      {
        updateMeta: this.getAvailability,
        condition: !!availability_ends && !!availability_starts,
      },
      {
        updateMeta: this.getGenre,
        condition: !!tags.length,
      },
      {
        updateMeta: this.getRating,
        condition: !!this.validRating(),
      },
      {
        updateMeta: this.getCast({ type: 'directors', attr: 'director' }),
        condition: !!this.validateCast('directors'),
      },
      {
        updateMeta: this.getCast({ type: 'actors', attr: 'actor' }),
        condition: !!this.validateCast('actors'),
      },
      {
        updateMeta: this.getImage,
        condition: !!(posterarts.length || hero_images.length || thumbnails.length || backgrounds.length),
      },
      {
        updateMeta: this.getPotentialAction,
      },
    ];
  }

  getPotentialAction = (meta: JsonLdObj): JsonLdObj => {
    /* istanbul ignore next */
    const { potentialAction: metaPotentialAction = {} } = meta;
    return {
      ...meta,
      potentialAction: {
        ...metaPotentialAction,
        '@type': 'WatchAction',
        'target': [
          {
            '@type': 'EntryPoint',
            'urlTemplate': this.url,
            'inLanguage': 'en',
            'actionPlatform': [
              'http://schema.org/DesktopWebPlatform',
              'http://schema.org/MobileWebPlatform',
              'http://schema.org/AndroidPlatform',
              // 'http://schema.org/IOSPlatform', // todo Sam add watchAction for iOS
            ],
          },
          {
            '@type': 'EntryPoint',
            'urlTemplate': this.androidDeepLink,
            'inLanguage': 'en',
            'actionPlatform': 'http://schema.org/AndroidPlatform',
          },
        ],
        'expectsAcceptanceOf': {
          ...metaPotentialAction.expectsAcceptanceOf,
          '@type': 'Offer',
          'name': 'Tubi',
          'seller': {
            '@type': 'Organization',
            'name': 'Tubi, Inc.',
            'sameAs': 'https://tubitv.com/',
          },
          'eligibleRegion': {
            '@type': 'Country',
            'name': 'US', // todo Sam this needs to provided by uapi
          },
        },
      },
    };
  };

  getImage = (meta: JsonLdObj): JsonLdObj => {
    const { posterarts, hero_images, thumbnails, backgrounds } = this.props;
    const image = posterarts[0] || hero_images[0] || thumbnails[0] || backgrounds[0];
    return {
      ...meta,
      image: {
        '@type': 'ImageObject',
        'url': makeFullUrl(image),
      },
    };
  };

  getCast = ({ type, attr }: { type: 'actors' | 'directors', attr: string }) =>
    (meta: JsonLdObj): JsonLdObj => {
      const casts = this.props[type];
      const castsMeta = casts.map((actor) => getBasicPersonObject(actor));
      return {
        ...meta,
        [attr]: castsMeta,
      };
    };

  validateCast = (castType: 'actors' | 'directors') => {
    const casts = this.props[castType];
    return casts && Array.isArray(casts) && casts.length > 0;
  };

  validRating = () => {
    this.validRatings = this.props.ratings.filter((rating) => rating.value !== '');
    return this.validRatings[0];
  };

  getRating = (meta: JsonLdObj) => {
    const rating = this.validRatings[0];
    return {
      ...meta,
      contentRating: rating.value,
    };
  };

  getGenre = (meta: JsonLdObj): JsonLdObj => ({
    ...meta,
    genre: this.props.tags,
  });

  getAvailability = (meta: JsonLdObj): JsonLdObj => {
    /* istanbul ignore next */
    const { potentialAction: metaPotentialAction = {} } = meta;
    const { availability_starts, availability_ends } = this.props;
    return {
      ...meta,
      potentialAction: {
        ...metaPotentialAction,
        expectsAcceptanceOf: {
          ...metaPotentialAction.expectsAcceptanceOf,
          availabilityStarts: availability_starts,
          availabilityEnds: availability_ends,
        },
      },
    };
  };

  getDuration = (meta: JsonLdObj): JsonLdObj => {
    const { duration: videoDuration } = this.props;
    const duration = toISO6801Duration(videoDuration);
    return {
      ...meta,
      duration,
    };
  };

  getReleasedEvent = (meta: JsonLdObj): JsonLdObj => {
    const releaseYear = new Date(this.props.year.toString());
    const releaseStartDate = releaseYear.toISOString();
    return {
      ...meta,
      dateCreated: releaseStartDate,
      releasedEvent: {
        ...meta.releasedEvent,
        startDate: releaseStartDate,
      },
    };
  };

  getReleasedEventLocation = (meta: JsonLdObj) => ({
    ...meta,
    releasedEvent: {
      ...meta.releasedEvent,
      '@type': 'PublicationEvent',
      'location': {
        '@type': 'Country',
        'name': this.props.country,
      },
    },
  });

  getAndroidDeepLink = () => {
    return androidDeepLinkVideoPlayBack(this.props);
  };

  /**
   * utility function that will make a callback with the meta object if the condition passed is true
   * @main {object} - a new instance of this object will be modified and return if condition is true else will return itself
   * @updateMeta {function}
   * @condition {bool}
   * @returns {object}
   * For example:
   * const main = {'@context': 'https:///schema.org'};
   * const startDate = '2014-01-09';
   * const addition = {releasedEvent: {startDate}};
   * const condition = !!startDate;
   * for example addConditionally({main, addition, condition})
   */
  addConditionally = ({
    meta,
    updateMeta,
    condition = true,
  }: {
    meta: JsonLdObj;
    updateMeta: (...arg: any[]) => any;
    condition?: boolean;
  }): Record<string, unknown> => {
    if (!condition || typeof updateMeta !== 'function') return {};
    return updateMeta(meta);
  };

  getJsonLd = () => {
    const { description, id, seriesId, title, type } = this.props;

    if (type !== VIDEO_CONTENT_TYPE && type !== SERIES_CONTENT_TYPE) {
      return null;
    }

    const meta = {
      '@context': 'https://schema.org',
      '@id': id,
      '@type': !seriesId && type === VIDEO_CONTENT_TYPE ? 'Movie' : 'TVEpisode',
      'name': title,
      'url': this.url,
      description,
    };

    return this.metaAttributesAndConditions.reduce((latestMeta, attr) => {
      const { updateMeta, condition } = attr;
      const attrObject = this.addConditionally({ meta: latestMeta, updateMeta, condition });
      return { ...latestMeta, ...attrObject };
    }, meta) as WithContext<Movie | TVEpisode>;
  };
}
