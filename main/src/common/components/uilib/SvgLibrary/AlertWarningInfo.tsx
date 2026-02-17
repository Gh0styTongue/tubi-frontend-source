import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

/**
 * Color red for alert
 * Color orange for warning
 * Color blue and rotate 180 for info
 */
const AlertWarningInfo: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 286.054 286.054" {...props} role="img">
    <title>Alert Warning Info</title>
    <path
      d="M143.027 0C64.04 0 0 64.04 0 143.027c0 78.996 64.04 143.027 143.027 143.027 78.996 0 143.027-64.022 143.027-143.027C286.054 64.04 222.022 0 143.027 0zm0 259.236c-64.183 0-116.21-52.026-116.21-116.21S78.845 26.82 143.027 26.82s116.21 52.026 116.21 116.21-52.026 116.208-116.21 116.208zm.01-196.51c-10.245 0-17.996 5.346-17.996 13.98v79.202c0 8.644 7.75 13.972 17.997 13.972 9.994 0 17.995-5.55 17.995-13.972v-79.2c0-8.43-8-13.982-17.994-13.982zm0 124.997c-9.843 0-17.853 8.01-17.853 17.86 0 9.833 8.01 17.843 17.852 17.843s17.843-8.01 17.843-17.843c-.003-9.85-8.003-17.86-17.845-17.86z"
      fill="currentColor"
    />
  </SvgIcon>
);

export default AlertWarningInfo;
