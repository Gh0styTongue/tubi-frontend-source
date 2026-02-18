import { ErrorType, ERROR_SOURCE } from '@adrise/player';
import { isEmptyObject } from '@adrise/utils/lib/size';
import { useEffect, useRef } from 'react';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { trackLiveError } from 'client/features/playback/track/client-log/trackLiveError';
import { PLAYBACK_LOG_SUB_TYPE } from 'common/constants/error-types';

interface RecreationEntry {
  timestamp: number;
  streamUrl: string;
  retries: number;
  changes: {
    streamUrl?: string;
    retries?: number;
  };
}

const RECREATION_THRESHOLD_MS = 1000; // 1 second threshold
const MAX_RECREATIONS_IN_THRESHOLD = 5; // Consider it frequent if more than 5 recreations in 1 second

function getChangedDependencies(
  current: { streamUrl: string; retries: number },
  previous: { streamUrl: string; retries: number } | null
): Partial<{ streamUrl: string; retries: number }> {
  if (!previous) {
    return {};
  }

  const changes: Partial<{ streamUrl: string; retries: number }> = {};

  if (current.streamUrl !== previous.streamUrl) {
    changes.streamUrl = current.streamUrl;
  }
  if (current.retries !== previous.retries) {
    changes.retries = current.retries;
  }

  return changes;
}

export function usePlayerRecreationTracker({
  streamUrl,
  id,
  retries,
  wrapper,
}: {
  streamUrl: string;
  id: string;
  retries: number;
  wrapper: LivePlayerWrapper | null;
}) {
  const recreationHistoryRef = useRef<RecreationEntry[]>([]);

  useEffect(() => {
    const now = Date.now();
    const previousEntry = recreationHistoryRef.current.length ? recreationHistoryRef.current[recreationHistoryRef.current.length - 1] : null;
    const changes = getChangedDependencies({ streamUrl, retries }, previousEntry);

    // Record this recreation attempt
    recreationHistoryRef.current.push({
      timestamp: now,
      streamUrl,
      retries,
      changes: Object.keys(changes).length ? changes : {},
    });

    // Only keep history within threshold window
    recreationHistoryRef.current = recreationHistoryRef.current.filter(
      entry => now - entry.timestamp <= RECREATION_THRESHOLD_MS
    );

    const recreationHistory = recreationHistoryRef.current.filter(entry => !isEmptyObject(entry.changes));

    // Check if recreations are frequent
    if (recreationHistory.length > MAX_RECREATIONS_IN_THRESHOLD) {

      // Extracts what changed in each recreation and joins them with ' -> '
      // Examples:
      // - If streamUrl changed, then retries: "streamUrl -> retries"
      // - If only streamUrl changed twice: "streamUrl -> streamUrl"
      // - If retries changed three times: "retries -> retries -> retries"
      // - If both streamUrl and retries changed: "streamUrl,retries -> streamUrl,retries -> streamUrl,retries"
      const changesInWindow = recreationHistory
        .map(entry => Object.keys(entry.changes).join(','))
        .join(' -> ');

      if (wrapper) {
        trackLiveError(
          {
            type: ErrorType.OTHER_ERROR,
            code: PLAYBACK_LOG_SUB_TYPE.LIVE_ERROR,
            message: `Player recreated ${recreationHistory.length} times in ${RECREATION_THRESHOLD_MS}ms. Changes: ${changesInWindow}`,
            fatal: false,
            errorSource: ERROR_SOURCE.OTHER,
          },
          {
            contentId: id,
            wrapper,
            streamUrl,
          }
        );
      }
      // Clear history after reporting
      recreationHistoryRef.current = [];
    }
  }, [streamUrl, id, retries, wrapper]);
}
