/**
 * Returns what location.origin would return (we can't use location.origin
 * because it's not supported in all browsers).
 *
 * @param loc Location or location-like object. defaults to `window.location`.
 * @returns the location origin
 */
export const getLocationOrigin = (loc: Pick<Location, 'protocol' | 'hostname' | 'port'> = location) =>
  `${loc.protocol}//${loc.hostname}${loc.port ? `:${loc.port}` : ''}`;
