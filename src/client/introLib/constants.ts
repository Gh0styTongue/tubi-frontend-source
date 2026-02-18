// tracking timestamps
export const INTRO_ANIMATION_START_TS = 'intro_animation_start_ts';
export const INTRO_ANIMATION_END_TS = 'intro_animation_end_ts';
export const INTRO_DOC_DOWNLOAD_TIME = 'intro_doc_download_time';
export const INTRO_DOC_TTFB = 'intro_doc_ttfb';
export const INTRO_VIDEO_LOAD_DURATION = 'intro_video_load_duration';
export const INTRO_DOC_TIME_ORIGIN = 'intro_doc_time_origin';

// this is used to limit the dismissLoadingScreen called times
export const IS_COMCAST_DISMISS_LOADING_ANIMATION_CALLED = 'comcast.dismiss_loading_called';

export const VIDEO_SIGNAL_TIME = 5000;
// if the video fails to load for some reason, show the fallback SVG for a period of time.
export const INTRO_VIDEO_ENDED_EVENT = 'intro_video_ended';
