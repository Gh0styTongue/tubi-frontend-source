import useAppSelector from 'common/hooks/useAppSelector';
import { useSurfaceContainers } from 'common/hooks/useSurfaces/useSurfaceContainers';
import { selectPreviewUrl } from 'common/selectors/video';
import { usePivotDetailsNavigation } from 'ott/components/PivotDetails/hooks/usePivotDetailsNavigation';

/**
 * Hook that derives the active preview video for pivot detail pages
 * using Zustand navigation state instead of Redux.
 *
 * This decouples pivot detail preview selection from Redux's debouncedGridUI state,
 * allowing the preview to react directly to Zustand navigation changes.
 *
 * @param pivotId - The pivot surface ID from the URL
 * @returns The active video, preview URL, container ID, and grid index for preview
 */
export const usePivotPreviewContent = (pivotId: string) => {
  // Get navigation state from Zustand
  const { selectedContainerIndex, containerIndexMap } = usePivotDetailsNavigation(pivotId);

  // Trigger fetch via useSurfaceContainers (we read from Redux below to include lazy-loaded data)
  useSurfaceContainers(pivotId);

  // Read pivot container data from Redux (includes both initial + lazy-loaded containers)
  const pivotContainersData = useAppSelector(state => pivotId ? state.surface[pivotId] : undefined);

  const activeContainerId = pivotContainersData?.containersList[selectedContainerIndex];

  const gridIndex = activeContainerId ? (containerIndexMap[activeContainerId] ?? 0) : 0;

  const activeContainerChildren = activeContainerId
    ? pivotContainersData?.containerChildrenIdMap[activeContainerId]
    : undefined;

  const activeVideoId = activeContainerChildren?.[gridIndex];

  // Get video from Redux (video data still lives there)
  const video = useAppSelector(state =>
    activeVideoId ? state.video.byId[activeVideoId] : undefined
  );

  const previewUrl = video ? selectPreviewUrl(video) : undefined;

  return {
    video,
    previewUrl,
    activeContainerId,
    gridIndex,
  };
};
