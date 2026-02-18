import type { Video } from 'common/types/video';

/**
 * check whether the content data is fully loaded, i.e. from cms instead of tensor
 * @param {Object} content
 * @return {Boolean}
 */
export const isFullyLoadedContent = (content?: Video): boolean => {
  // tensor doesn't return `availability_starts` or `policy_match` field, we can use it to identify whether it's fully loaded
  return !!content && typeof content.availability_starts !== 'undefined' && typeof content.policy_match !== 'undefined';
};
