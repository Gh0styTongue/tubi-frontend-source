import { FullscreenExit, FullscreenEnter } from '@tubitv/icons';
import React, { memo } from 'react';

import type { SvgIconType, SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';

interface Props extends SvgIconProps {
  isFullscreen?: boolean;
}

const Fullscreen: React.FunctionComponent<Props> = ({ isFullscreen, ...otherProps }): React.ReactElement<SvgIconType> => {
  return isFullscreen ? <FullscreenExit {...otherProps} /> : <FullscreenEnter {...otherProps} />;
};

export default memo(Fullscreen);
