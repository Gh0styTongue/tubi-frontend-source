import type { StyleProps } from '@tubitv/ott-ui';
import { Button as WebUIButton } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { CSSProperties } from 'react';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import Button from 'web/components/Button/Button';

import styles from './NoPassword.scss';

export const messages = defineMessages({
  noPassword: {
    description: 'When user doesn\'t have a password yet because they signed-in via single sign-on',
    defaultMessage: 'It appears that you have created this account using single sign-on. You’ll have to set a new password first.',
  },
  setNewPassword: {
    description: 'Button for user to set a new password',
    defaultMessage: 'Set New Password',
  },
});

interface Props extends StyleProps {
  textStyle?: React.CSSProperties;
  textClassName?: string;
  buttonAlign?: CSSProperties['textAlign'];
  useRefreshStyle?: boolean;
}

const NoPassword: React.FC<Props> = ({
  className,
  style,
  textClassName,
  textStyle,
  buttonAlign = 'left',
  useRefreshStyle = false,
}) => {
  const handleSetNewPassword = () => {
    tubiHistory.push(WEB_ROUTES.newPassword);
  };
  const buttonWrapperStyle = { textAlign: buttonAlign };
  const buttonContent = <FormattedMessage {...messages.setNewPassword} />;

  return (
    <div className={className} style={style}>
      <div className={classnames(styles.text, textClassName)} style={textStyle}>
        <FormattedMessage {...messages.noPassword} />
      </div>
      {useRefreshStyle ? (
        <WebUIButton
          type="button"
          appearance="primary"
          className={styles.button}
          onClick={handleSetNewPassword}
        >
          {buttonContent}
        </WebUIButton>
      ) : (
        <div style={buttonWrapperStyle}>
          <Button size="large" type="button" onClick={handleSetNewPassword}>
            {buttonContent}
          </Button>
        </div>
      )}
    </div>
  );
};

export default NoPassword;
