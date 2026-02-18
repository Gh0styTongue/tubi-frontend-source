import type { ThunkAction } from 'redux-thunk';

import * as actions from 'common/constants/action-types';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import type { LegalAssetAction, LegalAssetError } from 'common/types/legalAsset';
import type { StoreState } from 'common/types/storeState';

type PrivacyThunk = ThunkAction<Promise<unknown>, StoreState, ApiClient, LegalAssetAction>;

function loadLegalAssetSuccess(legalType: string, html: string): LegalAssetAction {
  return {
    type: actions.LOAD_LEGAL_ASSET_SUCCESS,
    legalType,
    html,
  };
}

function loadLegalAssetFail(legalType: string, error: LegalAssetError): LegalAssetAction {
  return {
    type: actions.LOAD_LEGAL_ASSET_FAIL,
    legalType,
    error,
  };
}

export function loadLegalAsset(legalType: string, url: string): PrivacyThunk {
  return (dispatch, getState, client) => {
    return client.get(url).then((html: string) => {
      dispatch(loadLegalAssetSuccess(legalType, html));
    }).catch((error: LegalAssetError) => {
      logger.error({ error }, `Load legal asset fail: ${legalType}`);
      dispatch(loadLegalAssetFail(legalType, error));
    });
  };
}
