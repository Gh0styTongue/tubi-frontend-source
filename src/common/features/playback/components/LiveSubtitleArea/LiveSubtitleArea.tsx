import { PLAYER_EVENTS } from '@adrise/player';
import type { OTTCaptionsStyle, WebCaptionsStyle, WebMAFCaption } from '@adrise/player';
import classNames from 'classnames';
import unescape from 'lodash/unescape';
import type { FunctionComponent } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import WebVTT from 'client/features/playback/caption/webvtt';
import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { VIEWPORT_TYPE } from 'common/constants/constants';
import useAppSelector from 'common/hooks/useAppSelector';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { OTTCaptionSettingsState, WebCaptionSettingsState } from 'common/types/captionSettings';
import type StoreState from 'common/types/storeState';
import {
  computeCaptionStyle,
  computeWebCaptionStyles,
} from 'common/utils/captionTools';

interface LiveSubtitleAreaProps extends ReturnType<typeof mapStateToProps> {
  classname?: string;
  wrapper: LivePlayerWrapper | null;
  isMiniPlayer?: boolean;
  captionConfig: OTTCaptionSettingsState & WebCaptionSettingsState;
}

export const LiveSubtitleArea: FunctionComponent<LiveSubtitleAreaProps> = ({
  wrapper,
  captions,
  captionConfig,
  classname,
  isMiniPlayer = false,
}) => {
  const [lines, setLines] = useState<VTTCue[] | WebMAFCaption[]>([]);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const viewportType = useAppSelector(state => state.ui.viewportType);
  const isSmallViewPort = viewportType === VIEWPORT_TYPE.mobile;

  // On smaller breakpoints, positioning might overflow outside the screen
  // when user-preference font sizes are too big.
  const useDynamicPositions = !isMiniPlayer && !isSmallViewPort;

  function updateCaption() {
    /* istanbul ignore if */
    if (!wrapper) {
      return;
    }
    const activeCaptions = wrapper.getActiveCaptions(captions.language);
    /* istanbul ignore next */
    if (FeatureSwitchManager.isEnabled(['Player', 'LogCaption'])) {
      // eslint-disable-next-line no-console
      activeCaptions.forEach((cue) => console.log(cue));
    }
    setLines(activeCaptions);
  }

  useEffect(() => {
    if (!wrapper) {
      return;
    }
    wrapper.setCaptions(captions.enabled ? captions.language : '');
    if (captions.enabled === false) {
      return;
    }
    wrapper.addListener(PLAYER_EVENTS.time, updateCaption);
    return () => {
      wrapper.removeListener(PLAYER_EVENTS.time, updateCaption);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapper, captions]);

  const hasLines = !!lines.length;
  useEffect(() => {
    if (hasLines) {
      const overlay = overlayRef.current;
      return () => {
        // Clear captions on unmount
        if (useDynamicPositions && overlay) {
          WebVTT.processCues(window, [], overlay, true);
        }
      };
    }
  }, [useDynamicPositions, hasLines]);

  if (!wrapper || !captions.enabled || lines.length === 0) {
    return null;
  }

  let captionStyle: OTTCaptionsStyle | WebCaptionsStyle;
  if (__ISOTT__) {
    captionStyle = computeCaptionStyle((captionConfig as OTTCaptionSettingsState).byId);
  } else {
    captionStyle = computeWebCaptionStyles(captionConfig as WebCaptionSettingsState);
  }

  if (useDynamicPositions && overlayRef.current) {
    WebVTT.processCues(window, lines as VTTCue[], overlayRef.current, true, captionStyle);
  }

  const classes = classNames(classname, {
    dynamicSubtitles: useDynamicPositions,
  });

  // Used when rendering statically positioned subtitles (bottom middle of screen)
  const renderStaticSubtitles = (lines: VTTCue[] | WebMAFCaption[]) => <div className="subtitleWindow" data-test-id="subtitleWindow" style={captionStyle.window}>
    <span style={captionStyle.font}>
      {unescape(lines.map(({ text }) => text).join(' '))}
    </span>
  </div>;

  return useDynamicPositions
    ? <div ref={overlayRef} className={classes} dangerouslySetInnerHTML={{ __html: '' }} />
    : <div className={classes}>
      {renderStaticSubtitles(lines)}
    </div>;
};

export const mapStateToProps = (state: StoreState) => {
  const {
    captionSettings,
  } = state;
  return {
    captions: captionSettings.defaultCaptions,
    captionConfig: captionSettings,
  };
};

export default connect(mapStateToProps)(LiveSubtitleArea);
