import { CheckmarkCircleStroke } from '@tubitv/icons';
import { Button, ATag, useBreakpoint } from '@tubitv/web-ui';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import { WEB_ROUTES } from 'common/constants/routes';
import Avatar from 'common/features/authentication/components/Avatar/Avatar';
import type { Kid } from 'common/features/authentication/types/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { firstNameSelector } from 'common/selectors/userSettings';
import CircleIcon from 'web/features/authentication/components/CircleIcon/CircleIcon';

import styles from './Success.scss';
import messages from './successMessages';
import { activateDeviceHelpCenterLink } from '../utils';

interface Props {
  kids: Kid[];
}

const SuccessWithKids: React.FC<Props> = ({ kids }) => {
  const { formatMessage } = useIntl();
  const firstName = useAppSelector(firstNameSelector);
  const browserWidthBreakpoints = useBreakpoint();
  const maxKidsPerRow = browserWidthBreakpoints.md ? 4 : 2;
  const useGrid = kids.length > maxKidsPerRow;

  return (
    <div className={styles.content}>
      <div className={styles.contentWrapper}>
        <div className={styles.icon}>
          <CircleIcon iconComponent={CheckmarkCircleStroke} />
        </div>
        <div className={styles.main}>
          <div className={styles.headers}>
            <h1 className={styles.header}>{formatMessage(messages.newTitle, { firstName })}</h1>
            <h2 className={styles.newSubheader}>{formatMessage(messages.newSubtitle)}</h2>
          </div>
          <div className={useGrid ? styles.kidsGrid : styles.kids}>
            {kids.map(kid => (
              <div key={kid.name} className={styles.kid}>
                <Avatar name={kid.name} size="m" avatarUrl={kid.avatarUrl} />
                <div className={styles.name}>{kid.name}</div>
                <Tubi className={styles.kidsLogo} isKidsModeEnabled />
              </div>
            ))}
          </div>
          <div className={styles.descSubheader}>{formatMessage(messages.desc)}</div>
          <div className={styles.button}>
            <Link to={WEB_ROUTES.home}>
              <Button appearance="primary" size="small" width="fill">
                {formatMessage(messages.button)}
              </Button>
            </Link>
          </div>
          <span className={styles.helpContainer}>
            {formatMessage(messages.needHelp)}
            <ATag target="_blank" to={activateDeviceHelpCenterLink}>
              {formatMessage(messages.helpCenter)}
            </ATag>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SuccessWithKids;
