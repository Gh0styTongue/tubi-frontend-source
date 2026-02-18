import classNames from 'classnames';
import type { Location } from 'history';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import type { MessageDescriptor } from 'react-intl';
import type { Params } from 'react-router/lib/Router';

import { loadSupportTicketFields, loadSupportDynamicContent } from 'common/actions/support';
import * as staticComponents from 'common/components/StaticPage';
import { WEB_ROUTES } from 'common/constants/routes';
import { countryCodeSelector, isSpanishLanguageSelector, userGeoDataSelector } from 'common/selectors/ui';
import type { FetchDataParams } from 'common/types/container';
import type { TubiContainerFC } from 'common/types/tubiFC';
import { capitalizeFirstLetter } from 'common/utils/format';
import Footer from 'web/components/Footer/Footer';
import { sierraChatEnabledSelector } from 'web/containers/HelpCenter/SierraChatClient/sierraChatSelector';
import { loadSierraChatScript } from 'web/containers/HelpCenter/SierraChatClient/SierraChatUtils';

import styles from './StaticPage.scss';

/**
 * A generic template that all static screens can utilize to render their contents
 */

interface Route {
  pageName: string;
  titleMessageDescriptor: MessageDescriptor;
  noContainerCls: boolean;
  noMaxWidth: boolean;
  embedded?: boolean;
}

type StaticPageProps = {
  titleMessageDescriptor?: MessageDescriptor;
  pageName: string;
  /* if true, invert the colors and disabled the placeholder. Used by mobile apps */
  embedded?: boolean;
  params?: Params;
  /* remove classes from container; causing styling issues with new-look pages */
  noContainerCls?: boolean;
  noMaxWidth?: boolean;
  location: Location;
  route: Route;
};

const StaticPage: TubiContainerFC<StaticPageProps> = (props) => {
  const {
    route: {
      pageName,
      titleMessageDescriptor,
      embedded = false,
      noMaxWidth,
      noContainerCls = false,
    },
    location = {},
    params,
  } = props;

  const StaticPageContent = staticComponents[pageName as keyof typeof staticComponents]({ params, location, embedded } as any);
  const cls = classNames(styles.staticPage, {
    [styles.notEmbedded]: !embedded,
    [styles.allowOverflowX]: pageName === 'PrivacyPage',
  });
  const containerCls = classNames({
    [styles.container]: !noContainerCls,
    [styles.noMaxWidth]: noMaxWidth,
  });

  // Capitalize platform if it exists in params
  const formattedParams = params?.platform
    ? { ...params, platform: capitalizeFirstLetter(params.platform) }
    : params;

  const header = titleMessageDescriptor ? <h1 className={styles.mainTitle}><FormattedMessage {...titleMessageDescriptor} values={formattedParams} /></h1> : null;

  return (
    <div>
      <div className={cls}>
        <div className={containerCls}>
          {header}
          {StaticPageContent}
        </div>
      </div>
      <Footer inverted={!embedded} />
    </div>
  );
};

export async function fetchData({ getState, dispatch, location }: FetchDataParams<Record<string, unknown>>) {
  if (location.pathname === WEB_ROUTES.support
    || location.pathname.startsWith(WEB_ROUTES.IPRDLanding)) {
    const results = await Promise.all([
      dispatch(loadSupportTicketFields()),
      isSpanishLanguageSelector(getState()) ? dispatch(loadSupportDynamicContent()) : Promise.resolve(),
    ]);
    return results;
  }
}
StaticPage.fetchData = fetchData;

StaticPage.fetchDataDeferred = ({ location, getState }) => {
  if (location.pathname === WEB_ROUTES.support) {
    const geoData = userGeoDataSelector(getState());
    const country = countryCodeSelector(getState());
    if (sierraChatEnabledSelector(getState())) {
      loadSierraChatScript({
        country,
        ...geoData,
      });
    }
  }
  return Promise.resolve();
};
export default StaticPage;
