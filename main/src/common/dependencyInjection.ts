import systemApi from 'client/systemApi';
import { setSystemApi } from 'client/systemApi/default';
import ApiClient from 'common/helpers/ApiClient';
import { setApiClient } from 'common/helpers/apiClient/default';
import { trackLogging, trackEvent } from 'common/utils/track';
import { setTrackEvent, setTrackLogging } from 'common/utils/track/default';

export function setupDependencies() {
  // dependency injection
  setApiClient(ApiClient);
  setSystemApi(systemApi);
  setTrackEvent(trackEvent);
  setTrackLogging(trackLogging);
}

