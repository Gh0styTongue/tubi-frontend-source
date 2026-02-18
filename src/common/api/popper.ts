import getConfig from 'common/apiConfig';
import type ApiClient from 'common/helpers/ApiClient';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { firstSeenSelector } from 'common/selectors/firstSeen';
import type { TubiStore } from 'common/types/storeState';
import { getAnalyticsPlatform } from 'common/utils/getAnalyticsPlatform';

export type NamespaceResult = {
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

export const fetchPopperEvaluateNamespaces = async (store: TubiStore, client: ApiClient, namespaces: string[]): Promise<PopperResponse> => {
  const state = store.getState();
  const deviceId = deviceIdSelector(state);

  if (!deviceId) {
    throw new Error('Missing Device ID');
  }

  const json: PopperResponse = await client.get(`${getConfig().popperPrefix}/popper/evaluate-namespaces`, {
    params: {
      'request_context.platform': getAnalyticsPlatform(__OTTPLATFORM__ || __WEBPLATFORM__),
      'request_context.device_id': deviceId,
      'request_context.first_seen': firstSeenSelector(state),
      namespaces,
    },
  });

  return json;
};
