import { ATag } from '@tubitv/web-ui';
import React from 'react';
import { useIntl } from 'react-intl';

import styles from '../Activation.scss';
import messages from '../activationMessages';
import { activateDeviceHelpCenterLink } from '../utils';

interface Props {
  children: React.ReactNode;
  header: string;
  iconComponent: React.ComponentType<any>;
  showHelpLink?: boolean;
  newDesign?: boolean;
  subheader?: string;
}

const ContentWrapper: React.FC<Props> = ({
  children,
  header,
  iconComponent: Icon,
  showHelpLink = true,
  newDesign,
  subheader,
}) => {
  const { formatMessage } = useIntl();
  return (
    <div className={styles.contentWrapper}>
      {newDesign ? (
        <Icon className={styles.icon} />
      ) : (
        <div className={styles.circle}>
          <Icon className={styles.icon} />
        </div>
      )}
      <div className={styles.main}>
        <div className={styles.headers}>
          <h1 className={styles.header}>{header}</h1>
          {subheader ? <div className={styles.subheader}>{subheader}</div> : null}
        </div>
        {children}
        {showHelpLink && (
          <div className={styles.helpContainer}>
            {newDesign ? (
              <span>
                {formatMessage(messages.needHelp2, {
                  helpCenter: (text: React.ReactNode[]) => (
                    <ATag target="_blank" to={activateDeviceHelpCenterLink} className={styles.helpCenterLink}>
                      {text}
                    </ATag>
                  ),
                })}
              </span>
            ) : (
              <>
                <span className={styles.needHelp}>
                  {formatMessage(messages.needHelp)}
                </span>
                &nbsp;
                <span>
                  <ATag target="_blank" to={activateDeviceHelpCenterLink} className={styles.helpCenterLink}>
                    {formatMessage(messages.helpCenter)}
                  </ATag>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentWrapper;
