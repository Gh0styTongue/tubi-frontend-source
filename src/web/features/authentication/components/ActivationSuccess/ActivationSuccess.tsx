import { CheckmarkCircleStroke } from '@tubitv/icons';
import { Button, ATag } from '@tubitv/web-ui';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import { userKidsSelector } from 'common/selectors/userSettings';
import CircleIcon from 'web/features/authentication/components/CircleIcon/CircleIcon';
import UserItem from 'web/features/authentication/components/UserItem/UserItem';
// TODO: @xdai a lot of styles are shared in Activation/AddKids, extract styles
import styles from 'web/features/authentication/containers/AddKids/common.scss';
import { HELP_CENTER_ARTICLE } from 'web/features/authentication/containers/AddKids/constants';

import messages from './messages';

const ActivationSuccess = () => {
  const { formatMessage } = useIntl();
  const kids = useAppSelector(userKidsSelector);
  const hasKidAccounts = !!(kids?.length);
  return (
    <div className={styles.main}>
      <div className={styles.icon}>
        <CircleIcon iconComponent={CheckmarkCircleStroke} />
      </div>
      <h1>{formatMessage(messages.successTitle)}</h1>
      <p>{formatMessage(hasKidAccounts ? messages.successDescWithKids : messages.successDescWithoutKids)}</p>
      {hasKidAccounts ? (
        <ul className={styles.kidList}>
          {kids.map((kid) => <li key={kid.userId}><UserItem user={kid} /></li>)}
        </ul>
      ) : null}
      <div className={styles.button}>
        <Link to={WEB_ROUTES.home}>
          <Button
            appearance="primary"
            width="theme"
          >{formatMessage(messages.button)}</Button>
        </Link>
      </div>
      <div className={styles.help}>{formatMessage(messages.help, {
        helpLink: ([msg]: React.ReactNode[]) => <ATag to={HELP_CENTER_ARTICLE} target="_blank">{msg}</ATag>,
      })}</div>
    </div>
  );
};
export default ActivationSuccess;
