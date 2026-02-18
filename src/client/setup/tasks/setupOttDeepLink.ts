import { initBackOverrideByDeeplink, setDeeplinkType } from 'common/actions/ottUI';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { DeeplinkType, getOTTDeeplinkType } from 'common/utils/deeplinkType';

export function setupOttDeepLink(loc: {pathname: string, search: string, query: Record<string, unknown>}, dispatch: TubiThunkDispatch) {
  const ottDeeplinkType = getOTTDeeplinkType({ query: loc.query, url: `${loc.pathname}${loc.search}`, path: loc.pathname });
  if (ottDeeplinkType !== DeeplinkType.None) {
    dispatch(setDeeplinkType(ottDeeplinkType));
    dispatch(initBackOverrideByDeeplink(ottDeeplinkType));
  }
}
