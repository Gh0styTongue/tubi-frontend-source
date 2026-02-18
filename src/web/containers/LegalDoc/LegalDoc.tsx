import classNames from 'classnames';
import React, { PureComponent } from 'react';
import type { MessageDescriptor } from 'react-intl';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { loadLegalAsset } from 'common/actions/legalAsset';
import { LegalAsset } from 'common/components/LegalAsset/LegalAsset';
import { LEGAL_TYPES, LEGAL_URL_MAP } from 'common/constants/legalAsset';
import type { LegalAssetState } from 'common/types/legalAsset';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import Footer from 'web/components/Footer/Footer';

import styles from './LegalDoc.scss';

interface Route {
  legalType: string;
  titleMessageDescriptor: MessageDescriptor;
  /* if true, invert the colors and disabled the placeholder. Used by mobile apps and OTT */
  embedded?: boolean;
}

interface Props {
  dispatch: TubiThunkDispatch;
  legalAsset: LegalAssetState;
  route: Route;
}

export class LegalDoc extends PureComponent<Props> {
  componentDidMount() {
    this.loadAsset();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.route.legalType !== prevProps.route.legalType) {
      this.loadAsset();
    }
  }

  loadAsset = () => {
    const { dispatch, legalAsset, route } = this.props;
    if (legalAsset[route.legalType].html) return;
    switch (route.legalType) {
      case LEGAL_TYPES.privacy:
      case LEGAL_TYPES.terms:
      case LEGAL_TYPES.yourPrivacyChoices:
      case LEGAL_TYPES.b2bPrivacy:
      case LEGAL_TYPES.cookies:
        dispatch(loadLegalAsset(route.legalType, LEGAL_URL_MAP[route.legalType]));
        break;
      default:
        break;
    }
  };

  render() {
    const { route: { legalType, embedded, titleMessageDescriptor }, legalAsset } = this.props;
    const cls = classNames(styles.legalPage, {
      [styles.notEmbedded]: !embedded,
      [styles.allowOverflowX]: legalType === LEGAL_TYPES.privacy,
    });
    const header = titleMessageDescriptor ? <h1 className={styles.mainTitle}><FormattedMessage {...titleMessageDescriptor} /></h1> : null;

    return (
      <div>
        <div className={cls}>
          <div className={styles.container}>
            {header}
            <LegalAsset legalType={legalType} embedded={embedded} legalAsset={legalAsset} />
          </div>
        </div>
        <Footer inverted={!embedded} />
      </div>
    );
  }
}

const connectedComponent = connect((state: StoreState) => ({
  legalAsset: state.legalAsset,
}))(LegalDoc);

export default connectedComponent;
