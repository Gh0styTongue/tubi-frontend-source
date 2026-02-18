import type { Location } from 'history';

import type StoreState from 'common/types/storeState';

export abstract class ThirdPartyScript {
  protected abstract load(onload?: () => void): void;

  abstract name: string;

  /**
   * Each script's `onAppStart` will be called in tasksBeforeFetchData in `client/setup/tasks`
   * The moment our client app starts. Only store state generated during SSR are available.
   */
  onAppStart?(state?: StoreState): void;

  loadAndInit?(state: StoreState): void;
  disable?(): void;

  /**
   * Each script's `onCoppaCompliant` will be called after user's coppa state is compliant.
   * If the script has tracking behaviour which might violates COPPA,
   * you can load it here instead of in `onAppStart`.
   */
  abstract onCoppaCompliant(state?: StoreState): void;

  /**
   * Each script's `onCoppaNotCompliant` will be called once user's coppa state is incompliant.
   * If the SDK provides method to opt out tracking, you can invoke it in this method.
   */
  abstract onCoppaNotCompliant(state?: StoreState): void;

  /**
   * Each script's `onRouteChange` will be called when app's location updates.
   * If you need the SDK to do some work on specific route, you can add some match logic here.
   */
  onRouteChange?(location: Location): void;
}
