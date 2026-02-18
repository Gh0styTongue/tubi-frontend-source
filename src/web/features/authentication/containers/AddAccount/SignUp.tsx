import React from 'react';
import { useIntl } from 'react-intl';

import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import SignUpForm from 'web/features/authentication/components/CredentialsForm/SignUpForm';

import commonStyles from './common.scss';
import { useAddAccountContext } from './context';
import messages from './messages';

const SignUp = () => {
  const { formatMessage } = useIntl();
  const { isKidsFlow } = useAddAccountContext();

  return (
    <div className={commonStyles.container}>
      <header>
        <h1>{formatMessage(isKidsFlow ? messages.adultAccountSetupTitle : messages.forAdultsHeader)}</h1>
        <p>{formatMessage(isKidsFlow ? messages.forKidsDesc : messages.forAdultsDesc)}</p>
      </header>
      <main>
        <div className={commonStyles.actions}>
          <SSOButtonGroup />
        </div>
        <SignUpForm />
      </main>
    </div>
  );

};

export default SignUp;
