import { ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';

import useAppSelector from 'common/hooks/useAppSelector';
import { shouldShowRatingOverlayFullHDBadgeSelector } from 'common/selectors/experiments/ottFireTVGate1080pResolutionSelectors';
import type { VideoRating } from 'common/types/video';
import { getGenreLinkUrl } from 'common/utils/genreTools';
import { generateRatingDescriptorString } from 'common/utils/ratings';
import { secondsToHoursAndMinutes } from 'common/utils/timeFormatting';
import { FullHD } from 'ott/components/OTTContentMetaComponents/OTTContentMetaComponents';

import styles from './VideoComponents.scss';
import Badge from '../uilib/Badge/Badge';

const GENRE_TAGS_TO_SHOW = 3;

interface genreType {
  genres?: string[];
  cls?: string;
  // dispatch createNavigateToPageComponent or dispatch storeSrcPath if it is link to the search page
  handleClick?: (genre: string) => void;
  isKidsModeEnabled?: boolean;
  splitSymbol?: string;
}

// duration component
export const Duration = ({ duration = 0, className }: { duration?: number; className?: string }) => {
  const intl = useIntl();
  const humanReadDuration = secondsToHoursAndMinutes(duration, intl.formatMessage);
  if (!humanReadDuration) return null;
  const durationCls = classNames(styles.duration, className);

  return <div className={durationCls}>{humanReadDuration}</div>;
};

// language component
export const Language = ({ language, cls, separator }: { language?: string; cls?: string; separator?: string }) => {
  const hostCls = classNames(styles.language, cls);

  if (language) {
    if (separator) {
      const langELe: (JSX.Element | string)[] = [];
      language.split(/\s*,\s*/).forEach((item, index) => {
        if (item) {
          if (index !== 0) langELe.push(separator);
          langELe.push(
            <div className={hostCls} key={index}>
              {item}
            </div>
          );
        }
      });
      return langELe.map((item, index) => (
        <React.Fragment key={index}>
          {item}
        </React.Fragment>
      ));
    }

    // if not specify separator, multiple languages will separated by comma as default
    return <div className={hostCls}>{language}</div>;
  }
  return null;
};

// List Genres as Badges
export const Genre = ({ genres = [], cls, handleClick, isKidsModeEnabled }: genreType) => {
  if (genres.length === 0) return null;

  const genreCls = classNames(styles.genre, cls);
  const isClickable = !!handleClick;

  return (
    <div className={genreCls}>
      {genres.slice(0, GENRE_TAGS_TO_SHOW).map((item, index) => {
        const genre = item! as string;
        const genreEle = <Badge key={index} className={styles.genreBadge} round text={genre} />;

        return isClickable ? (
          <ATag key={genre} to={getGenreLinkUrl(genre, isKidsModeEnabled)} onClick={() => handleClick!(genre)}>
            {genreEle}
          </ATag>
        ) : (
          genreEle
        );
      })}
    </div>
  );
};

// Genre as a list split by a symbol;
export const GenreList = ({ genres = [], cls, handleClick, isKidsModeEnabled, splitSymbol = ', ' }: genreType) => {
  if (genres.length === 0) return null;

  const genreCls = classNames(styles.genreList, cls);
  const isClickable = !!handleClick;

  return (
    <div className={genreCls}>
      {isClickable ? (
        genres.slice(0, GENRE_TAGS_TO_SHOW).map((genre, index) => {
          return (
            <ATag key={genre} to={getGenreLinkUrl(genre, isKidsModeEnabled)} onClick={() => handleClick!(genre)}>
              <span className={genreCls}>
                <span>{genre}</span>
                {index < Math.min(GENRE_TAGS_TO_SHOW, genres.length) - 1 ? <span>{splitSymbol}</span> : null}
              </span>
            </ATag>
          );
        })
      ) : (
        <div>{genres.slice(0, GENRE_TAGS_TO_SHOW).join(splitSymbol)}</div>
      )}
    </div>
  );
};

export const Rating = ({ rating = [], cls }: { rating?: VideoRating[]; cls?: string }) => {
  if (!rating || rating.length === 0) return null;
  return <Badge text={rating[0].value} className={cls} />;
};

export const RatingWithDescriptor = ({
  rating = [],
  cls,
  descriptorCls,
  overrideDescriptorClass,
}: {
  rating?: VideoRating[];
  cls?: string;
  descriptorCls?: string;
  overrideDescriptorClass?: string;
}) => {
  const shouldShowRatingOverlayFullHDBadge = useAppSelector(shouldShowRatingOverlayFullHDBadgeSelector);

  if (!rating || rating.length === 0) return null;

  const badgeClassName = classNames(styles.ratingBadge, cls);
  const descriptorClassName = overrideDescriptorClass || classNames(styles.descriptors, descriptorCls);
  return (
    <div className={classNames(styles.ratingWithDescriptor)}>
      <Badge text={rating[0].value} className={badgeClassName} />
      {shouldShowRatingOverlayFullHDBadge ? <FullHD /> : null}
      {rating[0].descriptors ? (
        <span className={descriptorClassName}>{generateRatingDescriptorString(rating[0].descriptors)}</span>
      ) : null}
    </div>
  );
};
