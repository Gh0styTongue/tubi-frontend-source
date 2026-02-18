import { useState } from 'react';

import { maybeOverrideCuePoints } from 'client/features/playback/utils/maybeOverrideCuePoints';
import useAppSelector from 'common/hooks/useAppSelector';
import { adBreaksByContentIdSelector, videoByContentIdSelector } from 'common/selectors/video';
import { isFullyLoadedContent } from 'web/features/playback/containers/Video/utils/isFullyLoadedContent';
import { checkIfContentIsUnavailable } from 'web/features/playback/containers/Video/videoUtils';

interface CheckContentAvailabilityParams {
  contentId: string;
}

/**
 * Content data is ready to play when it's fully loaded, the ad breaks are
 * loaded or have failed to load, and we have a policy match
 *
 * `isContentUnavailable` is intended to drive a UI experience in which the user
 * is informed that the content is not available.
 */
export const useCheckContentAvailability = ({ contentId }: CheckContentAvailabilityParams) => {
  const adBreaks = useAppSelector((state) => maybeOverrideCuePoints(adBreaksByContentIdSelector(state, contentId)));

  // Later on in the lifecycle of the player page, we may find that some content
  // lacks a compatible video resource. Setting state here allows us to show
  // the `isContentUnavailable` UI in these cases.
  const [noVideoResourceFound, _setNoVideoResourceFound] = useState<boolean>(false);

  // Is the content loaded from the content endpoint (true), or is the content we
  // have at this point merely some incomplete content metadata we got from
  // tensor during a homepage load (false)? This matters because certain properties
  // we need to check to make various decisions are only present once we get
  // content from the content endpoint-- critically, whether the content is
  // in its policy window
  const video = useAppSelector((state) => videoByContentIdSelector(state, contentId));
  const isContentLoaded = isFullyLoadedContent(video);

  // This value is useful because we need to block starting playback until we
  // know whether we have a preroll ad to play. It would be a bad experience to
  // start playback and then interrupt it with preroll in cases where rainmaker
  // is slow to respond.
  const areAdsLoaded = typeof adBreaks !== 'undefined' && adBreaks.length !== 0;

  const isContentUnavailable = noVideoResourceFound || checkIfContentIsUnavailable({
    // we don't need to know anything about ads to figure out if the content
    // is in policy-- we only need the content to be loaded
    isContentReady: isContentLoaded,
    content: video,
  });

  // remind me gets shown if the content is out of policy, but not in the case
  // where there isn't a playable video resource
  const showRemindMe = isContentUnavailable && !noVideoResourceFound;

  return {
    isContentReady: isContentLoaded && areAdsLoaded,
    isContentUnavailable,
    setNoVideoResourceFound: () => _setNoVideoResourceFound(true),
    showRemindMe,
  };
};
