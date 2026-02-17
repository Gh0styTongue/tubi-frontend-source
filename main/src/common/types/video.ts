import type { Subtitle, OTTCaptionSettingsState } from '@adrise/player';
import type { VideoResolutionType } from '@tubitv/analytics/lib/playerEvent';
import type { FetchState } from '@tubitv/refetch/lib/types';
import type { ValueOf } from 'ts-essentials';

import type { VideoContentResponse } from 'client/utils/clientDataRequest';
import type * as actions from 'common/constants/action-types';
import type { LINEAR_CONTENT_TYPE, THUMBNAIL_TEMPORAL_RESOLUTIONS } from 'common/constants/constants';
import type { Program } from 'common/types/epg';

import type { Season } from './series';

export type AdBreaks = number[];

/**
 * a: seasons
 * s: series
 * v: movies | trailers
 * l: linear
 * p: preview video
 * se: sports event
 */
export type VideoType = 'a' | 's' | 'v' | 'l' | 'p' | 'se';

type SystemType = 'mpaa' | 'tvpg';

export type RatingCode =
  | 'TV-Y' | 'TV-Y7' | 'TV-Y7_FV' | 'TV-G' | 'TV-PG' | 'TV-14' | 'TV-MA'
  | 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'NR';

type RatingDescriptorCode = | 'D' | 'FV' | 'L' | 'S' | 'V';

export type RatingDescriptor = {
  code: RatingDescriptorCode;
  description: string;
};
export interface VideoRating {
  // The applicable US ratings system, either 'mpaa' for movies or 'tvpg' for TV
  system: SystemType;

  // Localized value. May be an arbitrary string dependent on the locale.
  value: string;

  // Rating normalized to US ratings system such as 'PG-13' or 'TV-MA'
  code: RatingCode;

  // Content descriptors is provided in addition to the age-based rating
  descriptors?: RatingDescriptor[]
}

export const LoginReason = {
  EARLY_ACCESS: 'EARLY_ACCESS',
  MATURE_CONTENT_GATING: 'MATURE_CONTENT_GATING',
} as const;

type LoginReasonType = ValueOf<typeof LoginReason>;

// @link https://github.com/adRise/protos/blob/4e99aa2caf7695593840ee5139246a780c0ec1a2/content/message.proto#L162-L169
// Note: When adding new resource types, please also update getVideoMonitoringDRM() in
// src/common/features/playback/utils/getVideoMonitoringDRM.ts
export type VideoResourceType =
  | 'dash_fairplay'
  | 'dash_playready'
  | 'dash_playready_psshv0'
  | 'dash_widevine'
  | 'dash'
  | 'hlsv3'
  | 'hlsv6'
  | 'hlsv6_fairplay'
  | 'hlsv6_playready'
  | 'hlsv6_playready_psshv0'
  | 'hlsv6_widevine'
  | 'hlsv6_widevine_psshv0'
  | 'hlsv6_playready_nonclearlead'
  | 'hlsv6_widevine_nonclearlead'
  | 'dash_widevine_nonclearlead'
  | 'dash_playready_nonclearlead'
  | 'dash_widevine_psshv0'
  | 'unknown';

export type HDCPVersion =
  | 'hdcp_unknown'
  | 'hdcp_disabled'
  | 'hdcp_v1'
  | 'hdcp_v2';

export interface VideoResource {
  audio_tracks?: AudioTrackMetadata[];
  manifest: {
    url: string;
    duration?: number;
  };
  type: VideoResourceType;
  license_server?: {
    url: string;
    auth_header_key: string;
    auth_header_value: string;
    hdcp_version: HDCPVersion;
  };
  titan_version?: string;
  codec?: VIDEO_RESOURCE_CODEC;
  resolution?: VIDEO_RESOURCE_RESOLUTION;
  ssai_version?: string;
  generator_version?: string;
}

export interface VideoMetadata {
  type: VideoResourceType;
  codec: VIDEO_RESOURCE_CODEC;
  resolution: VIDEO_RESOURCE_RESOLUTION | VideoResolutionType;
}

interface ImageResource {
  posterarts?: string[];
  posterarts_384?: string[];
  hero_images?: string[];
  landscape_images?: string[];
  thumbnails?: string[];
  larger_thumbnails?: string[];
  backgrounds?: string[];
  hero_422?: string[];
  hero_feature?: string[];
  linear_larger_poster?: string[];
  title_art?: string[];
  hack_feat_hero_sl?: string[]; // only used for sealion, todo remove
}

export type VideoSchedule = {
  end_time: string;
  live: boolean;
  program_id: string;
  start_time: string;
};

export interface AudioTrackMetadata {
  lang: string;
  type: 'standard' | 'audio_descriptor';
  display_name: string;
}

interface BannerImage {
  large_background: string;
  small_background: string;
  supported_devices_logo: string;
  title: string;
  ott_banner_background: string;
  ott_unsupported_banner_background: string;
  ott_banner_background_guest?: string;
  disclaimer_logo?: string;
}

interface BannerText {
  banner_text_guest: string;
  banner_text_registered: string;
  banner_text_unsupported_devices: string;
  banner_text_disclaimer_guest?: string;
}

type CreditCuepoints = {
  prologue: number;
  postlude: number;
  earlycredits_start: number;
  earlycredits_end: number;
  recap_start: number;
  recap_end: number;
  intro_start: number;
  intro_end: number;
};

export interface Video {
  banner_images?: BannerImage;
  banner_texts?: BannerText;
  actors?: string[];
  /** array of audio description languages */
  ad_languages?: string[];
  backgrounds: string[];
  channel_id?: string;
  channel_name?: string;
  channel_logo?: string;
  credit_cuepoints?: Partial<CreditCuepoints>;
  description: string;
  directors?: string[];
  duration: number;
  has_subtitle?: boolean;
  has_trailer?: boolean;
  hero_images: string[];
  id: string;
  is_recurring?: boolean;
  landscape_images: string[];
  lang?: string;
  posterarts: string[];
  publisher_id: string;
  policy_match?: boolean;
  ratings?: VideoRating[];
  series_id?: string;
  series_title?: string;
  series_images?: ImageResource;
  subtitles?: Subtitle[];
  tags?: string[];
  title: string;
  thumbnails: string[];
  type: VideoType;
  video_resources?: VideoResource[];
  video_metadata?: VideoMetadata[];
  x_cid?: string;
  year: number;
  availability_starts?: string | null;
  availability_ends?: string | null;
  availability_duration?: number | null;
  trailers?: Trailer[];
  seasons?: Season[];
  isMetadataLoaded?: boolean;
  is_cdc?: boolean;
  images?: ImageResource;
  valid_duration?: number;
  ttl?: number;
  video_preview_url?: string;
  air_datetime?: string;
  video_renditions?: string[];
  vibes?: string[];
  has_video_resources?: boolean;
  needs_login?: boolean;
  login_reason?: LoginReasonType;
  num_seasons?: number;
  programs?: Program[];
  episode_number?: string;
  schedules?: VideoSchedule[]
  league?: string;
  monetization?: {
    cue_points: number[];
  };
  player_type?: 'fox';
}

export type VideosResponseBody = Record<string, Video>;

export interface LinearVideo extends Omit<Video, 'duration'> {
  type: typeof LINEAR_CONTENT_TYPE;
  duration?: Video['duration'];
}

export interface autoPlayContent {
  loaded: boolean;
  loading: boolean;
  contents: string[] | null;
}

interface RelatedRow {
  id: string;
  title: string;
  contents: string[];
}

type RelatedContent = RelatedRow[];

export interface VideoState {
  adBreaksById: { [id: string]: AdBreaks };
  autoPlayContentsById: Record<string, autoPlayContent>;
  byId: { [id: string]: Video };
  fullContentById: Record<string, boolean>;
  relatedContentsById: Record<string, RelatedContent>;
  resumePositionById: Record<string, number>;
  statusById: Record<string, FetchState>;
  thumbnailSpritesById: Record<string, ThumbnailSprites>;
}

export interface Trailer {
  id: string;
  duration: number;
  url: string;
}

export type ThumbnailSpritesKeys = typeof THUMBNAIL_TEMPORAL_RESOLUTIONS[number];

export interface ThumbnailSpritesBase {
  count_per_sprite: number;
  frame_width: number;
  type: ThumbnailSpritesKeys;
  sprites: string[];
  height: number;
  rows: number;
  columns: number;
  duration: number;
}

export interface ThumbnailSprites {
  '5x'?: ThumbnailSpritesBase;
  '10x'?: ThumbnailSpritesBase;
  '20x'?: ThumbnailSpritesBase;
}

export interface AutoplayData {
  loading?: boolean;
  loaded?: boolean;
  contents?: string[];
}

export interface OTTPlayerConfig {
  [prop: string]: unknown;
  video: Video;
  captionSettings: OTTCaptionSettingsState;
  adBreaks: number[];
  viewHistory: Record<string, unknown> | null;
  belongSeries: string;
  defaultCaptions: string;
  userId: number;
  title: string;
  seriesTitle: string;
  thumbnailSprites: Partial<ThumbnailSprites>;
  autoplayData: AutoplayData
  videoResource: VideoResource;
  pageReloadRetryCount?: number;
}

export interface BatchAddVideosAction {
  type:
    | typeof actions.BATCH_ADD_VIDEOS
    | typeof actions.BATCH_ADD_VIDEOS_AND_REMOVE_OLD;
  contents: Record<string, Video>;
  fullContentsMap: Record<string, true>;
  cuePointsMap: Record<string, number[]>;
}

export interface LoadSeriesEpisodesMetadataSuccessAction {
  type: typeof actions.LOAD_SERIES_EPISODES_METADATA_SUCCESS;
  id: string;
  seasons: Season[];
}

export interface LoadByIdSuccessAction {
  type: typeof actions.LOAD_CONTENT_RF.SUCCESS;
  id: number | string;
  payload: {
    result: VideoContentResponse & { seasons?: Season[] };
    isPaginatedResult?: boolean;
    validDuration: number;
    cuePoints?: number[];
  };
}

export interface LoadByIdFetchAction {
  type: typeof actions.LOAD_CONTENT_RF.FETCH;
  id: number | string;
  payload: unknown;
}

export interface LoadByIdFailAction {
  type: typeof actions.LOAD_CONTENT_RF.FAILURE;
  id: number | string;
  error: unknown
}

export type LoadContentAction =
  | LoadByIdSuccessAction
  | LoadByIdFetchAction
  | LoadByIdFailAction
  | BatchAddVideosAction
  | LoadSeriesEpisodesMetadataSuccessAction;

export interface LoadByIdAction<P> {
  type: typeof actions.LOAD_CONTENT_RF;
  id: number | string;
  payload: () => Promise<P>;
}

export interface SetResumePositionAction {
  type: typeof actions.SET_RESUME_POSITION;
  id: string;
  resumePosition: number;
}
export interface RemoveResumePositionAction {
  type: typeof actions.REMOVE_RESUME_POSITION;
  ids: string[];
}
export interface LoadRelatedContentsAction {
  type: typeof actions.LOAD_RELATED_CONTENTS_SUCCESS;
  id: string;
  result: RelatedContent;
}

export interface LoadAutoPlayContentsSuccessAction {
  type: typeof actions.LOAD_AUTOPLAY_CONTENTS_SUCCESS;
  id: string;
  result: string[];
}
export interface LoadAutoPlayContentsFailAction {
  type: typeof actions.LOAD_AUTOPLAY_CONTENTS_FAIL;
  contentId: string;
}
interface LoadAutoPlayContentsStartAction {
  type: typeof actions.LOAD_AUTOPLAY_CONTENTS;
  contentId: string;
}
export interface ResetLoadAutoPlayContentsAction {
  type: typeof actions.RESET_AUTOPLAY_CONTENTS;
  contentId: string;
}
export type LoadAutoPlayContentsAction =
  | LoadAutoPlayContentsStartAction
  | LoadAutoPlayContentsSuccessAction
  | LoadAutoPlayContentsFailAction
  | ResetLoadAutoPlayContentsAction;

export interface LoadContentThumbnailSpritesAction {
  type: typeof actions.LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS;
  contentId: string;
  result: ThumbnailSpritesBase;
}

export enum VIDEO_RESOURCE_CODEC {
  HEVC = 'H265',
  AVC = 'H264',
  UNKNOWN = 'UNKNOWN',
}

export enum VIDEO_RESOURCE_CODEC_ALIAS {
  HEVC = 'hevc',
  AVC = 'avc',
  UNKNOWN = 'unknown',
}

export enum VIDEO_RESOURCE_RESOLUTION {
  RES_4K = '2160P',
  RES_1080P = '1080P',
  RES_720P = '720P',
  RES_576P = '576P',
  RES_480P = '480P',
}

export type HDMIConnectionState = 'unknown' | 'disconnected' | 'connected';
