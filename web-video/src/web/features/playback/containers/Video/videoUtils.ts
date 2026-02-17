import type { Location } from 'history';

import { PERSONAL_COMING_SOON_CONTAINER_ID, SERIES_CONTENT_TYPE } from 'common/constants/constants';
import type { Series } from 'common/types/series';
import type { Video } from 'common/types/video';
import { timeDiffInDays } from 'common/utils/date';

interface CheckContentAvailabilityParams {
  content?: Video | Series;
  isContentReady: boolean;
}

export const checkIfContentIsUnavailable = ({
  content,
  isContentReady,
}: CheckContentAvailabilityParams) => {
  // `isContentReady` indicates that if video is fully loaded in detail page.
  // In the response of tensor containers API, it doesn't return policy_match field.
  // Combine `isContentReady` to make sure that `policy_match` is available.
  // Be default when user navigates to detail page, `isContentUnavailable` will be false.
  const isContentAvailable = content?.type === SERIES_CONTENT_TYPE
    ? ((content as unknown as Series)?.seasons?.length ?? 0) > 0
    : content?.policy_match;
  return isContentReady && !isContentAvailable;
};

interface CheckContentComingSoonParams {
  content: Video | Series;
  location: Location
}

export const checkIfContentIsComingSoon = ({
  content,
  location,
}: CheckContentComingSoonParams) => {
  let isContentComingSoon = false;
  const { availability_starts: availabilityStarts } = content;
  const isFromComingSoonContainer = location?.state?.from === PERSONAL_COMING_SOON_CONTAINER_ID;
  if (isFromComingSoonContainer) {
    isContentComingSoon = true;
  } else if (availabilityStarts) {
    const days = timeDiffInDays(new Date(availabilityStarts), new Date());
    isContentComingSoon = days > 0 && days <= 30;
  }
  return isContentComingSoon;
};
