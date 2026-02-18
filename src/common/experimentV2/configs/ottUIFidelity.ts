import type { ExperimentDescriptor } from './types';

/**
 * The predefined 3 fidelity levels: High/Medium/Low
 * For platform & devices, the higher level means higher system specs (CPU/GPU/RAM).
 * For styles/animations, the higher level means more performance demanding.
 *
 * This will help us to degrade some animations or effects without tagging current device as a slow
 * platform (which will change how App looks/behaves dramatically).
 *
 * Compared to isSlowPlatform, it provides a little more flexibility to control how UI/UX should behave
 * on different platforms/devices.
 */
export enum FidelityLevel {
  Higher = 40,

  /**
   * devices: Fire TV 4K Stick
   * styles: css blur filter
   */
  High = 30,
  /**
   * devices: Fire TV Gen2
   */
  Medium = 20,
  /**
   * devices: Fire TV Gen1, Stick Gen1, Tizen 2.2
   */
  Low = 10,
}

type OttUIFidelityParams = {
  uiFidelity: FidelityLevel;
};

export const OttUIFidelity: ExperimentDescriptor<OttUIFidelityParams> = {
  name: 'ott_ui_fidelity',
  isDynamicConfig: true,
  defaultParams: {
    uiFidelity: FidelityLevel.High,
  },
};
