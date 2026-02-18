import { getStore } from 'client/store/default';
import { StringMap, StringSet } from 'common/utils/collections';

import { getImpressionsManager } from './default';
import type { ConcludedImpression, ContentLabels } from './types';

type ImpressionParams = {
  contentId: string;
  containerId: string;
  row: number;
  col: number;
  pathname: string;
  personalizationId: string;
  isSeries?: boolean;
};

const impressionMap = new StringMap<Impression>();

const contentLabelsGetOptions = { defaultValue: () => new StringSet() };

function computeImpressionHash(params: ImpressionParams): string {
  return `${params.contentId}-${params.containerId}-${params.row}-${params.col}-${params.personalizationId}-${params.pathname}-${params.isSeries}`;
}

export function trackImpression(params: ImpressionParams): Impression {
  const hash = computeImpressionHash(params);
  const existingImpression = impressionMap.get(hash);

  if (existingImpression) {
    return existingImpression;
  }

  const newImpression = new Impression(params);
  impressionMap.set(hash, newImpression);
  return newImpression;
}
export class Impression {
  readonly contentId: string;
  readonly containerId: string;
  readonly row: number;
  readonly col: number;
  readonly personalizationId: string;
  readonly startTime: number;
  readonly pathname: string;
  readonly isSeries?: boolean;
  private contentLabels: StringMap<StringSet, keyof ContentLabels> = new StringMap();
  private searchQuery = '';

  private dwellTime = 0;

  private focusStartTime: number | undefined;

  constructor(impression: {
    contentId: string;
    containerId: string;
    row: number;
    col: number;
    pathname: string;
    personalizationId: string;
    isSeries?: boolean;
  }) {
    this.contentId = impression.contentId;
    this.containerId = impression.containerId;
    this.row = impression.row;
    this.col = impression.col;
    this.personalizationId = impression.personalizationId;
    this.isSeries = impression.isSeries;
    this.startTime = performance.now();
    this.pathname = impression.pathname;
    this.searchQuery = this.getSearchQuery();
  }

  private getSearchQuery(): string {
    return getStore().getState().search.key;
  }

  get hash(): string {
    return computeImpressionHash({
      contentId: this.contentId,
      containerId: this.containerId,
      row: this.row,
      col: this.col,
      personalizationId: this.personalizationId,
      pathname: this.pathname,
      isSeries: this.isSeries,
    });
  }

  changeFocus = (focused: boolean) => {
    if (focused && typeof this.focusStartTime === 'undefined') {
      this.focusStartTime = performance.now();
    } else if (!focused && typeof this.focusStartTime !== 'undefined') {
      const focusDuration = Math.floor(performance.now() - this.focusStartTime);
      if (this.isValidDuration(focusDuration)) {
        this.dwellTime += focusDuration;
      }
      this.focusStartTime = undefined;
    }
  };

  addContentLabels = (labels: {
    metadataLabels?: string[];
    metadata?: string[];
    markers?: string[];
    posterLabels?: string[];
  }) => {
    labels.metadataLabels?.forEach(label => this.contentLabels.get('metadataLabels', contentLabelsGetOptions).add(label));
    labels.metadata?.forEach(label => this.contentLabels.get('metadata', contentLabelsGetOptions).add(label));
    labels.markers?.forEach(label => this.contentLabels.get('markers', contentLabelsGetOptions).add(label));
    labels.posterLabels?.forEach(label => this.contentLabels.get('posterLabels', contentLabelsGetOptions).add(label));
  };

  complete = () => {
    const duration = Math.floor(performance.now() - this.startTime);
    if (this.isValidDuration(duration)) {
      const contentLabels = this.getContentLabels();
      const concludedImpression: ConcludedImpression = {
        contentId: this.contentId,
        containerId: this.containerId,
        row: this.row,
        col: this.col,
        personalizationId: this.personalizationId,
        duration,
        pathname: this.pathname,
        searchQuery: this.searchQuery,
        isSeries: this.isSeries,
      };
      if (this.isValidDuration(this.dwellTime)) {
        concludedImpression.dwellTime = this.dwellTime;
      }
      if (contentLabels) {
        concludedImpression.contentLabels = contentLabels;
      }
      getImpressionsManager().track(concludedImpression);
      impressionMap.delete(this.hash);
    }
  };

  private getContentLabels(): ContentLabels | undefined {
    if (this.contentLabels.size === 0) return undefined;
    const contentLabels: ContentLabels = {};
    this.contentLabels.forEach((valueSet, key) => {
      contentLabels[key] = valueSet.values().map(type => ({ type }));
    });
    return contentLabels;
  }

  private isValidDuration(duration: number): boolean {
    const VALID_DURATION = 1000;
    return duration >= VALID_DURATION;
  }
}

