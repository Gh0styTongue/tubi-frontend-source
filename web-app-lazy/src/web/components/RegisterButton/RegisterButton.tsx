import type { ButtonProps } from '@tubitv/web-ui';
import { Button } from '@tubitv/web-ui';
import type { FC, PropsWithChildren } from 'react';
import React, { useCallback } from 'react';

import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import tubiHistory from 'common/history';

interface Props extends React.PropsWithChildren<ButtonProps> {
  className?: string;
  onClick?: () => void;
}

const RegisterButton: FC<PropsWithChildren<Props>> = ({
  className,
  onClick,
  children,
  ...restProps
}) => {

  const currentLocation = useLocation();
  const currentPathEncoded = (currentLocation.pathname) + encodeURIComponent(currentLocation.search);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
    tubiHistory.push(`${WEB_ROUTES.register}?redirect=${currentPathEncoded}`);
  }, [onClick, currentPathEncoded]);

  return (
    <Button
      color="primary"
      className={className}
      onClick={handleClick}
      {...restProps}
    >
      {children}
    </Button>
  );
};
export default RegisterButton;
