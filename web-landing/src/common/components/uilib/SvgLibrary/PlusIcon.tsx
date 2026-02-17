import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const Plus: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 26 26" {...props} role="img">
    <title>Plus Icon</title>
    <path
      fill="currentColor"
      d="M13 .2c.9 0 1.6.7 1.6 1.6v9.6h9.6a1.6 1.6 0 110 3.2h-9.6v9.6a1.6 1.6 0 11-3.2 0v-9.6H1.8a1.6 1.6 0 110-3.2h9.6V1.8c0-.9.7-1.6 1.6-1.6z"
      fillRule="evenodd"
    />
  </SvgIcon>
);

export default Plus;
