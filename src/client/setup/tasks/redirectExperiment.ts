import { getQueryStringFromUrl, parseQueryString } from '@adrise/utils/lib/queryString';

import { setRedirectExperimentOriginalDeviceId } from 'common/actions/experiments';
import { OTT_REDIRECT_ORIGINAL_DEVICE_ID } from 'common/constants/constants';
import OttStagingRedirect, {
  CUSTOM_TREATMENT_GOOGLE_DOC_CSV,
  OTT_STAGING_REDIRECT_TREATMENT,
} from 'common/experiments/config/ottStagingRedirect';
import { getExperiment } from 'common/experimentV2';
import { ottRedirect } from 'common/experimentV2/configs/ottRedirect';
import type ApiClient from 'common/helpers/ApiClient';
import type { TubiStore } from 'common/types/storeState';
import { makeFullUrl } from 'common/utils/urlManipulation';

declare global {
  interface Window {
    __tizen_redirect_original_deviceid__?: string;
  }
}

const getUrlFragmentForPlatform = () => {
  switch (__OTTPLATFORM__) {
    case 'TIZEN': return 'samsung';
    case 'FIRETV_HYB': return 'firetv-hyb';
    default: return __OTTPLATFORM__.toLowerCase();
  }
};

const findCustomUrl = (csv: string, deviceId?: string) => csv.split('\n').find(
  (csvRow: string) =>
    typeof csvRow === 'string' && deviceId && csvRow.includes(deviceId)
)?.split(',')[1];

const findRedirectUrl = async (apiClient: ApiClient, deviceId: string, treatment: OTT_STAGING_REDIRECT_TREATMENT) => {
  if (treatment === OTT_STAGING_REDIRECT_TREATMENT.custom) {
    const csv = await apiClient.get(CUSTOM_TREATMENT_GOOGLE_DOC_CSV);
    return findCustomUrl(csv, deviceId);
  }

  const platform = getUrlFragmentForPlatform();

  if (treatment === OTT_STAGING_REDIRECT_TREATMENT.alpha) {
    return `//ott-${platform}-alpha.production-public.tubi.io`;
  }

  if (treatment !== OTT_STAGING_REDIRECT_TREATMENT.control) {
    return `//ott-${platform}-${treatment}.staging-public.tubi.io`;
  }
};

/**
 * Clear existing JS and CSS elements from head
 */
export const clearExistingResources = (): void => {
  const head = document.head;
  const elementsToRemove: Element[] = [];

  // Find all script and link elements in head
  for (const element of Array.from(head.children)) {
    if (element.tagName === 'SCRIPT' || (element.tagName === 'LINK' && (element.getAttribute('rel') === 'stylesheet' || element.getAttribute('as') === 'script'))) {
      elementsToRemove.push(element);
    }
  }

  // Remove the elements
  elementsToRemove.forEach(element => element.remove());
};

/**
 * Load resources (CSS and JS) sequentially
 */
export const loadResources = (urls: string[], callback: (error?: string | Event) => void): void => {
  const len = urls.length;

  const loadResource = (index: number): void => {
    const url = urls[index];
    if (index >= len || !url) {
      return callback();
    }

    const extension = url.split('.').pop();
    const loadMethod = extension === 'css' ? loadStyle : loadScript;
    loadMethod(url, (err) => {
      if (err) {
        return callback(err);
      }
      loadResource(index + 1);
    });
  };

  loadResource(0);
};

/**
 * Load a script resource
 */
export const loadScript = (url: string, callback: (error?: string | Event) => void): void => {
  const script = document.createElement('script');
  script.src = url;
  script.async = false;
  script.onload = () => callback();
  script.onerror = callback;
  document.head.appendChild(script);
};

/**
 * Load a style resource
 */
export const loadStyle = (url: string, callback: (error?: string | Event) => void): void => {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.type = 'text/css';
  style.href = url;
  style.onload = () => callback();
  style.onerror = callback;
  document.head.appendChild(style);
};

/**
 * Handle Tizen meta request and resource loading
 */
export const handleTizenMetaRequest = async (apiClient: ApiClient, url: URL): Promise<boolean> => {
  const metaUrl = `${url.protocol}//${url.host}/oz/tizen/meta`;

  try {
    const data = await apiClient.get(metaUrl);
    // Store the state data globally
    window.__data = data.state;

    const assets = data.assets;
    const styles = Object.keys(assets.styles).map((key) => assets.styles[key]);
    const scripts = Object.keys(assets.javascript).map((key) => assets.javascript[key]);
    const resources = styles.concat(scripts).map((resource) =>
      resource.replace('localhost', url.host)
    );

    return new Promise((resolve) => {
      // Clear existing resources before loading new ones
      clearExistingResources();

      loadResources(resources, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } catch (error) {
    return false;
  }
};

/**
 * Redirect Experiment Technique
 * - Add device id to treatment
 * - Update Google Doc for custom URL
 * - For Tizen platform: load resources in current page instead of redirecting
 * https://docs.google.com/spreadsheets/d/1gn-VLDmoWhc8HKJxY445C9yAvEuUkzWM8yqwv38vL-A/edit#gid=0
 */
export const redirectExperiment = async (store: TubiStore, apiClient: ApiClient): Promise<boolean> => {
  const { deviceId } = store.getState().auth;

  if (!deviceId) {
    throw new Error('Missing Device ID for redirect experiment');
  }
  // get the original device id from the url query params
  const qs = parseQueryString(getQueryStringFromUrl(location.href));
  const originalDeviceId = qs[OTT_REDIRECT_ORIGINAL_DEVICE_ID] as string || window.__tizen_redirect_original_deviceid__;
  if (originalDeviceId) {
    store.dispatch(setRedirectExperimentOriginalDeviceId(originalDeviceId));
  }

  const treatment = OttStagingRedirect(store).isInExperiment() ? OttStagingRedirect(store).getValue() : getExperiment(ottRedirect).get('environment');

  // For other platforms, use the original redirect logic
  const url = await findRedirectUrl(apiClient, deviceId, treatment);
  if (url) {
    const fullUrl = makeFullUrl(url, undefined, { [OTT_REDIRECT_ORIGINAL_DEVICE_ID]: deviceId });
    const urlInstance = new URL(fullUrl);
    // Handle Tizen platform differently - load resources in current page
    if (__OTTPLATFORM__ === 'TIZEN') {
      if (!window.__tizen_redirect_original_deviceid__) {
        handleTizenMetaRequest(apiClient, urlInstance);
        window.__tizen_redirect_original_deviceid__ = deviceId;
        return true;
      }
      return false;
    }

    location.href = fullUrl;
  }

  return false;
};
