/**
 * Type guards and runtime validation utilities
 */

import type { Envelope, CommandPayload, MetadataPayload } from '../types';

/**
 * Basic type guards
 */
export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function isNonEmptyString(v: unknown): v is string {
  return isString(v) && v.length > 0;
}

/**
 * Envelope validation
 * Note: Envelope.type is optional, as server-wrapped messages don't have a top-level type field
 * Server-wrapped messages have: { sender, room_id, ts, payload }
 * Client messages have: { type, payload }
 */
export function isEnvelope(v: unknown): v is Envelope {
  if (!isObject(v)) return false;

  const envelope = v as any;

  // Envelope must have a payload (required for all messages)
  if (!('payload' in envelope)) {
    return false;
  }

  // If type exists, it must be a non-empty string
  if ('type' in envelope && !isNonEmptyString(envelope.type)) {
    return false;
  }

  // Valid envelope structure
  return true;
}

/**
 * Command payload validation
 */
export function isCommandPayload(v: unknown): v is CommandPayload {
  return isObject(v) && isNonEmptyString((v as any).type);
}

/**
 * Validate play command
 */
export function isValidPlayCommand(payload: unknown): boolean {
  if (!isObject(payload)) return false;
  const p = payload as any;
  return (
    p.type === 'play' &&
    isNonEmptyString(p.contentId) &&
    (p.isLive === undefined || isBoolean(p.isLive))
  );
}

/**
 * Validate seek command
 */
export function isValidSeekCommand(payload: unknown): boolean {
  if (!isObject(payload)) return false;
  const p = payload as any;
  return p.type === 'seek' && isNumber(p.position) && p.position >= 0;
}

/**
 * Validate skip command
 */
export function isValidSkipCommand(payload: unknown): boolean {
  if (!isObject(payload)) return false;
  const p = payload as any;
  return (
    (p.type === 'skipForward' || p.type === 'skipBackward') &&
    (!p.seconds || isNumber(p.seconds))
  );
}

/**
 * Validate subtitle command
 */
export function isValidSubtitleCommand(payload: unknown): boolean {
  if (!isObject(payload)) return false;
  const p = payload as any;
  return p.type === 'setSubtitles' && isString(p.language);
}

/**
 * Metadata validation
 */
export function isMetadataPayload(v: unknown): v is MetadataPayload {
  if (!isObject(v)) return false;
  const p = v as any;

  // Basic metadata fields validation
  const hasBasicFields =
    p.type === 'metadata' &&
    (p.contentId === null || isString(p.contentId)) &&
    isBoolean(p.isLive) &&
    isNumber(p.duration) &&
    isNumber(p.position) &&
    isNumber(p.rate) &&
    isBoolean(p.isMuted) &&
    isNumber(p.volume);

  if (!hasBasicFields) return false;

  // Validate subtitleLanguage field (required)
  if (!isString(p.subtitleLanguage)) return false;

  // Validate ad field (optional, can be null/undefined or a valid AdPlaybackInfo)
  if (p.ad !== undefined && p.ad !== null) {
    if (!isObject(p.ad)) return false;
    const ad = p.ad as any;
    if (
      !isNumber(ad.position) ||
      !isNumber(ad.duration) ||
      !isNumber(ad.sequence) ||
      !isNumber(ad.podCount)
    ) {
      return false;
    }
  }

  return true;
}

