import classNames from 'classnames';
import React, { useContext, useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import { setPreferredTheme } from 'common/actions/ui';
import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { ThemeContext } from 'common/features/theme/context';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';

import styles from './common.scss';

const Wrapper = ({ children, location }: PropsWithChildren & WithRouterProps) => {
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const dispatch = useAppDispatch();
  const { setTheme, resetTheme } = useContext(ThemeContext);
  const { pathname, state } = location;
  const shouldDisplayKidTheme = [pathname, state?.referer].includes(WEB_ROUTES.addKidsSetup);
  useEffect(() => {
    if (shouldDisplayKidTheme) {
      setTheme('kidsDark');
    }
    return () => {
      if (shouldDisplayKidTheme) {
        dispatch(setPreferredTheme('defaultDark'));
        resetTheme();
      }
    };
  }, [shouldDisplayKidTheme, setTheme, resetTheme, dispatch]);

  return (
    <div
      className={classNames(styles.wrapper, {
        [styles.kids]: isLoggedIn,
      })}
    >
      <TopPlaceholder logo invert fixed={false} login={false} />
      {children}
    </div>
  );
};

export default withRouter(Wrapper);
