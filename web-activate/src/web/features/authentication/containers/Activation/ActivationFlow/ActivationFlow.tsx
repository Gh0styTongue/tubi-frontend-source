import type { Location } from 'history';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';

import AccountIconWeb from 'common/components/uilib/SvgLibrary/AccountIconWeb';
import GuestActions from 'web/features/authentication/components/GuestActions/GuestActions';

import messages from './activationFlowMessages';
import type { ActivationProps } from '../Activation';
import { Step } from '../Activation';
import ActivationCodeForm from '../ActivationCodeForm/ActivationCodeForm';
import ContentWrapper from '../ContentWrapper/ContentWrapper';

interface ActivationFlowProps extends ActivationProps {
  activationRedirect: Pick<Location, 'pathname' | 'search'>;
  onStepChange: (step: Step, code: string) => void;
  step: Step;
}

/* Activation Flow
  * Step1: Display <ActivationCodeForm /> for activation code input
  *        Intercept the submitting process with `onSubmit` to save the code internally in this component
  * Step2: Once the code saved, render <GuestActions />, and pass the code to it
  *        If the user logs in or registers, user will be redirected back with code
  * Step3: Display <ActivationCodeForm /> for activation code input
  *        Automatically call activateDevice with code from URL
  */
const ActivationFlow: React.FC<ActivationFlowProps> = ({
  activationCodeFromURL,
  activationRedirect,
  autoActivate,
  dispatch,
  isMobile,
  isSignedIn,
  onStepChange,
  step,
  referer,
}) => {
  const { formatMessage } = useIntl();
  const fromMagicLink = referer === 'magic_link';

  useEffect(() => {
    if (isMobile && step === Step.Two) {
      /* istanbul ignore next */
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    }
  }, [step, isMobile]);

  /* Step 3 */
  if (isSignedIn && activationCodeFromURL && autoActivate) {
    return (
      <ActivationCodeForm
        dispatch={dispatch}
        prePopulatedActivationCode={activationCodeFromURL}
        waitForAutoActivate
      />
    );
  }

  /* Step 1 */
  const handleSubmit = (activationCode: string) => {
    onStepChange(Step.Two, activationCode);
  };
  if (step === Step.One || (isSignedIn && !autoActivate)) {
    return (
      <ActivationCodeForm
        dispatch={dispatch}
        prePopulatedActivationCode={activationCodeFromURL}
        onSubmit={handleSubmit}
        showSuccessDirectly={fromMagicLink}
      />
    );
  }

  /* Step 2 */
  return (
    <ContentWrapper
      header={formatMessage(messages.registerActivate, { linebreak: () => <br /> }) as string}
      iconComponent={AccountIconWeb}
      subheader={formatMessage(messages.freeTubi)}
      showHelpLink={false}
    >
      <GuestActions
        dispatch={dispatch}
        redirect={activationRedirect}
      />
    </ContentWrapper>
  );
};

export default ActivationFlow;
