/* eslint-disable no-bitwise */
// Polyfill of TextDecoder. Implementation copied from id3.ts in hls.js
// And this is the original resource http://stackoverflow.com/questions/8936984/uint8array-to-string-in-javascript/22373197

let decoder: TextDecoder;

function getTextDecoder() {
  if (!decoder && window && typeof window.TextDecoder !== 'undefined') {
    decoder = new TextDecoder('utf-8');
  }

  return decoder;
}

export const utf8ArrayToStr = (
  array: Uint8Array,
  exitOnNull: boolean = false
): string => {
  const decoder = getTextDecoder();
  if (decoder) {
    const decoded = decoder.decode(array);

    if (exitOnNull) {
      // grab up to the first null
      const idx = decoded.indexOf('\0');
      return idx !== -1 ? decoded.substring(0, idx) : decoded;
    }

    // remove any null characters
    return decoded.replace(/\0/g, '');
  }

  const len = array.length;
  let c;
  let char2;
  let char3;
  let out = '';
  let i = 0;
  while (i < len) {
    c = array[i++];
    if (c === 0x00 && exitOnNull) {
      return out;
    } if (c === 0x00 || c === 0x03) {
      // If the character is 3 (END_OF_TEXT) or 0 (NULL) then skip it
      continue;
    }
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
      default:
    }
  }
  return out;
};
