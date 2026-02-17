import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const AppleTVIconRectangle: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="-7 -3 60 30" {...props} role="img">
    <title>Apple TV Icon Rectangle</title>
    <path
      fill="currentColor"
      d="M14.99 11.71c.03 3.33 2.92 4.45 2.96 4.47-.04.08-.47 1.59-1.53 3.13-.92 1.34-1.87 2.68-3.38 2.71-1.48.03-1.95-.87-3.64-.87-1.69 0-2.22.84-3.62.9-1.43.05-2.54-1.46-3.47-2.8C.43 16.5-1.02 11.5.92 8.15A5.36 5.36 0 015.5 5.38c1.41-.03 2.77.96 3.64.96.87 0 2.5-1.18 4.22-1 .72.02 2.74.29 4.04 2.17a4.98 4.98 0 00-2.4 4.2m-2.77-8.2A4.9 4.9 0 0013.37 0a5 5 0 00-3.26 1.67 4.6 4.6 0 00-1.16 3.4c1.23.1 2.5-.63 3.27-1.55m16.56 18.13c-.95.27-1.93.4-2.92.4-2.32 0-3.48-1.32-3.48-3.95V6.5h-2V4.4h2.11V1.66L25.3.52v3.9h3.21v2.1h-3.2v10.96c0 .84.14 1.42.4 1.76.27.34.75.5 1.42.5.39 0 .93-.08 1.66-.22v2.13zm10.15.42h-3.42L29.2 4.69h3.08l3.82 11.3c.14.44.51 1.7 1.1 3.8l.57-1.88.62-1.9 3.95-11.34h3.07l-6.48 17.4z"
    />
  </SvgIcon>
);

export default AppleTVIconRectangle;
