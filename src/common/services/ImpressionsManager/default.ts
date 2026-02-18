import { ImpressionsManager } from './ImpressionsManager';

let impressionsManager: ImpressionsManager | undefined;

export function getImpressionsManager(): ImpressionsManager {
  if (impressionsManager === undefined) {
    impressionsManager = new ImpressionsManager();
  }
  return impressionsManager;
}
