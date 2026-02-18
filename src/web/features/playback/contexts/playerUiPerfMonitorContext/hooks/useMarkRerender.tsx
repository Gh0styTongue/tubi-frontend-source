import { usePlayerUiPerfMonitor } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/usePlayerUiPerfMonitor';

export const useTrackRerenders = (componentName: string) => {
  const ctx = usePlayerUiPerfMonitor();
  ctx?.markRerender(componentName);
};

export function TrackRerenders({ componentName }: { componentName: string }) {
  useTrackRerenders(componentName);
  return null;
}
