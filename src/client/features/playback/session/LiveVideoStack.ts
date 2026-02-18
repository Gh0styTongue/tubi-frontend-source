import { now, timeDiffInMinutes } from '@adrise/utils/lib/time';

import { exposeToTubiGlobal } from 'client/global';

interface LiveVideoStackNode {
  id: string;
  isDeliberate: boolean;
  startTimestamp: number;
  endTimestamp: number;
}
// Export for test only
export class LiveVideoStack {
  private stack: LiveVideoStackNode[] = [];

  private capacity: number = 20;

  constructor() {
    exposeToTubiGlobal({
      liveVideoStack: this,
    });
  }

  push(node: LiveVideoStackNode) {
    this.stack.push(node);
    if (this.stack.length > this.capacity) {
      this.stack.shift();
    }
  }

  isRevisit(id: string): boolean {
    return this.getRevisitTimes(id) > 0;
  }

  getRevisitTimes(id: string): number {
    const currentTime = now();
    let times = 0;
    for (let i = this.stack.length - 1; i > -1; i--) {
      const node = this.stack[i];
      if (timeDiffInMinutes(node.endTimestamp, currentTime) > 2) {
        return times;
      }
      if (node.id === id && node.isDeliberate) {
        times++;
      }
    }
    return times;
  }

  destroy() {
    this.stack = [];
  }
}

export const liveVideoStack = new LiveVideoStack();
