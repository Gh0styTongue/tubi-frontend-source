import { Live24, LiveFilled24 } from '@tubitv/icons';
import React, { memo, useCallback, useState } from 'react';

import type {
  SvgIconType,
  SvgIconProps,
} from 'common/components/uilib/SvgIcon/SvgIcon';
import useInterval from 'common/hooks/useInterval';

type Step = 0 | 1 ;

const paths: Map<Step, React.MemoExoticComponent<(props: React.SVGProps<SVGSVGElement>) => JSX.Element>> = new Map([
  [0, Live24],
  [1, LiveFilled24],

]);

interface Props extends SvgIconProps {
  transitionTime?: number;
}

const LiveStreaming: React.FunctionComponent<Props> = (
  props
): React.ReactElement<SvgIconType> => {
  const { transitionTime = 500, ...restProps } = props;
  const [step, setStep] = useState<Step>(0);
  const len = paths.size;
  const LiveStreamingIcon = paths.get(step) || Live24;

  const advanceStep = useCallback(() => setStep(step => ((step + 1) % len) as Step), [len]);
  useInterval(advanceStep, transitionTime);

  return (
    <LiveStreamingIcon {...restProps} />
  );
};

export default memo(LiveStreaming);
