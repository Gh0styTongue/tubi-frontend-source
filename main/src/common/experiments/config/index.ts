import type { Store } from 'redux';

import type { Experiment } from 'common/experiments/Experiment';
import type { StoreState } from 'common/types/storeState';

import ForceFailsafe from './forceFailsafe';
import LinearWebVerticalFitPlayer from './linearWebVerticalFitPlayer';
import OTTAndroidtvIntroVideoFps from './ottAndroidtvIntroVideoFps';
import OTTAndroidtvOnetapReturningUsers from './ottAndroidtvOnetapReturningUsers';
import OTTComcastHlsUpgrade from './ottComcastHlsUpgrade';
import OTTComcastPauseAds from './ottComcastPauseAds';
import OTTFireTVAdPreload from './ottFireTVAdPreload';
import OTTFireTVAutocomplete from './ottFireTVAutocomplete';
import OTTFireTVBrowseWhileWatching from './ottFireTVBrowseWhileWatching';
import OTTFireTVContentNotFound from './ottFireTVContentNotFound';
import OTTFireTVDcPromotionRow from './ottFireTVDcPromotionRow';
import OTTFireTVDebounceBackgroundImageRerun from './ottFireTVDebounceBackgroundImageRerun';
import OTTFireTVDetachHlsDuringAdsPhase2 from './ottFireTVDetachHlsDuringAdsPhase2';
import OTTFireTVEnableFrontBufferFlush from './ottFireTVEnableFrontBufferFlush';
import OTTFireTVErrorModalRedesign from './ottFireTVErrorModalRedesign';
import OTTFireTVFloatCuePoint from './ottFiretvFloatCuePoint';
import OTTFireTVGate1080pResolution from './ottFireTVGate1080pResolution';
import OTTFireTVHEVCAnd480PAds from './ottFireTVHEVCAnd480PAds';
import OTTFiretvHlsUpgrade from './ottFiretvHlsUpgrade';
import OTTFireTVLargerPoster from './ottFireTVLargerPoster';
import OTTFireTVLevelFragFastFail from './ottFireTVLevelFragFastFail';
import OTTFireTVLinearFavoriteChannel from './ottFireTVLinearFavoriteChannel';
import OTTFireTVLiveErrorProcessor from './ottFireTVLiveErrorProcessor';
import OTTFireTVNativeCaptionsCache from './ottFireTVNativeCaptionsCache';
import OTTFireTVNewCategoryPage from './ottFireTVNewCategoryPage';
import OTTFireTVPosterLabelsNav from './ottFireTVPosterLabelsNav';
import OTTFireTVPostponeThumbnailFetch from './ottFireTVPostponeThumbnailFetch';
import OTTFireTVProgressiveFetch from './ottFireTVProgressiveFetch';
import OTTFireTVRecommendedChannelsInCa from './ottFireTVRecommendedChannelsInCa';
import OTTFireTVRTU from './ottFireTVRTU';
import OTTFireTVSeriesAutoplayShowMoreContents from './ottFireTVSeriesAutoplayShowMoreContents';
import OTTFireTVSeriesNudgeRegistration from './ottFireTVSeriesNudgeRegistration';
import OTTFireTVSingleScreenOnboarding from './ottFireTVSingleScreenOnboarding';
import OTTFireTVSkinsAd from './ottFireTVSkinsAd';
import OTTFireTVSkipAdWithHealthscore from './ottFireTVSkipAdWithHealthscore';
import OTTFireTVSpotlightCarouselNav from './ottFireTVSpotlightCarouselNav';
import OTTFireTVStartFromBeginningForAutoplayContent from './ottFireTVStartFromBeginningForAutoplayContent';
import OTTFireTVTitleOnboardingPersonalization from './ottFireTVTitleOnboardingPersonalization';
import OTTFireTVTitleTreatment from './ottFireTVTitleTreatment';
import OTTFireTVUseQueueImpressions from './ottFireTVUseQueueImpressions';
import OTTFireTVViewableImpressions from './ottFireTVViewableImpressions';
import OTTHisenseHlsUpgrade from './ottHisenseHlsUpgrade';
import OTTLGTVDisablePreviewsWhileScrolling from './ottLGTVDisablePreviewsWhileScrolling';
import OTTLGTVHlsUpgrade from './ottLGTVHlsUpgrade';
import OTTLGTVIgnorePlayInterruptErrorInAds from './ottLGTVIgnorePlayInterruptErrorInAds';
import OTTLgtvPauseAds from './ottLgtvPauseAds';
import OTTLGTVPrerollTimeManager from './ottLGTVPrerollTimeManager';
import OTTLGTVViewableImpressions from './ottLGTVViewableImpressions';
import OTTMultiplePlatformsDecreasePrerollBufferStall from './ottMultiplePlatformsDecreasePrerollBufferStall';
import OTTPlayerFireTVSimpleAdProgress from './ottPlayerFireTVSimpleAdProgress';
import OTTPlayerSamsungUseHlsAds from './ottPlayerSamsungUseHlsAds';
import OTTPS4EnableTrailerOnWebmaf3 from './ottPS4EnableTrailerOnWebmaf3';
import OTTPS5HlsUpgrade from './ottPS5HlsUpgrade';
import OTTPS5SrcNotSupportedErrorRecovery from './ottPS5SrcNotSupportedErrorRecovery';
import OTTRainmakerRetry from './ottRainmakerRetry';
import OTTReactQueryCompatibility from './ottReactQueryCompatibility';
import OTTSamsungDedicatedAdPlayer from './ottSamsungDedicatedAdPlayer';
import OTTSamsungHomescreenContentCount from './ottSamsungHomescreenContentCount';
import OTTSamsungPauseAds from './ottSamsungPauseAds';
import OTTSamsungRegistrationGenderCollection from './ottSamsungRegistrationGenderCollection';
import OTTSamsungRepositionVideoResource from './ottSamsungRepositionVideoResource';
import OTTSamsungSynchronousVerification from './ottSamsungSynchronousVerification';
import OTTSamsungVibes from './ottSamsungVibes';
import OTTShowMetadataOnSearch from './ottShowMetadataOnSearch';
import OTTStagingRedirect from './ottStagingRedirect';
import OTTTivoHlsUpgrade from './ottTivoHlsUpgrade';
import OTTVizioDetachHlsDuringAdsPhase2 from './ottVizioDetachHlsDuringAdsPhase2';
import OTTVizioEnableFrontBufferFlush from './ottVizioEnableFrontBufferFlush';
import OTTVizioHlsUpgrade from './ottVizioHlsUpgrade';
import OTTVizioPauseAds from './ottVizioPauseAds';
import OTTVizioRegistrationSignInWithVizio from './ottVizioRegistrationSignInWithVizio';
import OTTXboxoneHlsUpgrade from './ottXboxoneHlsUpgrade';
import PlayerWebTheaterMode from './playerWebTheaterMode';
import WebAdAbnormalErrorConstrainView from './webAdAbnormalErrorConstrainView';
import WebAllCategories from './webAllCategories';
import WebAnalyticsAnonymousToken from './webAnalyticsAnonymousToken';
import WebAndroidDisablePlayback from './webAndroidDisablePlayback';
import WebCastingButton from './webCastingButton';
import WebCelebrityYmal from './webCelebrityYmal';
import WebCwRowForGuestUsers from './webCwRowForGuestUsers';
import WebFeaturedRow from './webFeaturedRow';
import WebHlsUpgrade from './webHlsUpgrade';
import WebIosPlayback from './webIosPlayback';
import WebLastVideoResourceRetry from './webLastVideoResourceRetry';
import WebLinearPlayerPip from './webLinearPlayerPip';
import webNewFeaturedBillboard from './webNewFeaturedBillboard';
import WebPersonalizationPrompt from './webPersonalizationPrompt';
import WebQrReferralsPausescreen from './webQrReferralsPausescreen';
import WebRegistrationMagicLink from './webRegistrationMagicLink';
import WebRegistrationPlayerGate from './webRegistrationPlayerGate';
import WebRemoveLandingPage from './webRemoveLandingPage';
import WebRepositionVideoResource from './webRepositionVideoResource';
import WebVerticalYmal from './webVerticalYmal';
import WebVideoPreview from './webVideoPreview';
import WebVODPlayerPip from './webVODPlayerPip';

const getExperiments: (store?: Store<StoreState>) => Experiment[] = (store) => [
  LinearWebVerticalFitPlayer(store),
  OTTSamsungVibes(store),
  OTTFireTVAdPreload(store),
  OTTFireTVLargerPoster(store),
  OTTFireTVContentNotFound(store),
  OTTFireTVEnableFrontBufferFlush(store),
  OTTFireTVErrorModalRedesign(store),
  OTTFireTVFloatCuePoint(store),
  OTTFireTVGate1080pResolution(store),
  OTTFireTVRTU(store),
  OTTFireTVLevelFragFastFail(store),
  OTTFireTVLinearFavoriteChannel(store),
  OTTFireTVNativeCaptionsCache(store),
  OTTFireTVPosterLabelsNav(store),
  OTTFireTVPostponeThumbnailFetch(store),
  OTTFireTVProgressiveFetch(store),
  OTTFireTVRecommendedChannelsInCa(store),
  OTTFireTVSeriesAutoplayShowMoreContents(store),
  ForceFailsafe(store),
  OTTHisenseHlsUpgrade(store),
  OTTLGTVDisablePreviewsWhileScrolling(store),
  OTTLGTVIgnorePlayInterruptErrorInAds(store),
  OTTFireTVSpotlightCarouselNav(store),
  OTTFireTVTitleOnboardingPersonalization(store),
  OTTFireTVTitleTreatment(store),
  OTTFireTVNewCategoryPage(store),
  OTTFireTVUseQueueImpressions(store),
  OTTFireTVViewableImpressions(store),
  OTTFireTVAutocomplete(store),
  OTTFireTVBrowseWhileWatching(store),
  OTTFireTVDcPromotionRow(store),
  OTTFireTVDebounceBackgroundImageRerun(store),
  OTTFireTVDetachHlsDuringAdsPhase2(store),
  OTTFireTVHEVCAnd480PAds(store),
  OTTFireTVSkinsAd(store),
  OTTFireTVSkipAdWithHealthscore(store),
  OTTMultiplePlatformsDecreasePrerollBufferStall(store),
  OTTPlayerFireTVSimpleAdProgress(store),
  OTTPlayerSamsungUseHlsAds(store),
  OTTReactQueryCompatibility(store),
  OTTRainmakerRetry(store),
  OTTPS4EnableTrailerOnWebmaf3(store),
  OTTPS5HlsUpgrade(store),
  OTTSamsungDedicatedAdPlayer(store),
  OTTSamsungHomescreenContentCount(store),
  OTTSamsungRegistrationGenderCollection(store),
  OTTSamsungRepositionVideoResource(store),
  OTTSamsungSynchronousVerification(store),
  OTTShowMetadataOnSearch(store),
  OTTStagingRedirect(store),
  OTTTivoHlsUpgrade(store),
  OTTVizioDetachHlsDuringAdsPhase2(store),
  OTTVizioRegistrationSignInWithVizio(store),
  PlayerWebTheaterMode(store),
  WebAdAbnormalErrorConstrainView(store),
  WebAnalyticsAnonymousToken(store),
  WebAndroidDisablePlayback(store),
  WebCastingButton(store),
  OTTLGTVViewableImpressions(store),
  OTTPS5SrcNotSupportedErrorRecovery(store),
  OTTFireTVLiveErrorProcessor(store),
  OTTFireTVSeriesNudgeRegistration(store),
  OTTFireTVSingleScreenOnboarding(store),
  WebRegistrationMagicLink(store),
  WebRepositionVideoResource(store),
  WebVerticalYmal(store),
  WebVideoPreview(store),
  webNewFeaturedBillboard(store),
  WebCwRowForGuestUsers(store),
  WebVODPlayerPip(store),
  WebAllCategories(store),
  OTTAndroidtvIntroVideoFps(store),
  OTTAndroidtvOnetapReturningUsers(store),
  /** Hls normalization upgrade **/
  OTTComcastHlsUpgrade(store),
  OTTFiretvHlsUpgrade(store),
  OTTFireTVStartFromBeginningForAutoplayContent(store),
  OTTVizioEnableFrontBufferFlush(store),
  OTTVizioHlsUpgrade(store),
  OTTLGTVHlsUpgrade(store),
  OTTLGTVPrerollTimeManager(store),
  OTTXboxoneHlsUpgrade(store),
  WebIosPlayback(store),
  WebFeaturedRow(store),
  WebHlsUpgrade(store),
  WebLastVideoResourceRetry(store),
  WebLinearPlayerPip(store),
  WebPersonalizationPrompt(store),
  WebCelebrityYmal(store),
  WebQrReferralsPausescreen(store),
  WebRegistrationPlayerGate(store),
  WebRemoveLandingPage(store),
  /* pause ads */
  OTTVizioPauseAds(store),
  OTTComcastPauseAds(store),
  OTTLgtvPauseAds(store),
  OTTSamsungPauseAds(store),
];

export default getExperiments;
