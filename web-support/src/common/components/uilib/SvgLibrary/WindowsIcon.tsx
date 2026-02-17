import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const WindowsIcon: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 22 22" {...props} role="img">
    <title>Windows Icon</title>
    <path
      d="M0.00830078 3.36149L8.79307 2.1651L8.79691 10.6387L0.0163257 10.6887L0.00830078 3.36149ZM8.78889 11.615L8.79571 20.0961L0.0151195 18.8889L0.0146271 11.5582L8.78889 11.615ZM9.85381 2.00859L21.5017 0.308594V10.531L9.85381 10.6234V2.00859ZM21.5044 11.6948L21.5017 21.8711L9.85378 20.2272L9.83746 11.6757L21.5044 11.6948Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export default WindowsIcon;
