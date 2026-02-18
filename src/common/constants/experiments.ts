export const FAKE_SALT_FOR_OVERRIDES = 'FORCED_OVERRIDE';

export enum PROGRESSIVE_MODE {
  CONTROL = 0,
  PROGRESSIVE_ANY_SPEED = 1,
  PROGRESSIVE_NORMAL_SPEED = 2,
  PROGRESSIVE_FAST_SPEED = 3
}

export const enum FIRETV_FLOAT_CUE_POINT_VALUE {
  INTEGER_CUE_POINT = 'integer_cue_point',
  INTEGER_CUE_POINT_WITH_DISABLE_AD_CLEAN = 'integer_cue_point_with_disable_ad_clean',
  FLOAT_CUE_POINT_WITH_TEXT_TRACK = 'float_cue_point_with_text_track',
  FLOAT_CUE_POINT_WITH_TIMEUPDATE = 'float_cue_point_with_timeupdate',
}

// Series Nudge Registration experiment
export const N_EPISODES_ALLOWED_TO_WATCH = 2;
