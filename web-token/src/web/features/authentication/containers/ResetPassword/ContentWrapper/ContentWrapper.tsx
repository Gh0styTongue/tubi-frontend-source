import React from 'react';

import styles from '../ResetPassword.scss';

interface Props {
  children: React.ReactNode;
  header: string;
  iconComponent: React.ComponentType<any>;
  subheader?: string;
}

const ContentWrapper: React.FC<Props> = ({ children, header, iconComponent: Icon, subheader }) => {
  return (
    <div className={styles.resetPasswordWrapper}>
      <div className={styles.circle}>
        <Icon className={styles.icon} />
      </div>
      <div className={styles.main}>
        <div className={styles.headers}>
          <h1 className={styles.header}>{header}</h1>
          {subheader ? <div className={styles.subheader}>{subheader}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
};

export default ContentWrapper;
