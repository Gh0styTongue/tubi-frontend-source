import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const WarningIcon: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 20 18" {...props} role="img">
    <title>Warning Icon</title>
    <path
      d="M19.545 13.017L12.908 1.678A3.377 3.377 0 0010.004 0a3.34 3.34 0 00-2.912 1.677L.458 13.021A3.242 3.242 0 000 14.67C0 16.6 1.42 18 3.376 18h13.248C18.58 18 20 16.6 20 14.67c0-.578-.158-1.151-.455-1.653zM16.624 16H3.376C2.361 16 2 15.312 2 14.67c0-.218.06-.43.182-.635L8.82 2.685a1.36 1.36 0 012.36.002l6.641 11.344c.117.198.179.419.179.639 0 .642-.361 1.33-1.376 1.33z"
      fill="currentColor"
    />
    <path
      d="M10 5c-.811 0-1.451.688-1.393 1.496l.322 4.506a1.074 1.074 0 002.142.001l.322-4.506A1.397 1.397 0 0010 5zM10 15a1 1 0 100-2 1 1 0 000 2z"
      fill="currentColor"
    />
  </SvgIcon>
);

export default WarningIcon;
