import { parseQueryString } from '@adrise/utils/lib/queryString';
import type { Location } from 'history';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { connect } from 'react-redux';

import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { ACTIVATION_CODE_QUERY_PARAM, ACTIVATION_FLOW_QUERY_PARAM } from 'common/features/authentication/constants/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import { isAgeGateRequiredSelector } from 'common/features/coppa/selectors/coppa';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import Footer from 'web/components/Footer/Footer';
import { generateRedirectUrl } from 'web/features/authentication/components/GuestActions/GuestActions';
import { getCanonicalMeta } from 'web/features/seo/utils/seo';

import styles from './Activation.scss';
import ActivationCodeForm from './ActivationCodeForm/ActivationCodeForm';
import ActivationFlow from './ActivationFlow/ActivationFlow';
import messages from './activationMessages';
import { createRedirectToActivateLocation, formatCode } from './utils';

export enum Step { One, Two }

export interface OwnProps {
  location: Location;
}

export interface ActivationProps {
  activationCodeFromURL?: string | string[];
  autoActivate?: boolean;
  dispatch: TubiThunkDispatch;
  isMobile?: boolean;
  isSignedIn?: boolean;
  referer?: string | string[];
}

/**
 * A component that handles allowing the user to activate their OTT device by entering a previously assigned code. Has
 * two main states, one where we upsell the user to signup (or login) so they can activate their device and a screen
 * where the user can enter the activation code
 */
export const Activation: React.FC<ActivationProps> = (props) => {
  const {
    activationCodeFromURL,
    dispatch,
    isMobile,
    isSignedIn,
    referer,
  } = props;
  const { formatMessage } = useIntl();

  const getMeta = () => ({
    title: formatMessage(messages.metaTitle),
    link: [getCanonicalMeta('activate')],
    meta: [
      { name: 'keywords', content: formatMessage(messages.metaKeywords) },
      { name: 'description', content: formatMessage(messages.metaDesc) },
      { name: 'apple-itunes-app', content: '' }, // removing content to disable for this page
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' },
    ],
  });

  const [step, setStep] = useState(Step.One);
  const [code, setCode] = useState(activationCodeFromURL as string);
  const activationRedirect = createRedirectToActivateLocation(code, 'activate_first');

  const handleStepChange = (newStep: Step, newCode: string) => {
    setStep(newStep);
    setCode(newCode);
  };

  /* useActivationFlow:
    * 1a. if user is not signed in, render ActivationFlow
    * 1b. or if user is signed in but is redirected back by ActivationFlow, render ActivationFlow for next steps
    * 2. if user is signed in, render ActivationCodeForm
    */
  const useActivationFlow = !isSignedIn || (isSignedIn && referer === 'activate_first');
  const showSignInLink = useActivationFlow && step === Step.Two;
  const redirectLink = generateRedirectUrl(activationRedirect, false);
  const fromMagicLink = referer === 'magic_link';

  return (
    <div className={styles.content} data-test-id="activate-refresh">
      <Helmet {...getMeta()} />
      <TopPlaceholder
        logo
        invert
        login={showSignInLink}
        redirect={redirectLink}
      />
      <div className={styles.activationWrapper}>
        {useActivationFlow ? (
          <ActivationFlow
            {...props}
            activationRedirect={activationRedirect}
            onStepChange={handleStepChange}
            step={step}
          />
        ) : (
          <ActivationCodeForm
            dispatch={dispatch}
            prePopulatedActivationCode={activationCodeFromURL}
            showSuccessDirectly={fromMagicLink}
          />
        )}
      </div>
      {isMobile && <Footer cls={styles.footer} useRefreshStyle />}
    </div>
  );
};

interface QueryParams {
  [ACTIVATION_CODE_QUERY_PARAM]?: string;
  [ACTIVATION_FLOW_QUERY_PARAM]?: string;
}

export const mapStateToProps = (state: StoreState, ownProps: OwnProps) => {
  const {
    auth: { user, loginRedirect },
    ui: { isMobile },
    userSettings: { coppaState },
  } = state;
  const isSignedIn = !!user;

  // if user doesn't have age after login (coppaState === UserCoppaStates.REQUIRE_AGE_GATE)
  // or if user is not compliant after inputting age
  // do not auto activate with the code
  const returnedProps = {
    isSignedIn,
    isMobile,
    autoActivate: !isAgeGateRequiredSelector(state) && (coppaState !== UserCoppaStates.NOT_COMPLIANT),
  } as ActivationProps;

  if (ownProps?.location?.query || loginRedirect) {
    let queryParams = ownProps?.location?.query as QueryParams;
    /**
     * Need this bit because Activation component assumes all redirects come from url
     * But in case of Google SSO, we do not have ability to put redirect param on url
     */
    if (loginRedirect) {
      queryParams = parseQueryString(loginRedirect);
    }
    const {
      [ACTIVATION_CODE_QUERY_PARAM]: activationCodeFromURL,
      [ACTIVATION_FLOW_QUERY_PARAM]: referer,
    } = queryParams;
    if (activationCodeFromURL) {
      returnedProps.activationCodeFromURL = formatCode(activationCodeFromURL.toString());
    }
    if (referer) {
      returnedProps.referer = referer;
    }
  }
  return returnedProps;
};

const ConnectedComponent: any = connect(mapStateToProps)(Activation);
ConnectedComponent.reserveContainerContext = true;
export default ConnectedComponent;
