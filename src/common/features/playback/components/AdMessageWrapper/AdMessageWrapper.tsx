import { clamp } from '@adrise/utils/lib/tools';
import React, { useRef } from 'react';
import { connect } from 'react-redux';

import type { AdPlayerUIRefreshVariant } from 'common/constants/experiments';
import OTTFireTVEnableAdsWithNativePlayer from 'common/experiments/config/ottFireTVEnableAdsWithNativePlayer';
import AdMessage, { AD_MESSAGE_STYLE } from 'common/features/playback/components/AdMessage/AdMessage';
import AdMessageV2 from 'common/features/playback/components/AdMessageV2/AdMessageV2';
import { getMessageData, getMessageDataV2 } from 'common/features/playback/components/AdMessageWrapper/getMessageData';
import { isInAdPlayerUIRefreshVariant } from 'common/features/playback/hooks/useAdPlayerUIRefresh';
import useExperiment from 'common/hooks/useExperiment';
import type { StoreState } from 'common/types/storeState';

interface Props {
  adCount: number;
  adSequence: number;
  containerClassName?: string;
  duration: number;
  position: number;
  hideProgressBar?: boolean;
  remainingPodDuration?: number;
  hideText?: boolean;
  refreshVariant: AdPlayerUIRefreshVariant
}

/**
 * Will create an object used in AdMessage component to calculate how much each adPod
 * will take in whole adBreak. so if there are 2 ads the first ad will be 0.5 (out of 1)
 * @param  {number} adCount
 * @returns {object} e.g. calculateAdSequenceCompletionProgress(2) ~> {0:0, 1: 0.5, 2: 1}
 */
const calculateAdSequenceCompletionProgress = (adCount: number) => {
  const completionProgress: Record<number, number> = { 0: 0 };
  for (let seq = 1; seq < adCount + 1; seq++) {
    if (adCount === seq) {
      // last one all the way to 1
      completionProgress[seq] = 1;
    } else {
      const prevSequenceCompletedProgress = completionProgress[seq - 1] || 0;
      completionProgress[seq] = prevSequenceCompletedProgress + Math.floor(100 / adCount) / 100;
    }
  }
  return completionProgress;
};

const AdMessageWrapper: React.FunctionComponent<Props> = (props) => {
  const { adCount, adSequence, duration, position, hideProgressBar, remainingPodDuration, containerClassName, hideText, refreshVariant } = props;
  const adProgressStyle = __IS_SLOW_PLATFORM__ ? AD_MESSAGE_STYLE.AD_PROGRESS_OF_CURRENT_AD : AD_MESSAGE_STYLE.LEGACY;
  const showProgressBar = !__IS_SLOW_PLATFORM__ && !hideProgressBar && adProgressStyle === AD_MESSAGE_STYLE.LEGACY;
  const totalProgress = useRef<number>(0);

  const ottFireTVEnableAdsWithNativePlayer = useExperiment(OTTFireTVEnableAdsWithNativePlayer);
  if (ottFireTVEnableAdsWithNativePlayer.getValue()) {
    return null;
  }

  const getProgress = () => {
    if (!showProgressBar) {
      return 0;
    }

    const adSequenceCompletionProgress = calculateAdSequenceCompletionProgress(adCount);
    const alreadyCompleted = adSequenceCompletionProgress[adSequence - 1];
    let progressInCurrentSequence = 0;
    if (duration !== 0) {
      progressInCurrentSequence = (position / duration) * (adSequenceCompletionProgress[adSequence] - alreadyCompleted);
    }
    // rounding to get only two decimal points.
    return clamp(Math.round((progressInCurrentSequence + alreadyCompleted) * 100) / 100, 0, 1);
  };

  if (isInAdPlayerUIRefreshVariant(refreshVariant)) {
    const messageData = getMessageDataV2({
      refreshVariant,
      adSequence,
      adCount,
      duration,
      position,
      remainingPodDuration,
    });
    return <AdMessageV2 className={containerClassName} messageData={messageData} />;
  }

  // progress should only ever increment, ignore values which would decrease progress
  totalProgress.current = Math.max(totalProgress.current, getProgress());

  const messageData = hideText ? undefined : getMessageData({
    adProgressStyle,
    adSequence,
    adCount,
    duration,
    position,
    remainingPodDuration,
  });

  return <AdMessage progress={totalProgress.current} className={containerClassName} showProgressBar={showProgressBar} messageData={messageData} />;
};

export const mapStateToProps = (state: StoreState) => {
  const {
    ad: { adCount, adSequence },
    adProgress: { duration, position, remainingPodDuration },
  } = state.player;

  return {
    adCount,
    adSequence,
    duration,
    position,
    remainingPodDuration,
  };
};

export default connect(mapStateToProps)(AdMessageWrapper);
