import React from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

const ThumbsUpIcon: React.FunctionComponent<SvgIconProps> = (props): React.ReactElement<SvgIconType> => (
  <SvgIcon viewBox="0 0 20 20" {...props} role="img">
    <title>Thumbs Up Icon</title>
    <path
      d="M19.396 8.025C18.645 7.124 17.525 7 16.429 7H14.19a.252.252 0 01-.237-.327c.338-1.123.359-1.603.359-3.29v-.676C14.312 1.214 13.125 0 11.666 0h-.351C10.136 0 9.089.811 8.77 1.971l-.221.8a11.338 11.338 0 01-1.991 3.975.658.658 0 01-.371.214A2.984 2.984 0 004 6H3a3 3 0 00-3 3v7a3 3 0 003 3h1c.848 0 1.611-.357 2.157-.924A3.541 3.541 0 008.544 19h6.121c1.049 0 2.148-.109 3.082-.904.971-.825 1.234-1.929 1.405-2.9l.714-4.04c.179-1.021.306-2.189-.47-3.131zM5 16c0 .551-.449 1-1 1H3c-.551 0-1-.449-1-1V9c0-.551.449-1 1-1h1c.551 0 1 .449 1 1v7zm12.896-5.19l-.713 4.039c-.169.957-.36 1.408-.732 1.724-.371.315-.838.427-1.786.427H8.5c-.827 0-1.5-.673-1.5-1.5V9c0-.067-.016-.131-.02-.197a2.648 2.648 0 001.155-.827 13.31 13.31 0 002.342-4.673l.221-.8c.081-.296.335-.503.617-.503h.351c.355 0 .646.317.646.707v.676c0 1.916 0 1.916-.597 3.72a1.46 1.46 0 00.195 1.312c.264.366.692.585 1.144.585h3.375c.824 0 1.253.092 1.428.302.178.216.189.653.039 1.508z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </SvgIcon>
);

export default ThumbsUpIcon;
