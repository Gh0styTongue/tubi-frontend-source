import type { FrameInfoForCertainLevel } from '@adrise/hls.js';
import type { Player, RenditionInfoForCertainLevel } from '@adrise/player';
import { PlayerName, PLAYER_EVENTS } from '@adrise/player';

import { trackUnknownResolution, trackRenditionAndFrameInfo } from 'client/features/playback/track/client-log';
import { FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';

import { BasePlayerManager } from './BasePlayerManager';
import { convertResolutionToRenditionEnum, Rendition } from '../utils/convertResolutionToRenditionEnum';

interface BaseInfo {
  width: number;
  height: number;
  renditionType: Rendition;
  codec: VIDEO_RESOURCE_CODEC;
}
interface FrameInfo extends BaseInfo {
  fps?: string;
  decodedFrames: number;
  droppedFrames: number;
}

interface RenditionInfo extends BaseInfo {
  bitrate: string;
  // in seconds
  duration: number;
}

export type RenditionFrameData = Partial<FrameInfo & RenditionInfo>;

interface RenditionAndFrameInfoManagerOptions {
    player: Player;
    contentId: string;
}

export class RenditionAndFrameInfoManager extends BasePlayerManager<Player> {

  private contentId: string;

  private renditionFrameData: Record<string, RenditionFrameData> = {};

  constructor({
    player,
    contentId,
  }: RenditionAndFrameInfoManagerOptions) {
    super({ player });
    this.contentId = contentId;
  }

  destroy = () => {
    this.flushRenditionAndFrameInfo();
    super.destroy();
  };

  // This method is called when:
  // 1. auto-play
  // 2. exit player page
  // 3. play ad
  flushRenditionAndFrameInfo = () => {
    this.updateFrameInfo();
    this.updateRenditionInfo();
    this.trackRenditionAndFrameInfo();
    this.resetRenditionAndFrameInfo();
  };

  private resetRenditionAndFrameInfo = () => {
    this.renditionFrameData = {};
  };

  private updateFrameInfo = () => {
    const { player } = this;
    if (!player) return;
    const frameInfo: FrameInfoForCertainLevel[] = player.getFrameInfo?.() || [];
    if (frameInfo.length <= 0) return;
    frameInfo.forEach(item => {
      const { resolution = '', codec, decodedFrames, droppedFrames, fps } = item;
      const [width, height] = resolution.split('x').map(Number);
      const renditionType = convertResolutionToRenditionEnum(this.contentId, [width, height]);
      const levelCodec = (codec && !codec.includes('avc')) ? VIDEO_RESOURCE_CODEC.HEVC : VIDEO_RESOURCE_CODEC.AVC;
      const key = `${resolution}_${levelCodec}`;
      if (!this.renditionFrameData[key]) {
        this.renditionFrameData[key] = {
          width,
          height,
          renditionType,
          codec: levelCodec,
        };
      }
      const frameInfo = this.renditionFrameData[key];
      frameInfo.fps = frameInfo.fps ?? fps;
      frameInfo.decodedFrames = frameInfo.decodedFrames ?? 0;
      frameInfo.droppedFrames = frameInfo.droppedFrames ?? 0;

      frameInfo.decodedFrames += decodedFrames;
      frameInfo.droppedFrames += droppedFrames;
    });
  };

  private updateRenditionInfo = () => {
    const renditionInfo: RenditionInfoForCertainLevel[] = this.player?.getRenditionInfo?.() || [];
    if (renditionInfo.length <= 0) return;
    renditionInfo.forEach(item => {
      const { rendition, codec, startTime, endTime } = item;
      /* istanbul ignore next */
      const [resolution = '', bitrate = ''] = rendition?.split('@') ?? [];
      const [width, height] = resolution.split('x').map(Number);
      const levelCodec = (codec && !codec.includes('avc')) ? VIDEO_RESOURCE_CODEC.HEVC : VIDEO_RESOURCE_CODEC.AVC;
      const key = `${resolution}_${levelCodec}`;
      const duration = Math.floor((endTime - startTime) / 1000);
      const renditionType = convertResolutionToRenditionEnum(this.contentId, [width, height]);
      if (renditionType === Rendition.RENDITION_UNKNOWN && Math.random() < 0.1) {
        trackUnknownResolution(this.contentId, width, height);
      }
      if (!this.renditionFrameData[key]) {
        this.renditionFrameData[key] = {
          width,
          height,
          renditionType,
          codec: levelCodec,
        };
      }
      const renditionInfo = this.renditionFrameData[key];
      renditionInfo.bitrate = renditionInfo.bitrate ?? bitrate;
      renditionInfo.duration = renditionInfo.duration ?? 0;

      renditionInfo.duration += duration;
    });
  };

  private trackRenditionAndFrameInfo = () => {
    const renditionFrameData = Object.values(this.renditionFrameData);
    if (renditionFrameData.length === 0) return;
    trackRenditionAndFrameInfo(this.contentId, renditionFrameData);
  };
}

export function attachRenditionAndFrameInfoManager(player: Player, contentId: string) {
  if (player.playerName !== PlayerName.VOD) return FREEZED_EMPTY_FUNCTION;
  const manager = new RenditionAndFrameInfoManager({ player, contentId });
  player.on(PLAYER_EVENTS.adResponse, manager.flushRenditionAndFrameInfo);
  player.on(PLAYER_EVENTS.remove, manager.destroy);
  return () => {
    player.removeListener(PLAYER_EVENTS.adResponse, manager.flushRenditionAndFrameInfo);
    player.removeListener(PLAYER_EVENTS.remove, manager.destroy);
    manager.destroy();
  };
}
