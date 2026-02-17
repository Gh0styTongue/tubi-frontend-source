/** video event */
export const START_VIDEO = 'start_video';
export const START_LIVE_VIDEO = 'start_live_video';
export const PLAY_PROGRESS = 'play_progress';
export const LIVE_PLAY_PROGRESS = 'live_play_progress';
export const RESUME_AFTER_BREAK = 'resume_after_break';
export const SUBTITLES_TOGGLE = 'subtitles_toggle';
export const AUDIO_SELECTION = 'audio_selection';
export const QUALITY_TOGGLE = 'quality_toggle';
export const FULLSCREEN_TOGGLE = 'fullscreen_toggle';
export const PAUSE_TOGGLE = 'pause_toggle';
export const SEEK = 'seek';

export const APP_ACTIVE = 'active';
export const APP_INACTIVE = 'inactive';
export const APP_EXIT = 'exit';
export const SEARCH = 'search';
export const PAGE_LOAD = 'page_load';
export const VIDEO_DETAILS = 'video_details';

/* cast events */
export const CAST = 'cast';

export const NAVIGATE_TO_PAGE = 'navigate_to_page';
export const NAVIGATE_WITHIN_PAGE = 'navigate_within_page';

export const BOOKMARK = 'bookmark';

export const REFERRED = 'referred';
export const DEEPLINK = 'deeplink';
export const DIALOG = 'dialog';

/* Auth event: This event is used for signin/signup/password change */
export const ACCOUNT_EVENT = 'account';
// Tracking the progress/steps of user registering on web
export const REGISTER_EVENT = 'register';

// Deeplink value for the new analytics engine
export const DEEPLINK_V2 = 'DEEP_LINK';
// Referral value for the new analytics engine.
export const REFERRAL_V2 = 'REFERRAL';
// Remote device referred type value
export const REMOTE_DEVICE = 'REMOTE_DEVICE';

export const GENERIC_ACTION = 'generic_action';
export const AUTO_PLAY = 'auto_play';

// Appboy SDK dashboard is expecting this style of const, aligns with how android has done it
export const APPBOY_ADD_BOOKMARK = 'Add Bookmark';
export const APPBOY_START_VIDEO = 'Start Video';

export const SOCIAL_SHARE_EVENT = 'social_share';
export const SOCIAL_SHARE_CLICK = 'social_share_click';
export const SOCIAL_SHARE_TWITTER = 'TWITTER';
export const SOCIAL_SHARE_FACEBOOK = 'FACEBOOK';

// Trailer events
export const START_TRAILER = 'start_trailer';
export const FINISH_TRAILER = 'finish_trailer';
export const PLAY_PROGRESS_TRAILER = 'trailer_play_progress';

// Preview events
export const START_PREVIEW = 'start_preview';
export const PREVIEW_PLAY_PROGRESS = 'preview_play_progress';
export const FINISH_PREVIEW = 'finish_preview';

// Ad events
export const START_AD_EVENT = 'start_ad';
export const FINISH_AD_EVENT = 'finish_ad';

// Experiment events
export const EXPOSURE = 'exposure';

// User interaction events
export const COMPONENT_INTERACTION_EVENT = 'component_interaction';

// Request For Info Events
export const REQUEST_FOR_INFO_EVENT = 'request_for_info';

// Explicit feedback events
export const EXPLICIT_FEEDBACK_EVENT = 'explicit_feedback';

// PictureInPicture Events
export const PIP_TOGGLE_EVENT = 'pip_toggle';
