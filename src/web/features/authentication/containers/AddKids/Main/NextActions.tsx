import { Button, ATag } from '@tubitv/web-ui';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import { activateDevice } from 'common/features/authentication/actions/auth';
import Avatar from 'common/features/authentication/components/Avatar/Avatar';
import type { Kid } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { firstNameSelector, userAvatarUrlSelector } from 'common/selectors/userSettings';
import UserItem from 'web/features/authentication/components/UserItem/UserItem';

import styles from '../common.scss';
import { NEXT_ACTION } from '../constants';
import messages from '../messages';

interface NextActionsProps extends WithRouterProps {
  kids: Kid[];
  code: string;
}

const NextActions = ({ kids, code }: NextActionsProps) => {
  const { formatMessage } = useIntl();
  const firstName = useAppSelector(firstNameSelector);
  const userAvatar = useAppSelector(userAvatarUrlSelector);
  const dispatch = useAppDispatch();

  const completeSignIn = useCallback(() => {
    dispatch(activateDevice(code)).then(() => {
      tubiHistory.push({
        pathname: WEB_ROUTES.addKidsSuccess,
      });
    }).catch((error) => {
      tubiHistory.replace({
        pathname: WEB_ROUTES.addKids,
        state: {
          error,
          action: NEXT_ACTION.COMPLETE,
        },
      });
    });
  }, [dispatch, code]);

  const addNewKidAccount = useCallback(() => {
    tubiHistory.push({
      pathname: WEB_ROUTES.addKidsSetup,
      query: {
        code,
      },
    });
  }, [code]);

  return (
    <div className={styles.main}>
      <div className={styles.avatar}>
        <Avatar name={firstName} size="l" avatarUrl={userAvatar} />
      </div>
      <h1>{formatMessage(messages.almostDoneHeader, { firstName })}</h1>
      <p>{formatMessage(messages.almostDoneDesc)}</p>
      <ul className={styles.kidList}>
        {kids.map((kid) => <li key={kid.userId}><UserItem user={kid} /></li>)}
      </ul>
      <div>
        <div className={styles.button}>
          <Button
            appearance="primary"
            onClick={completeSignIn}
          >{formatMessage(messages.completeSignIn)}</Button>
        </div>
        <div className={styles.button}>
          <Button
            appearance="tertiary"
            onClick={addNewKidAccount}
          >{formatMessage(messages.addNewKidAccount)}</Button>
        </div>
      </div>
      <div className={styles.help}>{formatMessage(messages.help, {
        helpLink: ([msg]: React.ReactNode[]) => <ATag to={WEB_ROUTES.helpCenter} target="_blank">{msg}</ATag>,
      })}</div>
    </div>
  );
};

export default withRouter(NextActions);
