import { Spinner, SpinnerSize } from '@tubitv/web-ui';
import React, { useEffect } from 'react';

import { WEB_ROUTES } from 'common/constants/routes';
import { loginWithMagicLinkFromEmail } from 'common/features/authentication/api/auth';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import type { TubiContainerFC } from 'common/types/tubiFC';

import styles from './MagicLinkFromEmail.scss';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Props {}

type RouteParams = {
  uid: string;
};

const MagicLinkFromEmail: TubiContainerFC<Props, RouteParams> = ({
  params,
}) => {
  const { uid } = params;
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loginWithMagicLinkFromEmail(uid)).then(() => {
      tubiHistory.replace(WEB_ROUTES.home);
    }).catch(() => {
      tubiHistory.replace(WEB_ROUTES.signIn);
    });
  }, [dispatch, uid]);

  return <div className={styles.container}>
    <Spinner size={SpinnerSize.LG} />
  </div>;
};

export default MagicLinkFromEmail;
