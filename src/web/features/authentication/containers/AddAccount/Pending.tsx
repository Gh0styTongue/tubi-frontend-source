import { TextInput } from '@tubitv/web-ui';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import { userCredentialsSelector } from 'common/features/authentication/selectors/auth';
import type { EnhancedAgeGateData } from 'common/features/authentication/types/auth';
import type { AgeGateFormikActions } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import AgeGateProvider from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import ComposedField from 'web/components/ComposedField/ComposedField';
import { completeGoogleAuth } from 'web/features/authentication/actions/auth';
import SubmitButton from 'web/features/authentication/components/SubmitButton/SubmitButton';
import authMessages from 'web/features/authentication/constants/auth-message';
import { trackRegisterEvent, ProgressType } from 'web/features/authentication/utils/track';
import AgeGateRow from 'web/features/coppa/components/AgeGateForm/AgeGateRow';

import commonStyles from './common.scss';
import { useAddAccountContext } from './context';
import messages from './messages';

const { FIRST_NAME, EMAIL } = REGISTRATION_FORM_FIELD_NAMES;

const Pending = () => {
  const intl = useIntl();
  const { formatMessage } = intl;

  const dispatch = useAppDispatch();

  const { isKidsFlow } = useAddAccountContext();

  const userCredentials = useAppSelector(userCredentialsSelector);
  /* istanbul ignore next */
  const { firstName = '', email = '' } = userCredentials || {};

  const handleSubmit = useCallback((data: EnhancedAgeGateData, _actions: AgeGateFormikActions) => {
    trackRegisterEvent({ progress: ProgressType.SUBMIT_AGE_GATE });
    return dispatch(completeGoogleAuth(data));
  }, [dispatch]);

  return (
    <div className={commonStyles.container}>
      <header>
        <h1>{intl.formatMessage(isKidsFlow ? messages.adultAccountSetupTitle : messages.forAdultsHeader)}</h1>
        <p>{intl.formatMessage(isKidsFlow ? messages.forKidsDesc : messages.forAdultsDesc)}</p>
      </header>
      <main>
        <AgeGateProvider
          formType="AGE"
          hasGenderField
          onSubmit={handleSubmit}
        >
          {(childrenProps) => {
            return (
              <form onSubmit={childrenProps.handleSubmit}>
                <ComposedField
                  component={TextInput}
                  name={FIRST_NAME}
                  label={formatMessage(authMessages.firstNameLabel)}
                  value={firstName}
                  disabled
                />
                <ComposedField
                  component={TextInput}
                  name={EMAIL}
                  type="email"
                  label={formatMessage(authMessages.emailLabel)}
                  hint={formatMessage(authMessages.emailHint)}
                  autoComplete="email"
                  value={email}
                  disabled
                />
                <AgeGateRow {...childrenProps} />
                <SubmitButton {...childrenProps} />
              </form>
            );
          }}
        </AgeGateProvider>
      </main>
    </div>
  );
};

export default Pending;

