import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const Slash: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 11 17" {...props} role="img">
    <title>Slash</title>
    <path fill="none" stroke="currentColor" d="M10 .932l-9 16" />
  </SvgIcon>
);

export default Slash;
