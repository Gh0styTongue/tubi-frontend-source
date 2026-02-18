import React, { useEffect } from 'react';
import type { RouteComponentProps } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import { loginRedirect as setLoginRedirect } from 'common/features/authentication/actions/auth';
import { loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import { isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { getCanonicalMeta } from 'web/features/seo/utils/seo';

import SignUpWithCoppa from './components/SignUpWithCoppa';
import SignUpWithMagicLink from './components/SignUpWithMagicLink';
import SignUpWithoutCoppa from './components/SignUpWithoutCoppa';

export type SignUpProps = RouteComponentProps<any, any>;

const SignUp = (props: SignUpProps) => {
  const isCoppaEnabled = useAppSelector(isCoppaEnabledSelector);
  const loginRedirect = useAppSelector(state => loginRedirectSelector(state, { queryString: tubiHistory.getCurrentLocation().search }));
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!loginRedirect) {
      dispatch(setLoginRedirect(WEB_ROUTES.home));
    }
  }, [loginRedirect, dispatch]);

  const registrationUID = props.location.query?.registration_uid;
  const meta = { link: [getCanonicalMeta('signup')] };
  if (registrationUID) {
    return (
      <SignUpWithMagicLink {...props} meta={meta} registrationUID={registrationUID} />
    );
  }

  const SignUpComponent = isCoppaEnabled ? SignUpWithCoppa : SignUpWithoutCoppa;

  return (
    <SignUpComponent {...props} meta={meta} />
  );
};

export default SignUp;
