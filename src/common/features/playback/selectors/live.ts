import type StoreState from 'common/types/storeState';

export const liveVideoPlayerSelector = (state: StoreState) => state.live.videoPlayer;

export const isLeftNavExpandedSelector = ({ ottUI }: StoreState) => !!ottUI?.leftNav?.isExpanded;
export const isEPGTopNavActiveSelector = ({ ottUI }: StoreState) => !!ottUI?.epg?.topNav?.isActive;
export const focusedContentIdSelector = ({ ottUI }: StoreState) => ottUI?.epg?.focusedContentId;
export const focusedProgramIndexSelector = ({ ottUI }: StoreState) => ottUI?.epg?.focusedProgramIndex;
