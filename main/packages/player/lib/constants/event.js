"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAYER_EVENTS = void 0;
var PLAYER_EVENTS;
(function (PLAYER_EVENTS) {
    // LifeCycle events
    /**
     * emitted after load and adapter setup is complete, this indicates load was successful
     * it's still not safe to call other instance methods.
     */
    PLAYER_EVENTS["setup"] = "tb_setup";
    /**
     * emitted when player loads all necessary resources and the playback can begin,
     * not necessarily that playback has started
     */
    PLAYER_EVENTS["ready"] = "tb_ready";
    /**
     * emitted when player figures out the media metadata
     * @optional
     */
    PLAYER_EVENTS["metadata"] = "tb_metadata";
    /**
     * emitted only once, when playback (ad or content) has really begun
     */
    PLAYER_EVENTS["firstFrame"] = "tb_firstFrame";
    /**
     * emitted when we receive the content playback's second valid time update event. This event will happen right at the start or when we resume from ads.
     */
    PLAYER_EVENTS["contentStart"] = "tb_contentStart";
    /**
     * emitted when player instance is removed.
     */
    PLAYER_EVENTS["remove"] = "tb_remove";
    // PLAYBACK events
    /**
     * emitted when the player enters the playing state, may be triggered by user or api
     * @param {Object} event
     * @param {String} event.oldstate the state the player moved from
     */
    PLAYER_EVENTS["play"] = "tb_play";
    /**
     * emitted when the player enters the paused state, may be triggered by user or api
     * @param {Object} event
     * @param {String} event.oldstate the state the player moved from
     */
    PLAYER_EVENTS["pause"] = "tb_pause";
    /**
     * emitted after a seek has been requested either by scrubbing the control bar or through API
     * @param {Object} event
     * @param {Number} event.position the position of the player before the player seeks (in seconds)
     * @param {Number} event.offset the position that has been requested to seek to (in seconds)
     */
    PLAYER_EVENTS["seek"] = "tb_seek";
    /**
    * emitted when player seek timeout.
    */
    PLAYER_EVENTS["seekActionTimeout"] = "tb_seek_action_timeout";
    /**
     * emitted when video position changes after seeking
     * @param {Object} event
     * @param {Number} event.offset is the new position
     */
    PLAYER_EVENTS["seeked"] = "tb_seeked";
    PLAYER_EVENTS["seekFailed"] = "tb_seekFailed";
    /**
     * emitted when an item completes playback
     */
    PLAYER_EVENTS["complete"] = "tb_complete";
    /**
     * emitted when player is stopped
     */
    PLAYER_EVENTS["stop"] = "tb_stop";
    /**
     * While the player is playing, this event is fired as the playback position gets updated
     * @param {Object} event
     * @param {Number} event.position current playback position (in seconds)
     * @param {Number} event.duration duration of the current playlist item (in seconds)
     */
    PLAYER_EVENTS["time"] = "tb_time";
    /**
     * emitted when player buffer data reaches max length
     */
    PLAYER_EVENTS["bufferDataEnough"] = "tb_bufferDataEnough";
    /**
     * emitted when player starts to load more media data to be able to play
     */
    PLAYER_EVENTS["bufferStart"] = "tb_bufferStart";
    /**
     * emitted when player progressing buffer data
     */
    PLAYER_EVENTS["bufferProgress"] = "tb_bufferProgress";
    /**
     * emitted when player finishes to load enough buffer data
     */
    PLAYER_EVENTS["bufferEnd"] = "tb_bufferEnd";
    /**
     * emitted when the currently playing content loads additional data into its buffer.
     * it may happen multiple times during the playback
     * @optional
     * @param {Object} event
     * @param {Number} event.bufferPercent percentage between 0 and 100 of the current media that is buffered
     * @param {Number} event.position current playback position (in seconds)
     * @param {Number} event.duration duration of the current playlist item (in seconds)
     */
    PLAYER_EVENTS["bufferChange"] = "tb_bufferChange";
    /**
     * emitted when a media error has occurred, causing the player to stop playback and go into idle mode
     * @param {Object} event
     * @param {String} event.message error message
     */
    PLAYER_EVENTS["error"] = "tb_error";
    /**
     * emitted while player start load resource
     */
    PLAYER_EVENTS["startLoad"] = "tb_startLoad";
    /**
     * emitted while we reload the source of the player
     */
    PLAYER_EVENTS["reload"] = "tb_reload";
    /**
     * emitted while we reattach the video element
     */
    PLAYER_EVENTS["reattachVideoElement"] = "tb_reattachVideoElement";
    /**
     * emitted while player video element listen event 'canplay'
     */
    PLAYER_EVENTS["canPlay"] = "tb_canPlay";
    /**
     * emitted while player startup video position changed
     */
    PLAYER_EVENTS["currentTimeProgressed"] = "tb_currentTimeProgressed";
    // AD events
    /**
     * emitted whenever an ad player setup
     */
    PLAYER_EVENTS["adPlayerSetup"] = "tb_adPlayerSetup";
    /**
     * emitted whenever an ad starts playing or when an ad is unpaused
     * @param {Object} event
     * @param {String} event.oldstate the state the player moved from
     */
    PLAYER_EVENTS["adPlay"] = "tb_adPlay";
    /**
     * emitted whenever an ad element emit adplaying
     * @param {Object} event
     * @param {String} event.oldstate the state the player moved from
     */
    PLAYER_EVENTS["adPlaying"] = "tb_adPlaying";
    /**
     * emitted whenever an ad is paused
     * @param {Object} event
     * @param {String} event.oldstate the state the player moved from
     */
    PLAYER_EVENTS["adPause"] = "tb_adPause";
    /**
     * emitted while ad playback is in progress
     * @param {Object} event
     * @param {Number} event.sequence the sequence number the ad is a part of, start from 1
     * @param {Number} event.podcount the count of ads in the current ad pod, start from 1
     * @param {Number} event.position current playback position (in seconds)
     * @param {Number} event.duration duration of the current playlist item (in seconds)
     */
    PLAYER_EVENTS["adTime"] = "tb_adTime";
    /**
     * emitted when receive ad response from a rainmaker request
     * @param {Object} event
     * @param {Array} response
     */
    PLAYER_EVENTS["adResponse"] = "tb_adResponse";
    /**
     * emitted when an ad starts to play
     * @optional
     * @param {Object} event
     * @param {Number} event.sequence the sequence number the ad is a part of, start from 1
     * @param {Number} event.podcount the count of ads in the current ad pod, start from 1
     * @param {Number} event.duration duration of the current playlist item (in seconds)
     */
    PLAYER_EVENTS["adStart"] = "tb_adStart";
    /**
     * emitted when an ad is over
     * @optional
     */
    PLAYER_EVENTS["adComplete"] = "tb_adComplete";
    /**
     * emitted when we cancel the ad in the middle
     * @optional
     */
    PLAYER_EVENTS["adDiscontinue"] = "tb_adDiscontinue";
    /**
     * emitted when we play or skip all ads in the ad pod
     * NOTE if there is no ad in the pod, we will emit adPodEmpty instead.
     */
    PLAYER_EVENTS["adPodComplete"] = "tb_adPodComplete";
    /**
     * emitted when there is no ad in an ad pod
     * @param {Object} event
     * @param {Number} event.podcount the count of ads in the current ad pod, start from 1
     */
    PLAYER_EVENTS["adPodEmpty"] = "tb_adPodEmpty";
    /**
     * emitted whenever an error prevents the ad from playing
     * @param {Object} event
     * @param {String} event.message error message
     */
    PLAYER_EVENTS["adClick"] = "tb_adClick";
    /**
     * emitted whenever an error prevents the ad from playing
     * @param {Object} event
     * @param {String} event.message error message
     */
    PLAYER_EVENTS["adError"] = "tb_adError";
    /**
     * emitted when we start to fetch the ad pod
     */
    PLAYER_EVENTS["adPodFetch"] = "tb_adPodFetch";
    /**
     * emitted when we success to fetch the ad pod
     */
    PLAYER_EVENTS["adPodFetchSuccess"] = "tb_adPodFetchSuccess";
    /**
     * emitted when we fail to fetch the ad pod
     */
    PLAYER_EVENTS["adPodFetchError"] = "tb_adPodFetchError";
    /**
     * emitted whenever an error prevents the ad from playing
     * @param {Object} event
     * @param {String} event.message error message
     */
    PLAYER_EVENTS["adBeaconFail"] = "tb_ad_BeaconFail";
    /**
     * emitted when we parse the manifest for the ad. This event will be helpful for the seamless player.
     */
    PLAYER_EVENTS["adParseManifest"] = "tb_adParseManifest";
    /**
     * emitted when we parse the initialized segment for the ad. This event will be helpful for the seamless player.
     */
    PLAYER_EVENTS["adParseInitSegment"] = "tb_adParseInitSegment";
    /**
     * emitted when we parse the data segment for the ad. This event will be helpful for the seamless player.
     */
    PLAYER_EVENTS["adParseSegment"] = "tb_adParseSegment";
    /**
     * emitted when we buffered the data segment for the ad. This event will be helpful for the seamless player.
     */
    PLAYER_EVENTS["adSegmentBufferAppended"] = "tb_adSegmentBufferAppended";
    /**
     * emitted when we start to download ad chunks. This event will be helpful for the seamless player.
     */
    PLAYER_EVENTS["adChunksFetchStart"] = "tb_adChunksFetchStart";
    /**
     * emitted when we finish downloading ad chunks. This event will be helpful for the seamless player.
     */
    PLAYER_EVENTS["adChunksFetched"] = "tb_adChunksFetched";
    /**
     * emitted when we meet fetch error during the download of the ad
     */
    PLAYER_EVENTS["adChunkFetchError"] = "tb_adChunkFetchError";
    /**
     * emitted when we meet parse error during the conversion of the ad
     */
    PLAYER_EVENTS["adChunkParseError"] = "tb_adChunkParseError";
    /**
     * emitted when we have no time to download the ad
     */
    PLAYER_EVENTS["adChunkFetchTimeout"] = "tb_adChunkFetchTimeout";
    /**
     * emitted when the ad playback get stalled
     */
    PLAYER_EVENTS["adPlaybackStalled"] = "adPlaybackStalled";
    /**
     * emitted when we meet error during the download of the ad
     */
    PLAYER_EVENTS["adSeekToAdBuffer"] = "tb_adSeekToAdBuffer";
    /**
     * emitted when we need to cancel ad preload
     */
    PLAYER_EVENTS["adCancelPreload"] = "tb_adCancelPreload";
    /**
     * emitted when the seamless player is able to buffer the ads
     */
    PLAYER_EVENTS["adBufferable"] = "tb_adBufferable";
    /*
     * emitted when player starts to load more media data to be able to play
     */
    PLAYER_EVENTS["adBufferStart"] = "tb_adBufferStart";
    /**
     * emitted when player finishes to load enough buffer data
     */
    PLAYER_EVENTS["adBufferEnd"] = "tb_adBufferEnd";
    /**
     * emitted while ad is buffering
     */
    PLAYER_EVENTS["adBufferableLengthUpdate"] = "tb_adBufferableLengthUpdate";
    /**
     * emitted while ad icon exists in current ad
     */
    PLAYER_EVENTS["adIconVisible"] = "tb_adIconVisible";
    /**
     * emitted after 3000ms of no adTime events after an adBufferStart event
     */
    PLAYER_EVENTS["adStall"] = "tb_adStall";
    /**
     * emitted while ad player start load resource
     */
    PLAYER_EVENTS["adStartLoad"] = "tb_adStartLoad";
    /**
     * emitted while ad player video element listen event 'canplay'
     */
    PLAYER_EVENTS["adCanPlay"] = "tb_adCanPlay";
    /**
     * emitted while ad player startup video position changed
     */
    PLAYER_EVENTS["adCurrentTimeProgressed"] = "tb_adCurrentTimeProgressed";
    /**
     * emitted while ad still has no buffer after specific waiting time.
     */
    PLAYER_EVENTS["adNoBuffer"] = "tb_adNoBuffer";
    /**
     * emitted when an ad is evicted from the preload cache and was not utilized
     */
    PLAYER_EVENTS["adPreloadWastedBandwidth"] = "tb_adPreloadWastedBandwidth";
    /**
     * emitted when an error occurs during ad preload
     */
    PLAYER_EVENTS["adPreloadError"] = "tb_adPreloadError";
    /**
     * emitted when an ad preload fetch times out
     */
    PLAYER_EVENTS["adPreloadTimeout"] = "tb_adPreloadTimeout";
    /**
     * emitted when an ad preload fetch is aborted
     */
    PLAYER_EVENTS["adPreloadAbort"] = "tb_adPreloadAbort";
    /**
     * emitted when an ad preload fetch is prevented
     */
    PLAYER_EVENTS["adPreloadPrevented"] = "tb_adPreloadPrevented";
    /**
     * emitted when an ad preload fetch is succeeded
     */
    PLAYER_EVENTS["adPreloadSuccess"] = "tb_adPreloadSuccess";
    /**
     * emitted when an ad reaches one of quartiles
     */
    PLAYER_EVENTS["adQuartile"] = "tb_adQuartile";
    // Other events
    /**
     * emitted when the player toggles to/from fullscreen
     * @optional
     * @param {Object} event
     * @param {Boolean} event.fullscreen new fullscreen state
     */
    PLAYER_EVENTS["fullscreen"] = "tb_fullscreen";
    /**
     * emitted when the player has gone in or out of a mute state
     * @optional
     * @param {Object} event
     * @param {Boolean} event.mute new mute state
     */
    PLAYER_EVENTS["mute"] = "tb_mute";
    /**
     * emitted when the player's volume is changed
     * @optional
     * @param {Object} event
     * @param {Number} event.volume new volume percentage (0-100)
     */
    PLAYER_EVENTS["volume"] = "tb_volume";
    /**
     * emitted when the list of available captions tracks changes
     * @param {Object} event
     * @param {Object[]} event.captionsList an array with all included captions tracks (including "off").
     * includes the same information as getCaptionsList()
     */
    PLAYER_EVENTS["captionsListChange"] = "tb_captionsListChange";
    /**
     * emitted when a captions-related error occurs (loading, parsing, etc.)
     * @param {Object} event
     * @param {String} event.message error message
     */
    PLAYER_EVENTS["captionsError"] = "tb_captionsError";
    /**
     * emitted when audio tracks have been parsed and are available
     * @param {Object} event
     * @param {Object[]} event.audioTracks an array with all included audio tracks.
     * includes the same information as getAudioTracks()
     */
    PLAYER_EVENTS["audioTracksAvailable"] = "tb_audioTracksAvailable";
    /**
     * emitted when audio tracks data has changed
     * @param {Object} event
     * @param {Object[]} event.audioTracks an array with all included audio tracks.
     * includes the same information as getAudioTracks()
     */
    PLAYER_EVENTS["audioTracksChange"] = "tb_audioTracksChange";
    /**
     * emitted when error with audio tracks
     * @param {String} error message
     */
    PLAYER_EVENTS["audioTracksError"] = "tb_audioTracksError";
    /**
     * emit once all captions tracks are available
     * this event is the ideal time to set default captions with the API
     * @param {Object} event
     * @param {Object[]} event.captionsList an array with all included captions tracks (including "off").
     * includes the same information as getCaptionsList()
     */
    PLAYER_EVENTS["allCaptionsAvailable"] = "tb_subtitlesAvailable";
    /**
     * emitted whenever the active captions track is changed manually or via API
     * @param {Object} event
     * @param {Number} event.captionsIndex the index of new active captions
     */
    PLAYER_EVENTS["captionsChange"] = "tb_captionsChange";
    /**
     * emitted whenever the style object for the captions changes
     * @param {Object} event
     * @param {Object} event.captionsStylesChange is an object with keys of font and window
     */
    PLAYER_EVENTS["captionsStylesChange"] = "tb_captionsStylesChange";
    /**
     * emitted when the list of available quality levels is updated.
     * happens e.g. shortly after a playlist item starts playing
     * @optional
     * @param {Object} event
     * @param {Object[]} event.qualityList the full array of qualities, including the new additions
     */
    PLAYER_EVENTS["qualityListChange"] = "tb_qualityListChange";
    /**
     * emitted when the list of restricted quality levels is updated.
     * happens e.g. shortly after a parsing the manifest
     * @optional
     * @param {Object} event
     * @param {Object[]} event.qualityList the full array of restricted qualities
     */
    PLAYER_EVENTS["restrictedQualityListChange"] = "tb_restrictedQualityListChange";
    /**
     * emitted when the active quality level is changed
     * @optional
     * @param {Object} event
     * @param {Number} event.qualityIndex the index of new active quality level
     * @param {Level} event.level the quality level object
     */
    PLAYER_EVENTS["qualityChange"] = "tb_qualityChange";
    /**
     * emit once the active quality level is changed by HLS FRAG_CHANGED event
     * @optional
     * @param {Object} event
     * @param {Number} event.qualityIndex the index of new visual quality level
     */
    PLAYER_EVENTS["visualQualityChange"] = "tb_visualQualityChange";
    /**
     * emitted when we cap a level due to the fps drop rate being too high.
     */
    PLAYER_EVENTS["capLevelOnFPSDrop"] = "tb_capLevelOnFPSDrop";
    // Auxiliary event
    /**
     * Emitted when playback (ad or content) has really begun, or the player gets destroyed.
     */
    PLAYER_EVENTS["startupPerformance"] = "tb_startupPerformance";
    /**
     * Emitted when user enter picture in picture mode.
     */
    PLAYER_EVENTS["enterPictureInPicture"] = "tb_enterPictureInPicture";
    /**
     * Emitted when user leave picture in picture mode.
     */
    PLAYER_EVENTS["leavePictureInPicture"] = "tb_leavePictureInPicture";
    /**
     * emitted when play() promise is rejected, which means browser denied the play request
     */
    PLAYER_EVENTS["autoStartNotAllowed"] = "tb_autoStartNotAllowed";
    /**
     * emitted when a linear yospace session has expired. occurs after 2 minutes of no manifest requests
     */
    PLAYER_EVENTS["linearSessionExpired"] = "tb_linearSessionExpired";
    /**
     * emitted when a linear apollo ad pixel request failed
     */
    PLAYER_EVENTS["adPixelRequestFailed"] = "tb_adPixelRequestFailed";
    /**
     * emitted when an ad is skipped due to health score low
     */
    PLAYER_EVENTS["adHealthScoreLow"] = "tb_adHealthScoreLow";
})(PLAYER_EVENTS = exports.PLAYER_EVENTS || (exports.PLAYER_EVENTS = {}));
//# sourceMappingURL=event.js.map