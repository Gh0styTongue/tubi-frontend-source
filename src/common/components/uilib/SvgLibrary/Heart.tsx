import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const Heart: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 10 9" {...props} role="img">
    <title>Heart</title>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M9.024 2.58C8.88 1.163 7.87 0 6.448 0c-.766 0-1.453.335-1.924.866C4.05.336 3.364 0 2.6 0 1.175 0 .165 1.162.023 2.58c-.11 1.086.132 2.537 1.197 3.91 1.106 1.424 2.946 2.318 2.946 2.318.227.115.48.103.694 0 0 0 1.86-.894 2.967-2.318C8.89 5.117 9.132 3.666 9.024 2.58"
    />
  </SvgIcon>
);

export default Heart;
