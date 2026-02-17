import type { History } from 'history';

import { loadContainer } from 'common/actions/container';
import { searchBy } from 'common/actions/search';
import { SET_DEEPLINK_BACK_OVERRIDE } from 'common/constants/action-types';
import { BACK_FROM_CONTAINER_TO_HOME } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import { getContainerDetailPageStyleConstants } from 'common/constants/style-constants';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { ContainerType } from 'common/types/container';
import type { TubiStore } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { checkIfErrorShouldRedirectTo404 } from 'common/utils/errorCapture';
import { matchesRoute } from 'common/utils/urlPredicates';

export const setupComcastDeeplink = async (store: TubiStore, history: History) => {
  const { dispatch, getState } = store;
  const { pathname, search, query } = history.getCurrentLocation();

  if (!__IS_COMCAST_PLATFORM_FAMILY__) return;
  if (!query.utm_source) return;

  if (matchesRoute(OTT_ROUTES.search, pathname)) {
    const { searchKey } = query;
    /* istanbul ignore else */
    if (searchKey) {
      dispatch(searchBy({ key: searchKey as string, directKeyPressed: false }));
    }
  } else if (matchesRoute(OTT_ROUTES.containerDetail, pathname)) {
    const id = pathname.split('/')[3];
    const { VIDEO_COUNT_TO_LOAD } = getContainerDetailPageStyleConstants();
    await dispatch(loadContainer({ location: tubiHistory.getCurrentLocation(), id, expand: 0, limit: VIDEO_COUNT_TO_LOAD }))
      .then(() => {
        const {
          container: {
            containerIdMap: {
              [id]: { type },
            },
          },
        } = getState();
        if (type === ContainerType.channel) {
          tubiHistory.replace(pathname.replace(ContainerType.regular, ContainerType.channel) + search);
        }
      })
      .catch((err) => {
        /* istanbul ignore else */
        if (checkIfErrorShouldRedirectTo404(err.errType)) {
          dispatch(actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, { data: { [BACK_FROM_CONTAINER_TO_HOME]: false } }));
          tubiHistory.replace(OTT_ROUTES.home + search);
          logger.error(
            { pathname, query },
            `Error when deeplinking ${id} container detail page because the content is not found`
          );
        }
      });
  }
};
