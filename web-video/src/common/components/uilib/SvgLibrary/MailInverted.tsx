import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const MailInverted: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 21 15" {...props} role="img">
    <title>Mail Inverted</title>
    <path
      d="M18.782 1.226l-.003-.003C17.695.148 16.241 0 14.831 0H5.154C3.75 0 2.301.149 1.221 1.229.094 2.345 0 3.84 0 5.153v5.678c0 1.325.094 2.832 1.217 3.943C2.348 15.905 3.85 16 5.169 16h9.662c1.319 0 2.821-.095 3.951-1.226C19.906 13.651 20 12.15 20 10.831V5.177c0-1.323-.094-2.828-1.218-3.951zM17.65 3.759l-6.023 5.163A2.493 2.493 0 0110 9.528a2.495 2.495 0 01-1.627-.606L2.35 3.759a.999.999 0 111.3-1.518l6.023 5.163a.5.5 0 00.652 0l6.023-5.163a1 1 0 011.302 1.518z"
      fill="currentColor"
    />
  </SvgIcon>
);

export default MailInverted;
