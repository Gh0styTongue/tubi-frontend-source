import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import type { MessageDescriptor } from 'react-intl';
import type { Params } from 'react-router/lib/Router';

import { loadSupportTicketFields, loadSupportDynamicContent } from 'common/actions/support';
import * as staticComponents from 'common/components/StaticPage';
import { WEB_ROUTES } from 'common/constants/routes';
import { isSpanishLanguageSelector } from 'common/selectors/ui';
import type { FetchDataParams } from 'common/types/container';
import type { TubiContainerFC } from 'common/types/tubiFC';
import Footer from 'web/components/Footer/Footer';

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

  const StaticPageContent = staticComponents[pageName]({ params, location, embedded });
  const cls = classNames(styles.staticPage, {
    [styles.notEmbedded]: !embedded,
    [styles.allowOverflowX]: pageName === 'PrivacyPage',
  });
  const containerCls = classNames({
    [styles.container]: !noContainerCls,
    [styles.noMaxWidth]: noMaxWidth,
  });

  const header = titleMessageDescriptor ? <h1 className={styles.mainTitle}><FormattedMessage {...titleMessageDescriptor} /></h1> : null;

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
    || location.pathname === WEB_ROUTES.stubiosDMCA) {
    const results = await Promise.all([
      dispatch(loadSupportTicketFields()),
      isSpanishLanguageSelector(getState()) ? dispatch(loadSupportDynamicContent()) : Promise.resolve(),
    ]);
    return results;
  }
}
StaticPage.fetchData = fetchData;

export default StaticPage;
