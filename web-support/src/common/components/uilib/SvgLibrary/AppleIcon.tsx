import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const AppleIcon: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 32 39" {...props} role="img">
    <title>Apple Icon</title>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M23.54 0c.256 2.306-.71 4.61-2.102 6.278-1.393 1.64-3.723 2.944-5.967 2.777-.312-2.25.825-4.61 2.132-6.083C19.08 1.306 21.522.082 23.54 0zm-7.387 11.762c1.438 0 4.05-1.785 6.854-1.785.203 0 .407.01.61.03 1.268.053 4.85.513 7.135 3.782-.192.107-4.27 2.43-4.242 7.267.056 5.782 5.18 7.728 5.234 7.755-.055.135-.826 2.756-2.7 5.43-1.625 2.324-3.305 4.648-5.977 4.702-2.617.054-3.443-1.513-6.446-1.513-2.974 0-3.91 1.46-6.39 1.568-2.534.08-4.49-2.54-6.143-4.863C1.88 30.985.01 26.115 0 21.49v-.074c.005-2.33.485-4.597 1.635-6.546 1.708-2.918 4.766-4.756 8.072-4.783 2.507-.054 4.903 1.675 6.446 1.675z"
    />
  </SvgIcon>
);

export default AppleIcon;
