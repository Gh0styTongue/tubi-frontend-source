/**
 * @author Leo Fu
 * According to https://www.notion.so/tubi/Why-LivePlayer-re-rendered-on-start-stage-c05c9d117e9b4f01b5bc7e4c0b952d1f?pvs=4
 * Try using a priority map to compare
 */
interface StreamURLPriority {
  priority: number;
  baseUrl: string;
}

const priorityMap = new Map<string, StreamURLPriority>();

/**
 * add a stream Url to priority Map with available priority options
 * @param streamUrl
 * @param options receive a specified priority or increaseStreamPriority automatically
 */
export const addStreamUrl = (streamUrl: string, options: { priority?: number; incStreamPriority?: boolean } = { priority: 1 }) => {
  if (!streamUrl.length) {
    return;
  }
  const urlObj = new URL(streamUrl);
  let priority = options.priority || 1;
  if (options.incStreamPriority) {
    const prePriority = getPriority(streamUrl, { ignoreQuery: true });
    priority = prePriority + 1;
  }

  priorityMap.set(streamUrl, {
    baseUrl: urlObj.origin + urlObj.pathname,
    priority,
  });
};

export const resetPriorityMap = () => {
  priorityMap.clear();
};

const intlGetPriorityByBaseUrl = (baseUrl: string) => {
  return Array.from(priorityMap.values()).reduce((priority, current) => {
    if (current.baseUrl === baseUrl) {
      return Math.max(current.priority, priority);
    }
    return priority;
  }, 0);
};

export const getPriority = (streamUrl: string, options?: {ignoreQuery?: boolean;}) => {
  if (options?.ignoreQuery) {
    const urlObj = new URL(streamUrl);
    return intlGetPriorityByBaseUrl(urlObj.origin + urlObj.pathname);
  }
  const found = priorityMap.get(streamUrl);
  return found ? found.priority : 0;
};

/**
 * returns weather the streamUrlA is prior to streamUrlB
 * @param streamUrlA
 * @param streamUrlB
 */
export const comparePriority = (streamUrlA: string, streamUrlB: string) => {
  if (streamUrlA && !streamUrlB) return true;
  if (!streamUrlA && streamUrlB) return false;

  const priorityA = getPriority(streamUrlA);
  const priorityB = getPriority(streamUrlB);

  return priorityA > priorityB;
};
