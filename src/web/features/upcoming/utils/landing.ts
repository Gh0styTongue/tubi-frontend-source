import type { RedirectFunction as Replace, RouterState as NextState } from 'react-router';
import type { Store } from 'redux';

import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getPath } from 'web/features/seo/utils/seo';
import { UPCOMING_CONTENTS } from 'web/features/upcoming/constants/landing';

export type OnEnterHook = (store: Store<StoreState>, nextState: NextState, replace: Replace) => void;

export const upcomingOnEnterHook: OnEnterHook = (store, nextState, replace) => {
  const title = nextState.params.title;
  const content = UPCOMING_CONTENTS[title];

  if (!content) {
    return replace(WEB_ROUTES.notFound);
  }

  const isTrailerUnavailable = !__IS_ALPHA_ENV__ && __PRODUCTION__ && new Date() < new Date(content.availability_starts_for_trailer ?? 0);
  const isLocationUnavailable = content.locations && !(content.locations as (string | undefined)[]).includes(store.getState().ui.twoDigitCountryCode);

  if (isTrailerUnavailable || isLocationUnavailable) {
    return replace(WEB_ROUTES.notFound);
  }

  if (new Date() > new Date(content.availability_starts)) {
    const isSeries = content.type === SERIES_CONTENT_TYPE;
    return replace(getPath(isSeries ? WEB_ROUTES.seriesDetail : WEB_ROUTES.movieDetail, { id: content.id, title }));
  }
};

export const getContentId = (content: Pick<Video, 'id' | 'type'>) => {
  const { id, type } = content;
  return type === SERIES_CONTENT_TYPE ? convertSeriesIdToContentId(id) : id;
};
