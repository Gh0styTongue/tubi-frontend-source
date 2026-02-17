import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const Playstation: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 38 29" {...props} role="img">
    <title>Playstation</title>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M.722 21.098c-1.367 1.003-.866 2.74 2.132 3.575a20.297 20.297 0 0 0 9.545.76l.609-.1V22.15l-3.063 1.1c-1.13.402-2.79.485-3.708.188-.916-.295-.745-.863.385-1.263l6.386-2.262v-3.555l-8.874 3.12s-2.147.694-3.412 1.62zm34.433-2.086c-2.591-.973-5.893-1.302-8.59-1.013-2.692.297-4.612.97-4.612.97l-.38.127v3.677l6.635-2.313c1.13-.4 2.79-.485 3.707-.187.918.296.744.862-.387 1.262l-9.956 3.511v3.543l13.53-4.806s1.816-.662 2.56-1.588c.741-.925.413-2.27-2.507-3.183zM22.86 7.098v9.063c3.86 1.844 6.895-.002 6.895-4.866 0-4.989-1.777-7.204-7.017-8.986C20.675 1.625 16.842.483 14.208 0v27.056L20.4 29V6.306c0-1.061.478-1.774 1.252-1.525 1.01.278 1.208 1.255 1.208 2.317z"
    />
  </SvgIcon>
);

export default Playstation;
