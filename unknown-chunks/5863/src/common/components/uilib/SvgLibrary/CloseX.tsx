import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const CloseX: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 13 13" {...props} role="img">
    <title>Close X</title>
    <path
      fill="#fff"
      d="M11.1 1.9a6.5 6.5 0 1 0 0 9.19 6.5 6.5 0 0 0 0-9.19zM10 9.33l-.67.67L6.5 7.21 3.67 10 3 9.33 5.79 6.5 3 3.67 3.67 3 6.5 5.79 9.33 3l.71.71L7.21 6.5z"
    />
  </SvgIcon>
);

export default CloseX;
