import type { LiveCDNHeaders } from './cdnHeadersDetect';

export const parseCdnHeaders = (networkDetails: XMLHttpRequest): LiveCDNHeaders => {
  try {
    const headerStr = networkDetails.getAllResponseHeaders();
    const headers: LiveCDNHeaders = {};
    const headerPairs = headerStr.trim().split('\r\n');
    const cdnHeaderNames = new Set(['x-tubi-cdn-provider', 'x-served-by', 'x-cache', 'x-amz-cf-id', 'x-amz-cf-pop'] as (keyof LiveCDNHeaders)[]);

    headerPairs.forEach(line => {
      const parts = line.split(': ');
      if (parts.length === 2) {
        const [name, value] = parts;
        const lowerName = name.toLowerCase();
        if (cdnHeaderNames.has(lowerName as keyof LiveCDNHeaders)) {
          headers[lowerName as keyof LiveCDNHeaders] = value;
        }
      }
    });
    return headers;
  } catch (error) {
    return {};
  }
};
