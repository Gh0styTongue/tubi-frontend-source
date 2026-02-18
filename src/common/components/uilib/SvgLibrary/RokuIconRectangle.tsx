import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const RokuIconRectangle: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="-2 -5 80 40" {...props} role="img">
    <title>Roku Icon Rectangle</title>
    <path
      fill="currentColor"
      d="M11.88 8.45c0-2.1-1.7-3.8-3.78-3.8H6.25v7.57H8.1c2.07 0 3.77-1.7 3.77-3.77m8.5 15.11h-6.86L8.07 16H6.23v7.55H.18V.87h8.67c5 0 9.08 3.4 9.08 7.58 0 2.55-1.57 4.83-3.95 6.22l6.4 8.9"
    />
    <path
      fill="currentColor"
      d="M27.2 9.81c-1.59 0-2.95 2.17-2.95 4.86 0 2.7 1.36 4.87 2.96 4.87 1.63 0 2.99-2.18 2.99-4.87s-1.36-4.86-3-4.86m9.32 4.86a9.27 9.27 0 01-9.31 9.25 9.24 9.24 0 110-18.5 9.27 9.27 0 019.31 9.25m14.2-8.87l-6.97 6.97v-7H37.7v17.78h6.05v-7.21l7.28 7.2h7.61L49.4 14.3l7.66-7.66V17.2c0 3.5 2.1 6.73 7.41 6.73a8.4 8.4 0 005.95-2.72l2.72 2.35h1.3V5.8h-6.06v11.5c-.68 1.18-1.63 1.93-3.1 1.93-1.48 0-2.17-.88-2.17-3.7V5.8H50.72z"
    />
  </SvgIcon>
);

export default RokuIconRectangle;
