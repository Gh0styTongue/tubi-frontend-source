import type { ExperimentDescriptor } from './types';

export const webottWebMobileDedicatedSearch: ExperimentDescriptor<{
  search_page_enabled: boolean;
}> = {
  name: 'webott_web_mobile_dedicated_search_v1',
  defaultParams: {
    search_page_enabled: false,
  },
};
