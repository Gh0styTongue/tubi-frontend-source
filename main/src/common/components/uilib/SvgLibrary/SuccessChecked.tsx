import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

/**
 * Color red for alert
 * Color orange for warning
 * Color blue and rotate 180 for info
 */
const SuccessChecked: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 426.667 426.667" {...props} role="img">
    <title>Success Checked</title>
    <path
      d="M213.333 0C95.518 0 0 95.514 0 213.333s95.518 213.333 213.333 213.333c117.828 0 213.333-95.514 213.333-213.333S331.156 0 213.333 0zM174.2 322.918l-93.936-93.93 31.31-31.31L174.2 260.3l140.89-140.898 31.31 31.31-172.204 172.206z"
      fill="currentColor"
    />
  </SvgIcon>
);

export default SuccessChecked;
