import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const WebAndDesktopIcon: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 87 40" {...props} role="img">
    <title>Web And Desktop Icon</title>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M0 39h87v1H0v-1zM10 0h67a1 1 0 0 1 1 1v35a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1zm3 4v29h61V4H13zm1 4h59v24H14V8zm1-1a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm42.565 21.318l4.95-4.95-4.82.13-.13 4.82zm2.2-2.2l2.346 2.346.55-.55-2.345-2.346-.55.55z"
    />
  </SvgIcon>
);

export default WebAndDesktopIcon;
