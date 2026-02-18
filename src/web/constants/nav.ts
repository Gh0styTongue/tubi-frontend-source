import type { MessageDescriptor } from 'react-intl';

import type { WebPrimaryRoutes } from 'common/constants/routes';
import { WEB_ROUTES } from 'common/constants/routes';
import { topNavMessages } from 'web/components/TopNav/topNavMessages';

export const routeToNavMessages: {
  [Key in WebPrimaryRoutes]: MessageDescriptor
} = {
  [WEB_ROUTES.movies]: topNavMessages.movies,
  [WEB_ROUTES.tvShows]: topNavMessages.tvShows,
  [WEB_ROUTES.live]: topNavMessages.liveTV,
  [WEB_ROUTES.myStuff]: topNavMessages.myStuff,
};
