// As specified by Dennis Yost
// https://app.shortcut.com/tubi/story/503332/web-ott-reduce-curated-preview-playback-reporting-to-youbora-and-report-content-type
export enum YouboraContentTypes {
  UNKNOWN = 'unknown',
  MOVIE = 'movie',
  EPISODE = 'episode',
  TRAILER = 'trailer',
  PREVIEW = 'preview',
  LINEAR = 'linear',
  LIVE_EVENT = 'liveEvent', // For sports and or other "live" events if they can be represented.
}
