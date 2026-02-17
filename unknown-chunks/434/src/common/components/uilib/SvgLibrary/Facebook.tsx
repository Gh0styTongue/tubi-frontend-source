import classNames from 'classnames';
import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

import styles from './SvgLibrary.scss';

interface FacebookProps extends SvgIconProps {
  withColor?: boolean;
}

const Facebook: React.FunctionComponent<FacebookProps> = (props): React.ReactElement<SvgIconType> => {
  const { className, withColor = false, ...rest } = props;

  const rootClassName = classNames(styles.facebook, { [styles.withColor]: withColor }, className);

  return (
    <SvgIcon viewBox="0 0 20 20" className={rootClassName} {...rest}>
      <title>Facebook</title>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M2 0C.938 0 0 1.063 0 1.97v16.093C0 19.03 1.063 20 2 20h9v-8H8V9h3V7c-.318-2.573 1.26-3.98 4-4 .668.02 1.617.103 2 0v3h-2c-.957-.16-1.2.436-1 1v2h3l-1 3h-2v8h3.938c1.03 0 2.062-.938 2.062-1.938V1.97C20 1.03 18.937 0 17.937 0H2z"
      />
    </SvgIcon>
  );
};

export default Facebook;
