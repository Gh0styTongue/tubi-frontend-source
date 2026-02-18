import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { firstSeenSelector } from 'common/selectors/firstSeen';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { getAnalyticsPlatform } from 'common/utils/getAnalyticsPlatform';
import { TUBI_DEFAULT_DEVICE_ID } from 'common/utils/token';

type NamespaceResult = {
  namespace: string;
  /** a JSON-encoded object */
  resource: string;
  experiment_result?: {
    experiment_name: string;
    treatment: string;
    segment: string;
    holdout_info?: {
      in_holdout: boolean;
      domain: string;
    };
  };
};

export type PopperResponse = {
  namespace_results: NamespaceResult[];
};

export function fetchPopperEvaluateNamespaces(namespaces: string[]) {
  return async (dispatch: TubiThunkDispatch, getState: () => StoreState): Promise<PopperResponse> => {
    const state = getState();
    const deviceId = deviceIdSelector(state);

    if (!deviceId) {
      throw new Error('Missing Device ID');
    }

    // Do not get experiments for this fabricated id
    if (deviceId === TUBI_DEFAULT_DEVICE_ID) {
      return {
        namespace_results: [],
      };
    }

    const response = await dispatch(
      fetchWithToken<PopperResponse>(`${getConfig().popperPrefix}/popper/evaluate-namespaces`, {
        params: {
          'request_context.platform': getAnalyticsPlatform(__OTTPLATFORM__ || __WEBPLATFORM__),
          'request_context.device_id': deviceId,
          'request_context.first_seen': firstSeenSelector(state),
          namespaces,
        },
      })
    );

    return response;
  };
}
