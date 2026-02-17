import type { PlayerListeners } from '@adrise/player';

// https://www.notion.so/tubi/Common-Production-Error-Info-95b31da7824649f6a63bb55f2ce8d6b4 top 20 common errors
const mockHLSError = {
  fragLoadError: {
    type: 'networkError',
    details: 'fragLoadError',
    fatal: true,
    response: {
      url: 'https://xxxx.tubi.video/7d81a773-a3a8-427c-a767-83fcf86f8dd5/xujurn87.mp4',
      code: 0,
      text: '',
    },
  },
  fragLoadTimeOut: {
    type: 'networkError',
    details: 'fragLoadTimeOut',
    fatal: true,
  },
  bufferStalledError: {
    type: 'mediaError',
    details: 'bufferStalledError',
    fatal: true,
  },
  keyLoadError: {
    type: 'networkError',
    details: 'fragLoadTimeOut',
    fatal: true,
    response: {
      url: 'https://xxxx.tubi.video/7d81a773-a3a8-427c-a767-83fcf86f8dd5/xujurn87.mp4',
      code: 0,
      text: '',
    },
  },
  bufferAppendError: {
    type: 'mediaError',
    details: 'bufferAppendError',
    fatal: true,
    reason:
      'Error Chunk:{sn:101;length:32077;type:audio}","sub_error":"Failed to execute \'appendBuffer\' on \'SourceBuffer\': The HTMLMediaElement.error attribute is not null.',
  },
  keySystemNoAccess: {
    type: 'keySystemError',
    details: 'keySystemNoAccess',
    fatal: true,
    error: new Error('Unsupported keySystem or supportedConfigurations'),
  },
  levelLoadError: {
    type: 'networkError',
    details: 'levelLoadError',
    fatal: true,
    response: {
      url: 'https://xxxx.production-public.tubi.io/1b2e3003-7e20-4435-b2f2-d72d581c3462/8bo69x8v.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cHM6Ly9ha2FtYWkyLnR1YmkudmlkZW8iLCJjb3VudHJ5IjoiVVMiLCJkZXZpY2VfaWQiOiI0ODhiZDk0Yi0xNzFkLTQyMzMtOWQ4Ni0xNjQxZDYxYzc3YTUiLCJleHAiOjE2OTQ4NDU1MDAsInBsYXRmb3JtIjoiQU1BWk9OIiwidXNlcl9pZCI6MTUxNjQwMjB9.Atjy6xbQgIMmvDd9_OwRv955hb6vP_B_NSE1SvBjhjI&manifest=true',
      code: 0,
      text: '',
    },
  },
  manifestLoadError: {
    type: 'networkError',
    details: 'manifestLoadError',
    fatal: true,
    response: {
      url: 'https://xxxxx.production-public.tubi.io/06d57626-e5e9-4d52-acd6-0bd792a49e9f/zq70pkld0j.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjZG5fcHJlZml4IjoiaHR0cHM6Ly9ha2FtYWkudHViaS52aWRlbyIsImNvdW50cnkiOiJVUyIsImRldmljZV9pZCI6IjRhMmE5NmRiLTBmNmMtNDQ4NC1hZjcyLTczNDMzNDliMTlkZCIsImV4cCI6MTY5NDg1MDYwMCwicGxhdGZvcm0iOiJBTUFaT04iLCJ1c2VyX2lkIjowfQ.ip8xjFGZU6vRQTrhdeBU4P_PVgz8d1A7q1vEU9rtdQ4&manifest=true',
      code: 0,
      text: '',
    },
  },
  levelLoadTimeOut: {
    code: 'networkError',
    message: 'levelLoadTimeOut',
    fatal: true,
  },
  fragParsingError: {
    type: 'mediaError',
    message: 'fragParsingError',
    fatal: true,
    reason: 'Failed to find demuxer by probing fragment data',
  },
};

const mockPlayerError = {
  playInterruptedError: {
    type: 'mediaError',
    code: 20,
    message: 'The play() request was interrupted by a call to pause(). https://goo.gl/LdLk22',
    fatal: true,
  },
  HDCP_INCOMPLIANCE: {
    type: 'DRM',
    code: 'DRM',
    message: 'HDCP_INCOMPLIANCE',
    originalMessage: 'PIPELINE_ERROR_DECODE: audio decoder failed',
    hasMediaKeys: false,
    fatal: true,
  },
  pipelineErrorDecode: {
    type: 'mediaError',
    code: 'MEDIA_ERR_DECODE',
    message: 'PIPELINE_ERROR_DECODE: video decoder reinitialization failed',
    fatal: true,
  },
  chunkDemuxerError: {
    type: 'mediaError',
    code: 'MEDIA_ERR_DECODE',
    message: 'CHUNK_DEMUXER_ERROR_APPEND_FAILED: Failed to prepare video sample for decode',
    fatal: true,
  },
};

const MockErrorData = {
  ...mockHLSError,
  ...mockPlayerError,
};

const triggerMockError = (key: string) => {
  try {
    if (mockHLSError[key]) {
      window.Tubi?.player?.adapter.extension?.hls.trigger('hlsError' as any, mockHLSError[key]);
    } else if (key === 'playInterruptedError') {
      const videoElement = window.Tubi?.player?.adapter.videoElement;
      if (videoElement) {
        videoElement.currentTime += 100;
      }
      window.Tubi?.player?.adapter.play();
      Promise.resolve().then(() => {
        videoElement?.pause();
      });
    } else if (mockPlayerError[key]) {
      window.Tubi?.player?.adapter.videoElement.pause();
      window.Tubi?.player?.adapter.emit('tb_error' as keyof PlayerListeners, mockPlayerError[key]);
    } else {
      throw new Error('error not in mock data');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Could not trigger mock error', err);
  }
};

const MockOTTErrorService = {
  listErrorType() {
    // eslint-disable-next-line no-console
    console.log(MockErrorData);
  },

  getAllErrorTypes() {
    const allErrorTypes = {};
    Object.keys(MockErrorData).forEach(key => {
      allErrorTypes[key] = key;
    });
    return allErrorTypes;
  },
  triggerMockError,
};

export default MockOTTErrorService;
