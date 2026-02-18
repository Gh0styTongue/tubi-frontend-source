import type { Location } from 'history';
import type { ValueOf } from 'ts-essentials';

import { WEB_ROUTES } from 'common/constants/routes';
import { matchesRoute } from 'common/utils/urlPredicates';

type WebRoute = ValueOf<typeof WEB_ROUTES>;

interface RouteObject {
  route: WebRoute;
  condition?: (location: Location) => boolean; // return true to enable OneTap
}

export const blockedRoutes: RouteObject[] = [
  // static paths
  { route: WEB_ROUTES.terms },
  { route: WEB_ROUTES.termsEmbedded },
  { route: WEB_ROUTES.privacy },
  { route: WEB_ROUTES.privacyEmbedded },
  { route: WEB_ROUTES.yourPrivacyChoices },
  { route: WEB_ROUTES.b2bprivacy },
  { route: WEB_ROUTES.cookies },
  { route: WEB_ROUTES.guest },
  { route: WEB_ROUTES.guestPrivacyCenter },
  { route: WEB_ROUTES.notFound },

  // account related paths
  { route: WEB_ROUTES.newPassword },
  { route: WEB_ROUTES.forgotPassword },
  { route: WEB_ROUTES.enterPassword },
  { route: WEB_ROUTES.resetToken },
  { route: WEB_ROUTES.signInWithMagicLink },
  { route: WEB_ROUTES.authError },
  { route: WEB_ROUTES.addKids },
];

export const routeGroup = {
  detailRoutes: [WEB_ROUTES.movieDetail, WEB_ROUTES.tvShowDetail],
  activateRoutes: [WEB_ROUTES.activate],
  blockedRoutes: blockedRoutes.map(({ route }) => route),
};

export const hasMatchedRoutes = (routes: WebRoute[], currentPath: string) => {
  return routes.some((route) => matchesRoute(route, currentPath));
};
