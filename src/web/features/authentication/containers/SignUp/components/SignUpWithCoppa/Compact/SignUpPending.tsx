import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';

import type { EnhancedAgeGateData } from 'common/features/authentication/types/auth';
import type { AgeGateFormikActions } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import AgeGateProvider from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { firstNameSelector } from 'common/selectors/userSettings';
import authMessages from 'web/features/authentication/constants/auth-message';
import { trackRegisterProcess } from 'web/features/authentication/utils/track';
import AgeGateFields from 'web/features/coppa/components/AgeGateForm/AgeGateFields';
import messages from 'web/features/coppa/components/AgeGateForm/ageGateFormMessages';

import { fulfillUserInfo } from '../utils';

type Props = {
  setSubmitting: (status: boolean) => void;
}

const SignUpPending = ({ setSubmitting }: Props) => {
  const intl = useIntl();
  const { formatMessage } = intl;

  const username = useAppSelector(firstNameSelector);

  const dispatch = useAppDispatch();
  const handleSubmit = useCallback(/* istanbul ignore next */(data: EnhancedAgeGateData, actions: AgeGateFormikActions) => {
    setSubmitting(true);
    dispatch(fulfillUserInfo(data, actions)).catch(() => setSubmitting(false));
  }, [dispatch, setSubmitting]);

  return (
    <>
      <header>
        <img src="https://mcdn.tubitv.com/tubitv-assets/img/account/illustration/TVHeadSurfing.svg" width="228" height="160" />
        <h1>{formatMessage(messages.headerForNewUser, { username })}</h1>
        <p>{formatMessage(authMessages.free)}</p>
      </header>
      <main>
        <AgeGateProvider
          formType="AGE"
          hasGenderField
          onSubmit={handleSubmit}
        >
          {(childrenProps) => (
            <AgeGateFields
              {...childrenProps}
              intl={intl}
              formType="AGE"
              hasGenderField
              showGenderTip={false}
              submitLabel={formatMessage(authMessages.submit)}
              trackRegisterProcess={trackRegisterProcess}
            />
          )}
        </AgeGateProvider>
      </main>
    </>
  );
};

export default SignUpPending;
