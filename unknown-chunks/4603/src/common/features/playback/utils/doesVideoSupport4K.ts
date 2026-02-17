const FOUR_K_TAG_NAME = '4K_READY';

export const doesVideoSupport4K = (videoRenditions?: string[]) => videoRenditions?.includes(FOUR_K_TAG_NAME);
