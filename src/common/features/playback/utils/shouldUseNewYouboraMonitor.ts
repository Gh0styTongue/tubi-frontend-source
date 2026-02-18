/**
 * Determines whether to use the new Youbora monitor (npaw-plugin-es5) or the legacy one (youboralib).
 *
 * The new version uses npaw-plugin-es5 with a class-based adapter pattern,
 * while the legacy version uses youboralib with youbora.Adapter.extend().
 *
 * @returns {boolean} true if the new Youbora monitor should be used, false otherwise
 */
export function shouldUseNewYouboraMonitor(): boolean {
  // For the first version, only use the new Youbora monitor on Xbox One
  return __OTTPLATFORM__ === 'XBOXONE';
}

/**
 * Dynamically imports the appropriate setupYoubora function based on platform.
 * This ensures only one version of the Youbora monitoring chunk is loaded at runtime.
 */
export async function getSetupYoubora() {
  if (shouldUseNewYouboraMonitor()) {
    const { setupYoubora } = await import(
      /* webpackChunkName: "youbora-setup-v7" */ 'client/features/playback/monitor/setupYoubora'
    );
    return setupYoubora;
  }
  const { setupYoubora } = await import(
    /* webpackChunkName: "youbora-setup-legacy" */ 'client/features/playback/monitoringLegacy/setupYoubora'
  );
  return setupYoubora;
}

