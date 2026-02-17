// LEGACY PLAYER EVENTS
export const TUBI_PLAYER_EVENTS = {
  // ready means playback can begin, not necessarily that playback has started
  ready: 'tb_ready',
  setupError: 'tb_setupError',
  error: 'tb_error',
  // seek operation begins
  seek: 'tb_seek',
  // seek operation was successful
  seeked: 'tb_seeked',
  play: 'tb_play',
  canPlay: 'tb_canPlay',
  pause: 'tb_pause',
  // content has finished
  complete: 'tb_complete',
  adPlay: 'tb_adPlay',
  adPause: 'tb_adPause',
  // emitted at an interval during ad playback, no less than 1/second
  adTime: 'tb_adTime',
  adStart: 'tb_adStart',
  adCanPlay: 'tb_adCanPlay',
  adComplete: 'tb_adComplete',
  // all ads in a non-empty adPod have completed
  adPodComplete: 'tb_adPodComplete',
  adPodEmpty: 'tb_adPodEmpty',
  adError: 'tb_adError',
  adClick: 'tb_adClick',
  adStartLoad: 'tb_adStartLoad',
  adPlayerSetup: 'tb_adPlayerSetup',
  adBufferStart: 'tb_adBufferStart',
  adBufferEnd: 'tb_adBufferEnd',
  contentStart: 'tb_contentStart',
  // 'fullscreen' event must provide true or false
  fullscreen: 'tb_fullscreen',
  time: 'tb_time',
  // mute event must provide true / false
  mute: 'tb_mute',
  // volume event must provide new volume value as a number between 1-100
  volume: 'tb_volume',
  // emit array as a new captions track is loaded/available
  captionsListChange: 'tb_captionsListChange',
  // emitted when audio tracks have been parsed and are available
  audioTracksAvailable: 'tb_audioTracksAvailable',
  // emitted when audio tracks data has changed
  audioTracksChange: 'tb_audioTracksChange',
  // emitted when error with audio tracks
  audioTracksError: 'tb_audioTracksError',
  // emit once all captions tracks are available
  allSubtitlesAvailable: 'tb_subtitlesAvailable',
  subtitleChange: 'tb_subtitleChange',
  // emit once the list of available quality levels is updated
  qualityListChange: 'tb_qualityListChange',
  // emit once the active quality level is changed by user
  qualityChange: 'tb_qualityChange',
  // emit once the active quality level is changed for HLS
  visualQualityChange: 'tb_visualQualityChange',
  // playback has started
  firstFrame: 'tb_firstFrame',
  startLoad: 'tb_startLoad',
  bufferStart: 'tb_bufferStart',
  bufferEnd: 'tb_bufferEnd',
  bufferChange: 'tb_bufferChange',
  warning: 'tb_warning',
  // emit once user clicks the play button, happens before `play` event
  userPlay: 'tb_userPlay',
  // emit once user clicks the pause button, happens before `pause` event
  userPause: 'tb_userPause',
  // emit once user clicks the progress bar to seek, happens before `seek` event
  userSeek: 'tb_userSeek',
  // emit once player gets the metadata of the playback content
  metadata: 'tb_metadata',
  // app has moved to the background
  background: 'tb_background',
  // app has regained focus after being moved to the background
  foreground: 'tb_foreground',
  // emitted when receiving ad response from a rainmaker request
  adResponse: 'tb_adResponse',
  // emitted when play() promise is rejected, which means browser denied the play request
  autoStartNotAllowed: 'tb_autoStartNotAllowed',
  // emitted when ad icon is available in current ads
  adIconVisible: 'tb_adIconVisible',
};
