import { REGENERATE_TOKEN_CODES } from 'common/utils/token';

export const AUTH_ERROR_CODES = [...REGENERATE_TOKEN_CODES, 'Unauthorized'];
export const AUTH_ERROR_MESSAGES = [
  'Token has expired',
  'token not found',
  'Token is invalid',
  'invalid_grant',
  'Can\'t find user_id for the token.',
  'Old password is invalid',
  'Email was not found in our system.',
];

/**
 * Helper function for aggregating path in Sentry
 * @param pathname
 * @returns route
 */
export function pathToRoute(pathname: string): string {
  // group path contains tensor/contains
  // example: /tensor/containers/next -> /tensor/containers/*
  if (pathname.includes('tensor/containers/')) {
    return '/tensor/containers/*';
  }

  // group path name ends with file extension, like `.srt`
  // example:
  // /517ebc53-4d0d-4259-81e5-f0f819332c3c.srt -> *.srt
  // /some/route/movie.srt/edit -> /some/route/*.srt/edit
  const REG_SUBTITLE = /\/([a-zA-Z0-9-]+)\.([a-zA-Z0-9]+)/;
  if (pathname.match(REG_SUBTITLE)) {
    return pathname.replace(REG_SUBTITLE, '/*.$2');
  }

  // group path which contains digits
  // by replacing digits part to `:id`
  // example: /cms/content/311503/next -> /cms/content/:id/next
  return pathname.replace(/\/(\d+)/g, '/:id');
}
