import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const AvatarIcon: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 18 20" {...props} role="img">
    <title>Avatar Icon</title>
    <path
      d="M9 2c1.379 0 2.5 1.122 2.5 2.5S10.379 7 9 7a2.503 2.503 0 01-2.5-2.5C6.5 3.122 7.622 2 9 2zm0-2a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM9 12.841c3.504 0 6.439 2.462 7.179 5.746a.908.908 0 00.891.697.925.925 0 00.907-1.12C17.046 14.067 13.375 11 9 11S.954 14.067.023 18.164a.926.926 0 00.907 1.12.908.908 0 00.891-.697c.74-3.284 3.675-5.746 7.18-5.746z"
      fill="currentColor"
    />
  </SvgIcon>
);

export default AvatarIcon;
