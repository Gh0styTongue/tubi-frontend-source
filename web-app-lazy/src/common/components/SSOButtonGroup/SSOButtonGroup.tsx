import { ProgressType } from '@tubitv/analytics/lib/registerEvent';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { connect } from 'react-redux';

import GoogleButton from 'common/components/uilib/GoogleButton/GoogleButton';
import GoogleIcon from 'common/components/uilib/SvgLibrary/GoogleIcon';
import { SSO_CHOICES } from 'common/constants/constants';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { trackRegisterEvent } from 'common/utils/analytics';

import styles from './SSOButtonGroup.scss';

export const messages = defineMessages({
  google: {
    description: 'Google sign in button text',
    defaultMessage: 'Continue with Google',
  },
});

export interface Props {
  dispatch: TubiThunkDispatch,
  buttonOnClick?: () => any;
  googleOnClick?: () => any;
  googleClass?: string;
}

const trackSSORegisterProcess = (name: string) => {
  trackRegisterEvent({
    progress: ProgressType.CLICKED_SIGNIN,
    current: name,
  });
};

export const SSOButtonGroup: React.FC<Props> = ({
  dispatch,
  buttonOnClick,
  googleOnClick,
  googleClass,
}) => {
  const googleLoginClick = useCallback(() => {
    if (buttonOnClick) {
      buttonOnClick();
    }
    trackSSORegisterProcess(SSO_CHOICES.SSO_GOOGLE);
  }, [buttonOnClick]);

  const { formatMessage } = useIntl();
  const googleClassNames = classNames(styles.googleButton, googleClass);

  return (
    <React.Fragment>
      <GoogleButton
        label={formatMessage(messages.google)}
        icon={GoogleIcon}
        className={googleClassNames}
        dispatch={dispatch}
        key="google"
        onClick={googleOnClick || googleLoginClick}
      />
      <div className={styles.marginArea} />
    </React.Fragment>
  );
};

export default connect()(SSOButtonGroup);
