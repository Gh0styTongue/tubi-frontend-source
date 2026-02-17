/**
 * Returns true if the url (path only) matches the template string, like "/foo/:bar(/:baz)"
 * @param url The pathname of the url to test
 * @param urlTemplate A url template passed to react-router, e.g. "/containers/:type"
 */
export const matchesUrlTemplate = (url: string, urlTemplate: string): boolean => {
  const templateRegexStr = urlTemplate.replace(/\//g, '\\/')
    .replace(/\)/g, ')?')
    .replace(/:\w+/g, '[^\\/]+');
  return !!url.match(new RegExp(`^${templateRegexStr}$`));
};
