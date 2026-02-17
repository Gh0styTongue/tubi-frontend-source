interface CallbackBatcherConfig {
  /**
   * How many calls in a short period of time are allowed through without
   * rate limiting, for a given hash? E.g. How many tokens does an entry
   * start with in its token bucket?
   */
  maxTokens: number,
  /**
   * How often are new tokens added, in seconds?
   */
  tokenRate: number
}

/**
 * This callback which the batcher executes.
 */
type Callback = (count: number) => void;

interface EntryInitialParams {
  tokens: number;
  callback: Callback
}
/**
 * A helper class that encapsultates state for a rate-limited callback
 */
class Entry {
  countSinceLastLog: number = 0;

  tokens: number;

  callback: Callback;

  constructor({ tokens, callback }: EntryInitialParams) {
    this.tokens = tokens;
    this.callback = callback;
  }

  replaceCallback(callback: Callback) {
    this.callback = callback;
  }

  incrementCallCount(): void {
    this.countSinceLastLog += 1;
  }

  maybeInvokeCallback(): void {
    if (this.tokens > 0 && this.countSinceLastLog) {
      this.callback(this.countSinceLastLog);
      this.countSinceLastLog = 0;
      this.tokens -= 1;
    }
  }

  maybeIncrementToken({ maxTokens }: {maxTokens: number}) {
    this.tokens = Math.min(this.tokens + 1, maxTokens);
  }
}

class CallbackBatcher {
  private hashmap: Record<string, Entry> = {};

  private maxTokens: number;

  private intervalId: number;

  constructor({ maxTokens, tokenRate }: CallbackBatcherConfig) {
    this.maxTokens = maxTokens;
    this.intervalId = setInterval(() => {
      this.addTokensAndInvokeBatchedCallbacks();
    }, tokenRate) as unknown as number;

    // on page unload, clear the interval just in case
    if (__CLIENT__) {
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });
    }
  }

  destroy = (): void => {
    clearInterval(this.intervalId);
    this.addTokensAndInvokeBatchedCallbacks();
  };

  private findOrCreateEntry = (hash: string, callback: Callback): Entry => {
    const entry = this.hashmap[hash] ?? new Entry({
      tokens: this.maxTokens,
      callback,
    });
    this.hashmap[hash] = entry;
    // Returning the entry ensures we don't need to repeatedly look up the entry
    // in the hash in order to mutate it in other methods, as lookup can be
    // worse than constant time in the edge case where there are very many
    // distinct hash entries.
    return entry;
  };

  private addTokensAndInvokeBatchedCallbacks = (): void => {
    Object.entries(this.hashmap).forEach(([hash, entry]) => {
      entry.maybeIncrementToken({ maxTokens: this.maxTokens });
      entry.maybeInvokeCallback();

      // remove entries that we don't need anymore
      const { countSinceLastLog, tokens } = entry;
      if (countSinceLastLog === 0 && tokens === this.maxTokens) {
        delete this.hashmap[hash];
      }
    });
  };

  /**
   * Schedule the execution of a callback; may execute immediately or after a
   * delay, if rate-limited.
   */
  schedule = (hash: string, callback: Callback): void => {
    const entry = this.findOrCreateEntry(hash, callback);
    entry.replaceCallback(callback);
    entry.incrementCallCount();
    entry.maybeInvokeCallback();
  };

}

/**
 * This is a convenience factory function wrapper for the callback batcher, a
 * utility class responsible for batching and rate-limiting invocations
 * of a callback. It is intended to be used to help with rate-limiting log
 * messages and error logging.
 *
 * It implements a variant of the token-bucket algorithm:
 * https://en.wikipedia.org/wiki/Token_bucket
 *
 * In this variant, when more to tokens are added, any pending callback calls
 * are made as a batch, with a count passed in to the callback.
 *
 * If we have a maxTokens of 3 and a tokenRate of 1 (per second), then
 * if we have a burst of callback invocations, we'll see three fire immediately,
 * and then thereafter 1 will fire every second, counting up and batching
 * the number of scheduled invocations seen since the last call.
 *
 * The hash value passed in allows keeping a distinct token bucket for different
 * distinct entities. The idea here is that if the callback (e.g.) logs an error
 * to an endppoint, the hash is a distinct value representing that
 * particular error. This lets us keep a separate token bucket for each kind of
 * error.
 *
 * Note that if the batcher's scheduler function is used in the scope of a
 * helper function, it should be instantiated outside the context of that
 * function, as the batcher keeps internal state which must persist and not be
 * garbage-collected between calls to the scheduler.
 */
export function callbackBatcherFactory(config: CallbackBatcherConfig): [
  // the scheduler function for the batcher
  (hash: string, callback: Callback) => void,
  // cleans up the batcher instance
  () => void,
  // returned for testing
  CallbackBatcher
] {
  const batcher = new CallbackBatcher(config);
  const scheduler = batcher.schedule;
  const disposer = batcher.destroy;
  return [scheduler, disposer, batcher];
}
