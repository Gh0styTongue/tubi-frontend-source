/* eslint-disable no-bitwise */
import { debug } from '@adrise/player/lib/utils/tools';

interface SimpleTextDecoder {
  decode(input?: ArrayBuffer | ArrayBufferView): string;
}

// eslint-disable-next-line import/no-unused-modules
export function getTextDecoder(label?: string): SimpleTextDecoder {
  const g: any = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? (window as any) : (/* istanbul ignore next */ typeof global !== 'undefined' ? (global as any) : {}));
  if (typeof g.TextDecoder !== 'undefined') {
    return new g.TextDecoder(label);
  }
  class NodeTextDecoder {
    private encoding: string;
    constructor(lbl?: string) {
      const enc = (lbl || 'utf-8').toLowerCase();
      if (enc === 'utf-8' || enc === 'utf8') this.encoding = 'utf8';
      else if (enc === 'utf-16' || enc === 'utf-16le') this.encoding = 'utf16le';
      else if (enc === 'latin1') this.encoding = 'latin1';
      else if (enc === 'utf-16be') this.encoding = 'utf-16be';
      else this.encoding = 'utf8';
    }
    decode(input?: ArrayBuffer | ArrayBufferView): string {
      if (!input) return '';
      if (this.encoding === 'utf-16be') {
        throw new Error('utf-16be not supported in polyfill');
      }
      const u8 = input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : ArrayBuffer.isView(input)
          ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
          : new Uint8Array();
      if (typeof Buffer !== 'undefined' && Buffer.from) {
        return Buffer.from(u8).toString(this.encoding as any);
      }
      let out = '';
      u8.forEach((byte) => { out += String.fromCharCode(byte); });
      return out;
    }
  }
  return new (NodeTextDecoder as any)(label) as SimpleTextDecoder;
}

interface EmsgBox {
  id: number;
  timestamp: number;
  schemeIdUri: string;
  value: string;
  timescale: number;
  presentationTime: number;
  eventDuration: number;
  messageData: ArrayBuffer;
  id3Frames?: ID3Frame[];
}

type ID3BinaryPayload = { type: 'binary'; size: number; data: string };
type ID3PrivatePayload = { owner: string; data: string };
type ID3UserTextPayload = { description: string; value: string };
type ID3CommentPayload = { language: string; description: string; text: string };
type ID3UserUrlPayload = { description: string; url: string };

type ID3FrameData =
  | string
  | ID3BinaryPayload
  | ID3PrivatePayload
  | ID3UserTextPayload
  | ID3CommentPayload
  | ID3UserUrlPayload;

const enum ID3TextEncoding {
  ISO_8859_1 = 0,
  UTF16_WITH_BOM = 1,
  UTF16_BE = 2,
  UTF8 = 3,
}

interface ID3Frame {
  type: string;
  size: number;
  flags: {
    tagAlterPreservation: boolean;
    fileAlterPreservation: boolean;
    readOnly: boolean;
    groupingIdentity: boolean;
    compression: boolean;
    encryption: boolean;
    unsynchronisation: boolean;
    dataLengthIndicator: boolean;
  };
  data: ID3FrameData;
}

export class EmsgParser {
  private static log = (...args: any[]) => {
    debug('Apollo')(...args);
  };

  private static parseEmsgBox(data: ArrayBuffer, timestamp: number): EmsgBox | null {
    const view = new DataView(data);

    try {
      // Parse EMSG box header (MP4 boxes are big-endian)
      let offset = 0;
      offset += 4;

      const type = getTextDecoder().decode(data.slice(offset, offset + 4));
      offset += 4;

      if (type !== 'emsg') {
        this.log(`Expected 'emsg' box, got '${type}'`);
        return null;
      }

      const version = view.getUint8(offset);
      offset += 1;
      const flags = (view.getUint8(offset) << 16) |
              (view.getUint8(offset + 1) << 8) |
               view.getUint8(offset + 2);
      offset += 3;

      this.log(`EMSG version: ${version}, flags: 0x${flags.toString(16)}`);

      let schemeIdUri: string;
      let value: string;
      let timescale: number;
      let presentationTime: number;
      let eventDuration: number;
      let id: number = 0;

      if (version === 0) {
        // Version 0
        schemeIdUri = this.readNullTerminatedString(data, offset);
        offset += schemeIdUri.length + 1;

        value = this.readNullTerminatedString(data, offset);
        offset += value.length + 1;

        timescale = view.getUint32(offset); // big-endian
        offset += 4;

        presentationTime = view.getUint32(offset, false); // big-endian
        offset += 4;

        eventDuration = view.getUint32(offset, false); // big-endian
        offset += 4;

        id = view.getUint32(offset, false); // big-endian
        offset += 4;
      } else {
        // Version 1
        timescale = view.getUint32(offset, false); // big-endian
        offset += 4;

        // 64-bit presentation time for version 1 (big-endian)
        const ptHigh = view.getUint32(offset, false);
        const ptLow = view.getUint32(offset + 4, false);
        presentationTime = ptHigh * 2 ** 32 + ptLow;
        offset += 8;

        eventDuration = view.getUint32(offset, false); // big-endian
        offset += 4;

        id = view.getUint32(offset, false); // big-endian
        offset += 4;

        schemeIdUri = this.readNullTerminatedString(data, offset);
        offset += schemeIdUri.length + 1;

        value = this.readNullTerminatedString(data, offset);
        offset += value.length + 1;
      }

      const messageData = data.slice(offset);

      this.log(`EMSG parsed: schemeIdUri="${schemeIdUri}", value="${value}", timescale=${timescale}, presentationTime=${presentationTime}, eventDuration=${eventDuration}, id=${id}, messageDataSize=${messageData.byteLength}`);

      const emsgBox: EmsgBox = {
        id,
        timestamp,
        schemeIdUri,
        value,
        timescale,
        presentationTime,
        eventDuration,
        messageData,
      };

      // Try to parse ID3 frames if the message data contains ID3
      if (this.isID3Data(messageData)) {
        this.log('ID3 data detected, parsing frames...');
        emsgBox.id3Frames = this.parseID3Frames(messageData);
      }

      return emsgBox;
    } catch (error) {
      this.log('Error parsing EMSG box:', error);
      return null;
    }
  }

  private static readNullTerminatedString(buffer: ArrayBuffer, offset: number): string {
    const view = new Uint8Array(buffer);
    let end = offset;
    while (end < view.length && view[end] !== 0) {
      end++;
    }
    return getTextDecoder().decode(buffer.slice(offset, end));
  }

  static isID3Data(data: ArrayBuffer): boolean {
    const view = new Uint8Array(data);
    return view.length >= 3 &&
           view[0] === 0x49 && // 'I'
           view[1] === 0x44 && // 'D'
           view[2] === 0x33; // '3'
  }

  static parseID3Frames(data: ArrayBuffer): ID3Frame[] {
    const frames: ID3Frame[] = [];

    try {
      const view = new DataView(data);

      // Check for ID3 header
      if (view.byteLength < 10) {
        this.log('ID3 data too short (< 10 bytes)');
        return frames;
      }

      const id3Header = getTextDecoder().decode(data.slice(0, 3));
      if (id3Header !== 'ID3') {
        this.log(`Invalid ID3 header: "${id3Header}"`);
        return frames;
      }

      const version = view.getUint8(3);
      const revision = view.getUint8(4);
      const flags = view.getUint8(5);

      // Get tag size (synchsafe integer for ID3v2.4, regular for v2.3)
      let tagSize: number;
      if (version >= 4) {
        tagSize = this.readSynchsafeInt(view, 6);
      } else {
        tagSize = view.getUint32(6, false); // big-endian
      }

      this.log(`ID3 v2.${version}.${revision} tag found, flags: 0x${flags.toString(16)}, size: ${tagSize}`);

      let offset = 10; // Skip ID3 header

      const tagUnsynchronisation = (flags & 0x80) !== 0; // v2.4 header unsync flag

      // Handle extended header if present (flags & 0x40)
      if (flags & 0x40) {
        /* istanbul ignore else */
        if (offset + 4 <= view.byteLength) {
          const extHeaderSize = version >= 4
            ? this.readSynchsafeInt(view, offset)
            : view.getUint32(offset, false);
          this.log(`Extended header size: ${extHeaderSize}`);
          // For both v2.3 and v2.4, skip the size field itself plus the stated size
          offset += extHeaderSize + 4;
        }
      }

      // For v2.4, a footer (10 bytes) may be present (flags & 0x10).
      // The tag size excludes the 10-byte header and the optional footer.
      const footerBytes = (version >= 4 && (flags & 0x10)) ? 10 : 0;
      const endOffset = Math.min(10 + tagSize, Math.max(0, view.byteLength - footerBytes));
      this.log(`Parsing frames from offset ${offset} to ${endOffset}`);

      // Parse frames until end of tag
      while (offset < endOffset - 10) {
        // Frame header is 10 bytes for v2.3 and v2.4, 6 bytes for v2.2
        const headerSize = version >= 3 ? 10 : 6;
        /* istanbul ignore next - guard is unreachable due to while condition */
        if (offset + headerSize > endOffset) break;

        let frameId: string;
        let frameSize: number;
        let frameFlags: number = 0;

        if (version >= 3) {
          frameId = getTextDecoder().decode(data.slice(offset, offset + 4));
          frameSize = version >= 4
            ? this.readSynchsafeInt(view, offset + 4)
            : view.getUint32(offset + 4, false); // big-endian
          frameFlags = view.getUint16(offset + 8, false); // big-endian
        } else {
          // ID3v2.2 has 3-character frame IDs
          frameId = getTextDecoder().decode(data.slice(offset, offset + 3));
          frameSize = (view.getUint8(offset + 3) << 16) |
                     (view.getUint8(offset + 4) << 8) |
                      view.getUint8(offset + 5);
        }

        this.log(`Frame: ID="${frameId}", size=${frameSize}, flags=0x${frameFlags.toString(16)}`);

        // Check if frame ID is valid and size is reasonable
        const validFrameId = version >= 3
          ? frameId.match(/^[A-Z0-9]{4}$/)
          : frameId.match(/^[A-Z0-9]{3}$/);

        if (!validFrameId || frameSize <= 0 || offset + headerSize + frameSize > endOffset) {
          this.log(`Invalid or suspicious frame: ID="${frameId}", size=${frameSize}, breaking`);
          break;
        }

        const frameDataStart = offset + headerSize;
        let frameData = data.slice(frameDataStart, frameDataStart + frameSize);

        // v2.4 frame-level flags: handle data length indicator and unsynchronisation
        const frameUnsync = (frameFlags & 0x0002) !== 0;
        const hasDataLengthIndicator = (frameFlags & 0x0001) !== 0;
        if (hasDataLengthIndicator && frameData.byteLength >= 4) {
          // Skip the 4-byte synchsafe data length field
          frameData = frameData.slice(4);
        }
        if (tagUnsynchronisation || frameUnsync) {
          frameData = this.deUnsynchronise(frameData);
        }

        try {
          const parsedData = this.parseFrameData(frameId, frameData);

          frames.push({
            type: frameId,
            size: frameSize,
            flags: {
              tagAlterPreservation: (frameFlags & 0x8000) !== 0,
              fileAlterPreservation: (frameFlags & 0x4000) !== 0,
              readOnly: (frameFlags & 0x2000) !== 0,
              groupingIdentity: (frameFlags & 0x0040) !== 0,
              compression: (frameFlags & 0x0008) !== 0,
              encryption: (frameFlags & 0x0004) !== 0,
              unsynchronisation: (frameFlags & 0x0002) !== 0,
              dataLengthIndicator: (frameFlags & 0x0001) !== 0,
            },
            data: parsedData,
          });

          this.log(`Successfully parsed frame ${frameId}: ${JSON.stringify(parsedData).substring(0, 100)}`);
        } catch (error) {
          this.log(`Error parsing frame ${frameId}:`, error);
        }

        offset += headerSize + frameSize;
      }
    } catch (error) {
      this.log('Error parsing ID3 frames:', error);
    }

    this.log(`Parsed ${frames.length} ID3 frames`);
    return frames;
  }

  private static parseFrameData(frameId: string, data: ArrayBuffer): ID3FrameData {
    if (data.byteLength === 0) return '';

    const view = new DataView(data);

    try {
      // Text frames (most common)
      if (frameId.startsWith('T') && frameId !== 'TXXX') {
        /* istanbul ignore next - unreachable because of top-level zero-length guard */
        if (data.byteLength < 1) return '';
        const encoding = view.getUint8(0) as ID3TextEncoding;
        const text = this.decodeTextFrame(data.slice(1), encoding);
        this.log(`Text frame ${frameId}: encoding=${encoding}, text="${text}"`);
        return text;
      }

      // User-defined text frame
      if (frameId === 'TXXX') {
        /* istanbul ignore next - unreachable because of top-level zero-length guard */
        if (data.byteLength < 1) return '';
        const encoding = view.getUint8(0) as ID3TextEncoding;
        let offset = 1;

        // Find null terminator for description
        const descEnd = this.findNullTerminator(data, offset, encoding);
        const description = this.decodeTextFrame(data.slice(offset, descEnd), encoding);
        offset = descEnd + this.getTerminatorLength(encoding);

        const value = this.decodeTextFrame(data.slice(offset), encoding);
        return { description, value };
      }

      // Comment frame
      if (frameId === 'COMM') {
        if (data.byteLength < 4) return '';
        const encoding = view.getUint8(0) as ID3TextEncoding;
        const language = getTextDecoder().decode(data.slice(1, 4));
        let offset = 4;

        // Find null terminator for short description
        const descEnd = this.findNullTerminator(data, offset, encoding);
        const description = this.decodeTextFrame(data.slice(offset, descEnd), encoding);
        offset = descEnd + this.getTerminatorLength(encoding);

        const text = this.decodeTextFrame(data.slice(offset), encoding);
        return { language, description, text };
      }

      // URL frames
      if (frameId.startsWith('W') && frameId !== 'WXXX') {
        return getTextDecoder().decode(data);
      }

      // User-defined URL frame
      if (frameId === 'WXXX') {
        /* istanbul ignore next - unreachable because of top-level zero-length guard */
        if (data.byteLength < 1) return '';
        const encoding = view.getUint8(0) as ID3TextEncoding;
        let offset = 1;

        const descEnd = this.findNullTerminator(data, offset, encoding);
        const description = this.decodeTextFrame(data.slice(offset, descEnd), encoding);
        offset = descEnd + this.getTerminatorLength(encoding);

        const url = getTextDecoder().decode(data.slice(offset));
        return { description, url };
      }

      // Private frame
      if (frameId === 'PRIV') {
        const nullPos = this.findNullTerminator(data, 0, 0); // Latin-1
        const owner = getTextDecoder().decode(data.slice(0, nullPos));
        const privateData = data.slice(nullPos + 1);
        const bytes = new Uint8Array(privateData);
        return {
          owner,
          data: Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '),
        };
      }

      // For other frames, return hex representation with frame info
      const bytes = new Uint8Array(data);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
      return {
        type: 'binary',
        size: data.byteLength,
        data: hex.substring(0, 200) + (hex.length > 200 ? '...' : ''),
      };
    } catch (error) {
      /* istanbul ignore next - error logging */
      this.log(`Error parsing frame ${frameId}:`, error);
      /* istanbul ignore next - error fallback */
      const bytes = new Uint8Array(data);
      /* istanbul ignore next - error fallback */
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
    }
  }

  private static findNullTerminator(data: ArrayBuffer, start: number, encoding: ID3TextEncoding): number {
    const view = new Uint8Array(data);
    const terminatorLength = this.getTerminatorLength(encoding);

    for (let i = start; i <= data.byteLength - terminatorLength; i += terminatorLength) {
      if (terminatorLength === 1) {
        if (view[i] === 0) return i;
      } else {
        /* istanbul ignore next - rarely hit path */
        if (view[i] === 0 && view[i + 1] === 0) return i;
      }
    }
    /* istanbul ignore next - defensive default */
    return data.byteLength;
  }

  private static getTerminatorLength(encoding: ID3TextEncoding): number {
    if (encoding === 1 || encoding === 2) {
      return 2;
    }
    /* istanbul ignore next - default */
    return 1;
  }

  private static decodeTextFrame(data: ArrayBuffer, encoding: ID3TextEncoding): string {
    switch (encoding) {
      case ID3TextEncoding.ISO_8859_1: { // ISO-8859-1
        try {
          return getTextDecoder('latin1').decode(data).replace(/\0+$/, '');
        } catch (e) {
          // Fallback manual latin1 decode
          const bytes = new Uint8Array(data);
          let out = '';
          bytes.forEach((byte) => {
            out += String.fromCharCode(byte);
          });
          return out.replace(/\0+$/, '');
        }
      }
      case ID3TextEncoding.UTF16_WITH_BOM: { // UTF-16 with BOM
        return getTextDecoder('utf-16').decode(data).replace(/\0+$/, '');
      }
      case ID3TextEncoding.UTF16_BE: { // UTF-16 BE (no BOM)
        try {
          return getTextDecoder('utf-16be').decode(data).replace(/\0+$/, '');
        } catch (e) {
          // Fallback: swap to LE then decode
          const bytes = new Uint8Array(data);
          const swapped = new Uint8Array(bytes.length);
          for (let i = 0; i + 1 < bytes.length; i += 2) {
            swapped[i] = bytes[i + 1];
            swapped[i + 1] = bytes[i];
          }
          return getTextDecoder('utf-16le').decode(swapped).replace(/\0+$/, '');
        }
      }
      case ID3TextEncoding.UTF8: { // UTF-8
        return getTextDecoder('utf-8').decode(data).replace(/\0+$/, '');
      }
      default:
        return getTextDecoder().decode(data).replace(/\0+$/, '');
    }
  }

  private static readSynchsafeInt(view: DataView, offset: number): number {
    return (view.getUint8(offset) << 21) |
           (view.getUint8(offset + 1) << 14) |
           (view.getUint8(offset + 2) << 7) |
           view.getUint8(offset + 3);
  }

  private static deUnsynchronise(buffer: ArrayBuffer): ArrayBuffer {
    const input = new Uint8Array(buffer);
    const output: number[] = [];
    for (let i = 0; i < input.length; i++) {
      const current = input[i];
      if (current === 0xff && i + 1 < input.length && input[i + 1] === 0x00) {
        output.push(0xff);
        i += 1; // skip inserted 0x00
        continue;
      }
      output.push(current);
    }
    return new Uint8Array(output).buffer;
  }

  static parseFromSegment(segmentData: ArrayBuffer, timestamp: number): EmsgBox[] {
    const emsgBoxes: EmsgBox[] = [];
    const view = new DataView(segmentData);
    let offset = 0;

    this.log(`Scanning segment of ${segmentData.byteLength} bytes for EMSG boxes...`);

    while (offset < segmentData.byteLength - 8) {
      try {
        const size = view.getUint32(offset, false); // big-endian
        if (size < 8 || size === 0 || offset + size > segmentData.byteLength) {
          this.log(`Invalid box size ${size} at offset ${offset}, skipping...`);
          offset += 4; // Try next position
          continue;
        }

        const type = getTextDecoder().decode(segmentData.slice(offset + 4, offset + 8));

        this.log(`Found box: type="${type}", size=${size} at offset ${offset}`);

        if (type === 'emsg') {
          this.log(`Processing EMSG box at offset ${offset}, size ${size}`);
          const emsgData = segmentData.slice(offset, offset + size);
          const emsgBox = this.parseEmsgBox(emsgData, timestamp);
          if (emsgBox) {
            emsgBoxes.push(emsgBox);
            this.log(`Successfully parsed EMSG box: ${emsgBox.id}`);
          } else {
            this.log('Failed to parse EMSG box');
          }
        }

        offset += size;
      } catch (error) {
        this.log('Error scanning for EMSG boxes at offset', offset, ':', error);
        offset += 4; // Try next position
      }
    }

    this.log(`Found ${emsgBoxes.length} EMSG boxes in segment`);
    return emsgBoxes;
  }
}
