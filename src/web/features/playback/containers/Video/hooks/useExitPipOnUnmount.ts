import { useEffect, useRef } from 'react';

import { trackLeavePictureInPictureError } from 'client/features/playback/track/client-log/trackPictureInPicture';
import { isPictureInPictureEnabled, exitPictureInPicture } from 'common/utils/pictureInPicture';

interface UseExitPipParams {
  contentId: string;
}

// exit picture-in-picture when user leave player page
export const useExitPipOnUnmount = ({ contentId }: UseExitPipParams) => {

  // depending on a ref instead of contentId ensures that we do not
  // run the effect when contentId changes, but can still access the latest
  // value of the prop when the effect runs on unmount
  const latestContentIdRef = useRef(contentId);
  latestContentIdRef.current = contentId;

  useEffect(() => {
    return () => {
      if (isPictureInPictureEnabled()) {
        exitPictureInPicture().catch((error: DOMException) => {
          trackLeavePictureInPictureError(latestContentIdRef.current, error.message);
        });
      }
    };
  }, [latestContentIdRef]);
};
