import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const Mail: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 21 15" {...props} role="img">
    <title>Mail</title>
    <path
      d="M18.782 1.225l-.004-.004C17.693.148 16.24 0 14.831 0H5.153C3.749 0 2.301.149 1.22 1.229.095 2.345 0 3.84 0 5.154v5.677c0 1.325.095 2.832 1.217 3.944C2.234 15.792 3.532 16 5.168 16h9.663c1.636 0 2.934-.208 3.951-1.225C19.906 13.651 20 12.15 20 10.831V5.176c0-1.322-.094-2.827-1.218-3.951zm-2.569 1.127l-5.888 5.052a.5.5 0 01-.652 0L3.778 2.352A.2.2 0 013.908 2h12.175a.2.2 0 01.13.352zm1.314 11.008c-.466.467-1.154.64-2.537.64H5.327c-1.383 0-2.071-.173-2.54-.643-.458-.454-.628-1.138-.628-2.526V4.032a.2.2 0 01.33-.152l5.884 5.042A2.495 2.495 0 0010 9.528c.578 0 1.156-.202 1.627-.606L17.829 3.6a.2.2 0 01.33.152v7.079c0 1.401-.165 2.063-.632 2.529z"
      fill="currentColor"
    />
  </SvgIcon>
);

export default Mail;
