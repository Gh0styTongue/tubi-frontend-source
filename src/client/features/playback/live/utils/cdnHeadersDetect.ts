import type Hls from '@adrise/hls.js';
import type { LoaderCallbacks, LoaderStats, LoaderContext, LoaderResponse, LoaderConfiguration, LoaderOnSuccess, LoaderOnError, HlsConfig, PlaylistLoaderConstructor, FragmentLoaderConstructor } from '@adrise/hls.js';

import { parseCdnHeaders } from './parseNetworkDetails';

export interface LiveCDNHeaders {
  ['x-tubi-cdn-provider']?: string; // CDN provider name like aws_cloudfront, fastly, etc.
  ['x-served-by']?: string; // The server name
  ['x-cache']?: string; // The cache status e.g. HIT, MISS, etc.
  ['x-amz-cf-id']?: string; // The CloudFront service ID for debugging.
  ['x-amz-cf-pop']?: string; // The CloudFront POP location for debugging.
}

interface AttachCdnHeadersDetectParams {
  HlsCls: typeof Hls;
  hlsJsConfig: Partial<HlsConfig>;
  onCDNHeaders: (headers: LiveCDNHeaders) => void;
}

interface LoaderCallbacksWithCDN extends LoaderCallbacks<LoaderContext> {
  onCDNHeaders?: (headers: LiveCDNHeaders) => void;
}

export const attachCdnHeadersDetect = ({
  HlsCls,
  hlsJsConfig,
  onCDNHeaders,
}: AttachCdnHeadersDetectParams) => {
  // default loader is static to XHR loader
  class CustomLoader extends HlsCls.DefaultConfig.loader {
    load(
      context: LoaderContext,
      config: LoaderConfiguration,
      callbacks: LoaderCallbacksWithCDN,
    ): void {
      // Store the original callbacks
      const originalCallbacks: LoaderCallbacksWithCDN = { ...callbacks };

      // Override the success callback to capture headers
      const customCallbacks: LoaderCallbacksWithCDN = {
        ...callbacks,
        onSuccess: ((response: LoaderResponse, stats: LoaderStats, context: LoaderContext, networkDetails: XMLHttpRequest) => {
          const cdnHeaders = parseCdnHeaders(networkDetails);
          onCDNHeaders(cdnHeaders);
          // Call the original success callback with the extended response
          originalCallbacks.onSuccess?.(response, stats, context, networkDetails);
        }) as LoaderOnSuccess<LoaderContext>,
        onError: ((error: { code: number; text: string }, context: LoaderContext, networkDetails: XMLHttpRequest, stats: LoaderStats) => {
          const cdnHeaders = parseCdnHeaders(networkDetails);
          onCDNHeaders(cdnHeaders);
          originalCallbacks.onError?.(error, context, networkDetails, stats);
        }) as LoaderOnError<LoaderContext>,
      };

      // Call the parent loader with our custom callbacks
      super.load(context, config, customCallbacks);
    }
  }
  hlsJsConfig.pLoader = CustomLoader as PlaylistLoaderConstructor;
  hlsJsConfig.fLoader = CustomLoader as FragmentLoaderConstructor;
};
