import { ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { Location } from 'history';
import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Slash from 'common/components/uilib/SvgLibrary/Slash';
import { breadcrumbSelector } from 'common/selectors/container';
import type { StoreState } from 'common/types/storeState';

import styles from './Breadcrumbs.scss';
import type { Breadcrumb } from './types';

interface BreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
  inverted?: boolean;
  intl: IntlShape;
}

export class Breadcrumbs extends PureComponent<BreadcrumbsProps> {
  displayText(crumb: Breadcrumb['crumb']) {
    if (typeof crumb === 'string') {
      return crumb;
    }
    return this.props.intl.formatMessage(crumb);
  }

  displayBreadcrumbs(breadcrumbs: BreadcrumbsProps['breadcrumbs']) {
    return breadcrumbs.map((crumbObj) => {
      const text = this.displayText(crumbObj.crumb);
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
  }

  render() {
    const { breadcrumbs, inverted } = this.props;

    return breadcrumbs.length ? (
      <div className={classNames(styles.breadcrumbWrapper, { [styles.inverted]: inverted })}>
        {this.displayBreadcrumbs(breadcrumbs)}
      </div>
    ) : null;
  }
}

const mapStateToProps = (
  state: StoreState,
  { contentId, location }: { contentId: string; location: Location }
) => ({
  breadcrumbs: breadcrumbSelector(state, { contentId, pathname: location.pathname }),
});

export default withRouter(connect(mapStateToProps)(injectIntl(Breadcrumbs)));
