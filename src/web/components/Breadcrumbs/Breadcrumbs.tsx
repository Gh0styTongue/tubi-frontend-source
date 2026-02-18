import { ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import Slash from 'common/components/uilib/SvgLibrary/Slash';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { breadcrumbSelector } from 'common/selectors/container';
import type { StoreState } from 'common/types/storeState';

import styles from './Breadcrumbs.scss';
import type { Breadcrumb } from './types';

interface BreadcrumbsProps {
  contentId: string;
  inverted?: boolean;
}

export const Breadcrumbs = React.memo(({ contentId, inverted }: BreadcrumbsProps) => {
  const intl = useIntl();
  const location = useLocation();

  const breadcrumbs = useSelector((state: StoreState) =>
    breadcrumbSelector(state, { contentId, pathname: location.pathname })
  );
  const displayText = (crumb: Breadcrumb['crumb']) => {
    if (typeof crumb === 'string') {
      return crumb;
    }
    return intl.formatMessage(crumb);
  };

  const displayBreadcrumbs = (breadcrumbs: Breadcrumb[]) => {
    return breadcrumbs.map((crumbObj) => {
      const text = displayText(crumbObj.crumb);
      let crumbEle;
      if (crumbObj.to) {
        crumbEle = (
          <ATag to={crumbObj.to} cls={styles.breadcrumbText}>
            {text}
          </ATag>
        );
      } else {
        crumbEle = (
          <div className={styles.breadcrumbText}>
            {text}
          </div>
        );
      }

      return (
        <div key={text} className={styles.crumbGroup}>
          <Slash className={styles.slash} />
          {crumbEle}
        </div>
      );
    });
  };

  return breadcrumbs.length ? (
    <div className={classNames(styles.breadcrumbWrapper, { [styles.inverted]: inverted })}>
      {displayBreadcrumbs(breadcrumbs)}
    </div>
  ) : null;
});

export default Breadcrumbs;
