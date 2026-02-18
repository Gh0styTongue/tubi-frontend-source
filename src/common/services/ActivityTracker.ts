export type ActivityType = 'watched30SecondsPreviewVideo'
  | 'visitedDetailsPage'
  | 'startPlayback'
  | 'closeToAutoplay'
  | 'startAutoplay';

export enum HighConversionSessionTrackType {
  PREVIEW_TO_DETAIL = 'preview_to_detail',
  CLOSE_TO_AUTOPLAY = 'close_to_autoplay',
}

interface Activity {
  type: ActivityType;
  contentId: string;
}

const PreviewToDetailSequence: ActivityType[] = [
  'watched30SecondsPreviewVideo',
  'startPlayback',
];

const CloseToAutoplaySequence: ActivityType[] = [
  'closeToAutoplay',
  'startAutoplay',
];
// Currently only keep last 2 activities
const MaxActivities = 2;
class ActivityTracker {
  private activities: Activity[] = [];

  track(type: ActivityType, contentId: string): void {
    const lastActivity = this.activities[this.activities.length - 1];
    if (lastActivity && lastActivity.type === type && lastActivity.contentId === contentId) {
      return;
    }

    this.activities.push({
      type,
      contentId,
    });

    while (this.activities.length > MaxActivities) {
      this.activities.shift();
    }
  }

  getAllActivities(): Activity[] {
    return this.activities;
  }

  clearActivities(): void {
    this.activities = [];
  }

  private _formatActivities(): string {
    return this.activities.map(activity => activity.type).join(',');
  }

  private isPreviewToDetailConversion(): boolean {
    const contentId = this.activities[0]?.contentId;
    return this._formatActivities() === PreviewToDetailSequence.join(',') && !!contentId && this.activities.every(activity => activity.contentId === contentId);
  }

  private isCloseToAutoplayConversion(): boolean {
    return this._formatActivities() === CloseToAutoplaySequence.join(',');
  }

  getHighConversionTrackType(isClear?: boolean): HighConversionSessionTrackType | undefined {

    let highConversionSessionTrackType;
    if (this.isPreviewToDetailConversion()) {
      highConversionSessionTrackType = HighConversionSessionTrackType.PREVIEW_TO_DETAIL;
    }

    if (this.isCloseToAutoplayConversion()) {
      highConversionSessionTrackType = HighConversionSessionTrackType.CLOSE_TO_AUTOPLAY;
    }

    if (isClear) {
      this.clearActivities();
    }

    return highConversionSessionTrackType;
  }
}

export const activityTracker = new ActivityTracker();
