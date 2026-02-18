import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const CoxIcon: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 40 13" {...props} role="img">
    <title>Cox Icon</title>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M35.415 6.5l3.505 3.963a1.373 1.373 0 0 1-2.057 1.819l-3.28-3.71-3.28 3.71a1.373 1.373 0 1 1-2.057-1.819L31.75 6.5l-3.504-3.963A1.372 1.372 0 1 1 30.303.718l3.28 3.71 3.28-3.71a1.373 1.373 0 0 1 2.057 1.819L35.415 6.5zM19.134 2.745A3.76 3.76 0 0 0 15.379 6.5a3.76 3.76 0 0 0 3.755 3.755A3.76 3.76 0 0 0 22.888 6.5a3.76 3.76 0 0 0-3.754-3.755zm0 10.255a6.507 6.507 0 0 1-6.5-6.5c0-3.584 2.916-6.5 6.5-6.5s6.5 2.916 6.5 6.5-2.916 6.5-6.5 6.5zM6.5 13A6.507 6.507 0 0 1 0 6.5C0 2.916 2.916 0 6.5 0c1.165 0 2.308.312 3.305.902a1.373 1.373 0 0 1-1.397 2.363A3.76 3.76 0 0 0 2.745 6.5a3.76 3.76 0 0 0 5.663 3.235 1.373 1.373 0 1 1 1.397 2.363c-.997.59-2.14.902-3.305.902z"
    />
  </SvgIcon>
);

export default CoxIcon;
