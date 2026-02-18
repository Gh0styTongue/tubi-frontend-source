// The minimum duration for an impression to be considered valid and logged
export const VALID_DURATION = 1000;
// The amount of time to retain concluded impressions before sending them to the server
export const DEFAULT_IMPRESSIONS_TIMEOUT = 20 * 1000;
// The maximum number of concluded impressions to retain before sending them to the server, even if the timeout has not been reached
export const MAX_CONCLUDED_IMPRESSIONS = 10;
export const AUTO_PLAY_CONTAINER_ID_IMPRESSION = 'auto_play';
export const RELATED_CONTENTS_CONTAINER_ID_IMPRESSION = 'you_may_also_like';
