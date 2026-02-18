type RequestOptions = {
  headers?: Record<string, string>;
};

const buildQueryString = (params: Record<string, any>): string => {
  return `?${Object.entries(params)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&')}`;
};

const ajax = {
  get(url: string, params?: Record<string, any>, options: RequestOptions = {}) {
    const queryString = params ? buildQueryString(params) : '';

    return this.request('GET', url + queryString, null, options);
  },

  post(url: string, data: any, options: RequestOptions = {}) {
    return this.request('POST', url, data, options);
  },

  request(method: string, url: string, data: any = null, options: RequestOptions = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(method, url, true);

      // Set custom headers if provided
      if (options.headers) {
        Object.keys(options.headers).forEach((key) => {
          xhr.setRequestHeader(key, options.headers![key]);
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText,
          });
        }
      };

      xhr.onerror = () => {
        reject({
          status: xhr.status,
          statusText: xhr.statusText,
          response: xhr.responseText,
        });
      };

      xhr.send(data ? JSON.stringify(data) : null);
    });
  },
};

const cookies = {
  get(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  },

  set(name: string, value: string, expires?: number): void {
    let expiresStr = '';
    if (expires !== undefined) {
      const date = new Date();
      // Convert seconds to milliseconds
      date.setTime(date.getTime() + expires * 1000);
      expiresStr = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${encodeURIComponent(value)}${expiresStr}; path=/`;
  },

  remove(name: string): void {
    this.set(name, '', 0);
  },
};

const getRandomValuesCompat = (buf: Uint8Array): Uint8Array => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(buf);
  }
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random() * 256); // fallback, not cryptographically strong
  }
  return buf;

};

const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    // eslint-disable-next-line no-bitwise
    const r = getRandomValuesCompat(new Uint8Array(1))[0] & 15; // 0-15
    // eslint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3 | 0x8); // y is forced to 10xx
    return v.toString(16);
  });
};

export { ajax, cookies, buildQueryString, generateUUIDv4, getRandomValuesCompat };
