import { ContentType, getContentType } from 'client/features/playback/utils/getContentType';
import { ContainerType } from 'common/types/container';
import type { ContentItem } from 'common/types/fire';
import { isContainer } from 'common/types/fire';

export const isLinear = (content: ContentItem): boolean => {
  return isContainer(content) ? content.type === ContainerType.linear : getContentType(content) === ContentType.LINEAR;
};
