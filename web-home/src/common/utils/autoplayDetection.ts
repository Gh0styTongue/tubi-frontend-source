export interface AutoplayOptions {
  muted?: boolean;
  timeout?: number;
}

// can also provide a timeout as a fail-safe in case play never resolves.
export const detectAutoplay = ({ muted = false, timeout = 0 }: AutoplayOptions) => new Promise<boolean>((resolve) => {
  if (__ISOTT__) resolve(true);
  // technically muted playback is always allowed, but I'm not sure about all browsers
  // so keeping muted as an optional param
  const video = document.createElement('video');
  // 0'ish length <1.2kb sample video
  video.src = 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAK21kYXTeAgBMYXZjNTguOTEuMTAwAEIgCMEYOCEQBGCMHCEQBGCMHAAAAv9tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAARgABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACKXRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAARgAAAAAAAAAAAAAAAQEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAC4AAAQAAAEAAAAAAaFtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAAKxEAAAMAFXEAAAAAAAtaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAFNvdW5kSGFuZGxlcgAAAAFMbWluZgAAABBzbWhkAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEQc3RibAAAAGpzdHNkAAAAAAAAAAEAAABabXA0YQAAAAAAAAABAAAAAAAAAAAAAgAQAAAAAKxEAAAAAAA2ZXNkcwAAAAADgICAJQABAASAgIAXQBUAAAAAAfQAAAAPswWAgIAFEhBW5QAGgICAAQIAAAAYc3R0cwAAAAAAAAABAAAAAwAABAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAMAAAABAAAAIHN0c3oAAAAAAAAAAAAAAAMAAAAXAAAABgAAAAYAAAAUc3RjbwAAAAAAAAABAAAALAAAABpzZ3BkAQAAAHJvbGwAAAACAAAAAf//AAAAHHNiZ3AAAAAAcm9sbAAAAAEAAAADAAAAAQAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTguNDUuMTAw';

  video.setAttribute('playsinline', 'true');
  video.autoplay = true;
  video.muted = muted;

  let timer: number;

  if (timeout > 0) {
    timer = window.setTimeout(() => {
      canPlay(false);
    }, timeout);
  }

  const canPlay = (state: boolean) => {
    if (timer) window.clearTimeout(timer);
    resolve(state);
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
  // Some browsers prior to 2019 (IE9) may not return a promise
  try {
    // attempt playback
    const play = video.play();
    play.then(() => {
      canPlay(true);
    }).catch(() => {
      // if playback fails, resolve with false.
      canPlay(false);
    });
  } catch {
    canPlay(false);
  }
});
