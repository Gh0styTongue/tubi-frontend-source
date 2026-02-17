import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const ArrowDownCircle: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 24 24" {...props} role="img">
    <title>Arrow Down Circle Icon</title>
    <path
      d="M2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12ZM17.8 9.8C18.2 10.2 18.2 10.8 17.8 11.2L13 15.9C12.3 16.6 11.6 16.6 11 15.9L6.3 11.1C5.9 10.7 5.9 10.1 6.3 9.7C6.7 9.3 7.3 9.3 7.7 9.7L11.9 13.9C12 14 12.1 14 12.2 13.9L16.4 9.7C16.7 9.4 17.4 9.4 17.8 9.8Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export default ArrowDownCircle;
