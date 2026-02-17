export const parseAWSHeaders = (headers: Record<string, string>) => {
  const awsHeaders: Record<string, string> = {};
  Object.keys(headers).forEach((header) => {
    if (header.startsWith('x-amz')
      || header.startsWith('x-cache')
      || header.startsWith('vis')) {
      awsHeaders[header] = headers[header];
    }
  });
  return awsHeaders;
};
