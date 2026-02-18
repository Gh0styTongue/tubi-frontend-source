import type { ButtonProps } from '@tubitv/web-ui';
import { Button } from '@tubitv/web-ui';
import type { FC, PropsWithChildren } from 'react';
import React, { useCallback } from 'react';

import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';

interface Props extends React.PropsWithChildren<ButtonProps> {
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

const RegisterButton: FC<PropsWithChildren<Props>> = ({
  className,
  onClick,
  children,
  ...restProps
}) => {

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (onClick) {
      onClick(event);
    }

    const currentPathEncoded = typeof window !== 'undefined'
      ? window.location.pathname + encodeURIComponent(window.location.search)
      : '';
    tubiHistory.push(`${WEB_ROUTES.register}?redirect=${currentPathEncoded}`);
  }, [onClick]);

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
