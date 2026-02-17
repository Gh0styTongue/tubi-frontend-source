import type {
  Player,
  AdapterConfig,
  ErrorEventData,
  PlayerConfig,
  DrmKeySystem,
  RequestProcessBeforeFetchType } from '@adrise/player';
import {
  PlayerName,
  AdapterTypes,
  State,
  formatSamsungUrl,
} from '@adrise/player';
import type Html5Adapter from '@adrise/player/lib/adapters/html5';
import type SamsungAdapter from '@adrise/player/lib/adapters/samsung';
import type WebAdapter from '@adrise/player/lib/adapters/web';
import type {
  OTTCaptionSettingsState,
  WebCaptionSettingsState,
} from '@adrise/player/lib/captionSettings';
import {
  isHls,
  isDash,
} from '@adrise/player/lib/utils/tools';
import type { AnalyticsConfigProps } from '@tubitv/analytics/lib/baseTypes';
import classNames from 'classnames';
import type { RefObject } from 'react';
import React, { Component, createRef, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import { nativeErrorTransformer } from 'client/features/playback/error/transformer';
import type { setup } from 'client/features/playback/monitor/monitoring';
import { setupYoubora } from 'client/features/playback/monitor/setupYoubora';
import { createPlayer, attachPlayerEvents } from 'client/features/playback/tubiPlayer';
import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import { exposeToTubiGlobal, type TubiGlobalPlayer } from 'client/global';
import systemApi from 'client/systemApi';
import { isCrawler } from 'client/utils/isCrawler';
import { ACTION_PROMISE_TIMEOUT } from 'common/constants/player';
import type SuitestPlayerAdapter from 'common/features/playback/components/SuitestPlayerAdapter/SuitestPlayerAdapter';
import { YouboraContentTypes } from 'common/features/playback/constants/youbora';
import { withPlayerExtensionAndExperimentalConfig } from 'common/features/playback/HOCs/withPlayerExtensionAndExperimentalConfig';
import type { WithPlayerExtensionAndExperimentalConfigProps } from 'common/features/playback/HOCs/withPlayerExtensionAndExperimentalConfig';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getCachedVideoResourceManager } from 'common/features/playback/services/VideoResourceManager';
import { getTrailer } from 'common/features/playback/utils/getTrailer';
import { getVideoProps } from 'common/features/playback/utils/getVideoProps';
import type { VideoProps } from 'common/features/playback/utils/getVideoProps';
import logger from 'common/helpers/logging';
import type { PlaybackComponentExperimentProps } from 'common/HOCs/withExperiment';
import useAppSelector from 'common/hooks/useAppSelector';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { isYouboraEnabled } from 'common/selectors/experiments/remoteConfig';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { UserAgent } from 'common/types/ui';
import type { Video, VideoResource } from 'common/types/video';
import { getDefaultAudioTrackInfo } from 'common/utils/audioTracks';
import { getCaptionStyles, internationalizeSubtitleLabels } from 'common/utils/captionTools';

import { prepareSubtitleUrls } from './prepareSubtitleUrls';
import styles from './VideoPlayer.scss';
import { getPlayerHTMLString } from '../../utils/getPlayerAdapter';

export interface VideoPlayerProps extends
  PlaybackComponentExperimentProps,
  WithPlayerExtensionAndExperimentalConfigProps {
    autoStart?: boolean,
    getAutoStart?: () => boolean,
    performanceCollectorEnabled?: boolean;
    poster?: string,
    prerollUrl?: string,
    reuseVideoElement?: boolean;
    upcomingCuePoint?: number;
    preload?: AdapterConfig['preload'];
    enableVideoSessionCollect?: boolean
    forceFetchPolyfill?: boolean;
    dispatch?: TubiThunkDispatch;
    tryFallbackVideoResource?: (error: ErrorEventData, position?: number) => VideoResource | undefined;
    playerErrorHandle?: (error: ErrorEventData) => void;
    adRequestPreProcessor?: RequestProcessBeforeFetchType;
    allowReuse?: boolean;
    analyticsConfig: AnalyticsConfigProps;
    data: Video,
    captionSettings: WebCaptionSettingsState | OTTCaptionSettingsState;
    cls?: string,
    customAdapter?: AdapterTypes;
    drmKeySystem?: DrmKeySystem;
    enableCapLevelOnFSPDrop?: boolean;
    enableFrontBufferFlush?: boolean;
    enableReposition?: boolean;
    isSeriesContent?: boolean;
    isDRMSupported?: boolean;
    onPlayerCreate: (player: Player, playerManagers?: PlayerManagers) => void,
    playerName: PlayerConfig['playerName'];
    title?: string,
    userId?: number;
    userAgent?: UserAgent;
    useHlsNext?: boolean;
}

interface PropsFromFunctionalWrapper {
  enableYouboraMonitoring?: boolean;
  deviceId: string | undefined;
  intl: IntlShape;
  customAdapterInstance: AdapterType | undefined;
  player: InstanceType<typeof Player> | undefined;
}

type VideoPlayerClassComponentProps = VideoPlayerProps & PropsFromFunctionalWrapper;

interface OwnState {
  prerollUrl?: string;
}

type AdapterType = typeof WebAdapter | typeof SamsungAdapter | typeof Html5Adapter;
// This component is compatible with tubi player pkg
class VideoPlayerClassComponent extends Component<VideoPlayerClassComponentProps, OwnState> {
  private monitoring?: ReturnType<typeof setup>;

  private isUnmounted = false;

  private suitestPlayerAdapter?: SuitestPlayerAdapter;

  private playerContainerRef: RefObject<HTMLDivElement>;

  private videoResourceManagerV2?: VideoResourceManager;

  static loadCustomAdapter = async (adapterType: AdapterTypes): Promise<AdapterType | undefined> => {
    switch (adapterType) {
      case AdapterTypes.WEB: {
        const { default: adapter } = await import(/* webpackChunkName: "web-adapter" */'@adrise/player/lib/adapters/web');
        const Adapter = adapter;
        return Adapter;
      }
      case AdapterTypes.SAMSUNG: {
        const { default: adapter } = await import(/* webpackChunkName: "samsung-adapter" */'@adrise/player/lib/adapters/samsung');
        const Adapter = adapter;
        return Adapter;
      }
      case AdapterTypes.HTML5: {
        const { default: adapter } = await import(/* webpackChunkName: "html5-adapter" */'@adrise/player/lib/adapters/html5');
        const Adapter = adapter;
        return Adapter;
      }
      default: {
        break;
      }
    }
  };

  static getDerivedStateFromProps(nextProps: VideoPlayerClassComponentProps, prevState: OwnState) {
    if (nextProps.prerollUrl !== prevState.prerollUrl) {
      if (nextProps.player && nextProps.prerollUrl) {
        nextProps.player.setPrerollUrl(nextProps.prerollUrl);
      }
      return {
        prerollUrl: nextProps.prerollUrl,
      };
    }
    return null;
  }

  constructor(props: VideoPlayerClassComponentProps) {
    super(props);
    this.state = {
      prerollUrl: props.prerollUrl,
    };
    this.playerContainerRef = createRef<HTMLDivElement>();
  }

  componentDidMount() {
    const { customAdapter } = this.props;
    // Disable player setup for crawler
    if (__WEBPLATFORM__ === 'WEB' && isCrawler()) {
      return;
    }
    if (!customAdapter) {
      this.buildPlayer().catch((error) => logger.error(error, 'Error thrown while building player'));
    }

  }

  componentDidUpdate(_prevProps: VideoPlayerClassComponentProps) {
    const { customAdapter } = this.props;
    /* istanbul ignore else */
    if (customAdapter && !_prevProps.customAdapterInstance && this.props.customAdapterInstance) {
      this.buildPlayer().catch((error) => logger.error('Error thrown while re-building player', error));
    }
  }

  shouldComponentUpdate(nextProps: VideoPlayerClassComponentProps) {
    /* istanbul ignore next: branch has been covered, the optional-chaining operator is not needed to be check */
    if (!this.props.autoStart && nextProps.autoStart && this.props.player?.getState() === State.idle) {
      // If the playback has not started and the auto start changes back to true. We start to play.
      this.props.player.play();
    }
    // To support isReusable prop in PreviewPlayer
    if (nextProps.allowReuse && this.props.videoPreviewUrl !== nextProps.videoPreviewUrl) {
      this.setMediaSrc(nextProps.videoPreviewUrl, nextProps);
    }
    // @note: we will never re-render the component, instead we may manipulate player in componentWillReceiveProps
    // With one exception: the component need re-render once if `customAdapter` is specified
    if (!this.props.customAdapterInstance && nextProps.customAdapterInstance) {
      return true;
    }
    return false;
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    exposeToTubiGlobal({ player: undefined });
    /* istanbul ignore next: branch has been covered, the optional-chaining operator is not needed to be check */
    this.monitoring?.remove();
    const { player } = this.props;
    if (player) {
      player.remove();
    }
    /* istanbul ignore next: branch covered, optianal chain need  */
    this.suitestPlayerAdapter?.remove();
  }

  getContentType = () => {
    const { trailerId, videoPreviewUrl, isSeriesContent } = this.props;
    if (trailerId || typeof trailerId === 'number') return YouboraContentTypes.TRAILER;
    if (videoPreviewUrl) return YouboraContentTypes.PREVIEW;
    if (isSeriesContent) return YouboraContentTypes.EPISODE;
    return YouboraContentTypes.MOVIE;
  };

  setupYouboraMonitoring = async (player: Player) => {
    const {
      data,
      userId,
      playerName,
      youboraExperimentMap,
      title,
      deviceId,
      enableYouboraMonitoring,
    } = this.props;
    if (!enableYouboraMonitoring) return;
    const videoResource = this.getVideoResource();

    const { id: contentId, lang, duration } = data;

    /* istanbul ignore next */
    this.monitoring?.remove();
    this.monitoring = await setupYoubora(player, {
      deviceId: deviceId!,
      contentId,
      contentType: this.getContentType(),
      duration,
      lang,
      videoResourceType: videoResource?.type,
      videoResourceCodec: videoResource?.codec,
      title: !!title && title !== data.title ? `${title} ${data.title}` : data.title,
      userId,
      titanVersion: videoResource?.titan_version,
      generatorVersion: videoResource?.generator_version,
      playerName,
      youboraExperimentMap: youboraExperimentMap!,
      ignoreShortBuffering: true,
    });
  };

  getVideoResource = () => {
    const {
      enableReposition,
      videoResource,
    } = this.props;
    if (enableReposition) {
      return this.videoResourceManagerV2?.getCurrentResource();
    }
    return videoResource;
  };

  async buildPlayer() {
    /* istanbul ignore if: can not be mocked during render */
    if (!this.playerContainerRef.current) {
      throw new Error('Miss player container during setup');
    }
    const {
      resumePos = 0,
      data,
      trailerId,
      prerollUrl,
      onPlayerCreate,
      autoStart = false,
      poster,
      experimentalConfig,
      extensionConfig,
      reuseVideoElement,
      performanceCollectorEnabled,
      playerName,
      videoPreviewUrl,
      preload,
      enableVideoSessionCollect,
      youboraExperimentMap,
      dispatch,
      tryFallbackVideoResource,
      playerErrorHandle,
      getAutoStart,
      adRequestPreProcessor,
      isDRMSupported,
      drmKeySystem,
      enableReposition,
      useHlsNext,
    } = this.props;

    const playerManagers: PlayerManagers = {};
    const { id, trailers = [] } = data;
    const isTrailer = !!(trailerId || typeof trailerId === 'number');
    const isVideoPreview = !!videoPreviewUrl;

    if (!isTrailer && !isVideoPreview && enableReposition) {
      playerManagers.videoResourceManagerV2 = this.videoResourceManagerV2 = getCachedVideoResourceManager({
        videoResources: data.video_resources ?? [],
        drmKeySystem,
        isDRMSupported: !!isDRMSupported,
        rememberFallback: true,
      });
    }

    const videoResource = this.getVideoResource();

    let mediaProps: VideoProps;
    if (isTrailer) {
      mediaProps = getTrailer(trailers, trailerId);
    } else if (isVideoPreview) {
      mediaProps = {
        mediaUrl: videoPreviewUrl,
      };
    } else {
      mediaProps = getVideoProps(videoResource);
    }

    const captionsConfig = this.getCaptionsConfig(isTrailer || isVideoPreview || playerName === PlayerName.AD);

    const deviceMemory = (systemApi.getDeviceMemory && systemApi.getDeviceMemory()) || 0;

    const forceFetchPolyfill = __SHOULD_POLYFILL_FETCH_IN_PLAYER__;
    const defaultAudioTrack = getDefaultAudioTrackInfo();

    // createPlayer selects the adapter, instantiates the Player module,
    // attaches functional events, and attaches player metric events
    const player = createPlayer({
      Adapter: this.props.customAdapterInstance,
      playerContainer: this.playerContainerRef.current,
      contentId: id,
      autoStart,
      getAutoStart,
      ...captionsConfig,
      resumePosition: resumePos,
      poster,
      preload,
      prerollUrl,
      defaultAudioTrack,
      extensionConfig,
      experimentalConfig: {
        ...experimentalConfig,
        enableHlsDetachDuringAds: experimentalConfig?.enableHlsDetachDuringAds,
      },
      nativeErrorTransformer,
      systemData: {
        deviceMemory,
        systemVersion: undefined,
      },
      needAutoplayAttributeOnVideoElement: __OTTPLATFORM__ === 'VIZIO' || __OTTPLATFORM__ === 'FIRETV_HYB',
      reuseVideoElement,
      performanceCollectorEnabled,
      actionsTimeout: ACTION_PROMISE_TIMEOUT[__OTTPLATFORM__],
      ...mediaProps,
      enableVideoSessionCollect,
      playerName,
      isSDKUpgrade: useHlsNext,
      getVideoResource: this.getVideoResource,
      forceFetchPolyfill,
      dispatch,
      tryFallbackVideoResource,
      playerErrorHandle,
      adRequestPreProcessor,
      youboraExperimentMap,
    }, playerManagers);
    exposeToTubiGlobal({ player: player as unknown as TubiGlobalPlayer });
    onPlayerCreate(player, playerManagers);

    await this.setupYouboraMonitoring(player);

    // if not unmounted while waiting for youbora
    if (!this.isUnmounted) {
      await player.setup();
    }

    // if unmounted while setting up player
    if (this.isUnmounted) {
      player.remove();
    }

    /* istanbul ignore next */
    if (__OTTPLATFORM__ === 'TIZEN' && window.suitest) {
      const SuitestAdapter: typeof SuitestPlayerAdapter = require('../SuitestPlayerAdapter/SuitestPlayerAdapter').default;
      this.suitestPlayerAdapter = new SuitestAdapter(player);
    }
  }

  async setMediaSrc(url: string = '', nextProps: VideoPlayerClassComponentProps) {
    const { player } = this.props;
    const {
      data: { id },
      playerName,
      enableVideoSessionCollect,
    } = nextProps;
    /* istanbul ignore next */
    if (!player || !url) return;

    if (isHls(url) || isDash(url)) return;

    // Re-setup youbora when setting new media src
    await this.setupYouboraMonitoring(player);

    attachPlayerEvents(player, {
      getVideoResource: this.getVideoResource,
      enableVideoSessionCollect,
      contentId: id,
      playerName,
    });

    player.setMediaSrc(url);
  }

  getCaptionsConfig(isCaptionDisabled: string | number | boolean) {
    if (isCaptionDisabled) {
      return {
        subtitles: [],
      };
    }

    const { data, captionSettings, intl } = this.props;
    const { subtitles: rawSubtitles = [] } = data;
    const { defaultCaptions } = captionSettings;
    let subtitles = prepareSubtitleUrls(rawSubtitles);

    if (__OTTPLATFORM__ === 'TIZEN') {
      subtitles = subtitles.map(subtitle => ({
        ...subtitle,
        url: formatSamsungUrl(subtitle.url),
      }));
    }
    const captionStyles = getCaptionStyles(captionSettings);
    return {
      captionsStyles: captionStyles,
      defaultCaptions: defaultCaptions.enabled ? defaultCaptions.language : 'Off',
      subtitles: internationalizeSubtitleLabels(subtitles, intl),
    };
  }

  /**
   * render just returns the element. we pass this element #jwContainer to jw api to place the player
   */
  render() {
    const className = classNames(styles.playerSkin, {
      [styles.videoPreview]: !!this.props.videoPreviewUrl,
    });
    // we do this to deal with jwplayer or samsungplayer removing the data-reactid and react being unable to find its element
    const htmlString = this.props.customAdapter && this.props.customAdapterInstance
      ? this.props.customAdapterInstance.htmlString
      : getPlayerHTMLString();
    /* istanbul ignore next */
    return (
      <div className={className} dangerouslySetInnerHTML={{ __html: htmlString ?? '' }} ref={this.playerContainerRef} data-test-id="video-player-container" />
    );
  }
}

const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const { customAdapter, onPlayerCreate } = props;
  const intl = useIntl();
  const deviceId = useAppSelector(deviceIdSelector);
  const [customAdapterInstance, setCustomAdapterInstance] = useState<AdapterType>();
  const [player, setPlayer] = useState<Player>();
  const enableYouboraMonitoring = useAppSelector((state) => isYouboraEnabled(props.playerName, state));
  const onPlayerCreateAndPlayerSet = useCallback((player: Player) => {
    setPlayer(player);
    onPlayerCreate(player);
  }, [onPlayerCreate]);
  useEffect(() => {
    if (customAdapter) {
      VideoPlayerClassComponent.loadCustomAdapter(customAdapter).then((instance) => {
        setCustomAdapterInstance(() => instance);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <VideoPlayerClassComponent
      {...props}
      deviceId={deviceId}
      intl={intl}
      customAdapterInstance={customAdapterInstance}
      enableYouboraMonitoring={enableYouboraMonitoring}
      onPlayerCreate={onPlayerCreateAndPlayerSet}
      player={player}
    />);

};

export default withPlayerExtensionAndExperimentalConfig(
  VideoPlayer
);
