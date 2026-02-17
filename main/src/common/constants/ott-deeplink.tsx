/**
 * Supported launchpoint values
 * https://docs.google.com/document/d/13Mt6ybWex70VTA2gpYOMgsrVUBbeTQJx8Va4TSa90c0/edit#heading=h.oz271irtsfgb
 */
export enum ottDeeplinkLaunchPoint {
  Launch = 'launch',
  Home = 'home',
  Detail = 'detail',
  Playback = 'playback',
  Search = 'search',
  Section = 'section',
}
/**
 * Required parameters for certain launchpoint
 */
export enum ottDeeplinkRequiredParameter {
  Playback = 'assetId', // The asset id, identified in the app's id space. This refers to a specific video resource that can be played.
  PlaybackAssetType = 'assetType', // The type of the asset to play. Optional, we use assetType to differentiate playback content, values see the `ottDeeplinkAssetType`.
  Detail = 'entityId', // An entity ID in the app's ID space, such as a movie, TV series, TV season, TV episode, playlist, event, artist, album, etc. In some cases, this will be the same value as assetId, but implementation will vary by app.
  Search = 'query', // User specified query value, for search.
  Section = 'sectionName', // A "category" or "network" name for the app to navigate to.
  LaunchedFrom = 'launchedFrom',
  LaunchPoint = 'launchpoint',
}

export enum ottDeeplinkAssetType {
  Vod = 'vod',
  Linear = 'linear',
}

export const LGTV_DEEPLINK_PARAM_NAME = 'lgLaunchParams';
export const LGTV_DEEPLINK_CONTENT_TARGET_NAME = 'contentTarget';
export const LGTV_DEEPLINK_CONTENT_ID_NAME = 'content_id';
