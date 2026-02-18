import type { AdPlayerUIRefreshVariant } from 'common/constants/experiments';
import { AD_MESSAGE_STYLE } from 'common/features/playback/components/AdMessage/AdMessage';
import { inGroupCurrentAdTime, inGroupCurrentAdTimeWithCleanMode, inGroupTotalAdTime, inGroupTotalAdTimeWithCleanMode } from 'common/features/playback/hooks/useAdPlayerUIRefresh';
import { secondsToHMS } from 'common/utils/timeFormatting';

export interface MessageData {
  messageStyle: AD_MESSAGE_STYLE;
  adSequence?: number;
  adCount?: number;
  leftTime?: string;
}

export interface MessageDataProps {
  adProgressStyle: AD_MESSAGE_STYLE;
  adSequence: number;
  adCount: number;
  duration: number;
  position: number;
  remainingPodDuration?: number;
}

interface MessageDataPropsV2 {
  refreshVariant: AdPlayerUIRefreshVariant;
  adSequence: number;
  adCount: number;
  duration: number;
  position: number;
  remainingPodDuration?: number;
}

export interface MessageDataV2 {
  refreshVariant: AdPlayerUIRefreshVariant;
  adSequence?: number;
  adCount?: number;
  leftTime?: string;
  duration?: number;
}

export function getMessageData(props: MessageDataProps): MessageData {
  const { adProgressStyle, adSequence, adCount, duration, position, remainingPodDuration } = props;
  if (adProgressStyle === AD_MESSAGE_STYLE.LEGACY) {
    return {
      messageStyle: adProgressStyle,
    };
  }
  let leftTime = '';
  if (adProgressStyle === AD_MESSAGE_STYLE.AD_PROGRESS_OF_CURRENT_AD) {
    leftTime = `${Math.max(0, Math.floor(duration - position))}`;
  } else {
    // PLAYER_VIZIO_SIMPLE_AD_PROGRESS_VALUE.AD_PROGRESS_OF_ALL_AD
    // fallback to default behavior if remainingPodDuration is not set
    // make sure samsung adapter is set this value before we graduate this experiment on those platforms
    if (typeof remainingPodDuration === 'undefined') {
      return {
        messageStyle: AD_MESSAGE_STYLE.LEGACY,
      };
    }
    const leftSeconds = Math.max(0, remainingPodDuration - position);
    if (leftSeconds === 0) {
      // secondsToHMS will return 00:00:00
      leftTime = '00:00';
    } else {
      leftTime = secondsToHMS(leftSeconds);
    }
  }
  return {
    messageStyle: adProgressStyle,
    adSequence,
    adCount,
    leftTime,
  };
}

export function getMessageDataV2(props: MessageDataPropsV2): MessageDataV2 {
  const { refreshVariant, adSequence, adCount, duration, position, remainingPodDuration } = props;
  let leftSeconds = 0;
  let prefix = '';
  if (inGroupCurrentAdTime(refreshVariant) || inGroupCurrentAdTimeWithCleanMode(refreshVariant)) {
    leftSeconds = Math.max(0, Math.floor(duration - position));
  } else if (remainingPodDuration !== undefined
    && (inGroupTotalAdTime(refreshVariant) || inGroupTotalAdTimeWithCleanMode(refreshVariant))) {
    leftSeconds = Math.max(0, remainingPodDuration - position);
  }

  if (inGroupCurrentAdTimeWithCleanMode(refreshVariant) || inGroupTotalAdTimeWithCleanMode(refreshVariant)) {
    prefix = '-';
  }

  let leftTime = '';
  if (leftSeconds === 0) {
    // secondsToHMS will return 00:00:00
    leftTime = `${prefix}0:00`;
  } else {
    leftTime = prefix + secondsToHMS(leftSeconds, true);
  }

  return {
    refreshVariant,
    adSequence,
    adCount,
    duration,
    leftTime,
  };
}
