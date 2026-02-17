import type { PlatformUppercase } from 'common/constants/platforms';

/**
 * Type which restricts the developer to passing in values in a range. Best
 * way to do this as of typescript 4.4
 *
 * https://stackoverflow.com/questions/39494689/is-it-possible-to-restrict-number-to-a-certain-range
 */
type Percentage = 0 | 0.01 | 0.1 | 0.5 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 60 | 70 | 75 | 80 | 90 | 100;

/**
 * Matches all platforms
 */
type Wildcard = '*';

/**
 * Entry describing percentage of calls to allow through for a set of platforms.
 * Percentage is expressed as a value from 0 to 100. See type for allowable
 * values.
 */
interface PlatformConfig {
  platforms: PlatformUppercase[] | Wildcard;
  percentageToAllow: Percentage;
  allowedUnsampledCalls?: number;
}

/**
 * Caller must pass an array of objects describing sampling rates on different
 * platforms. If the current platform is not in this config, the function will
 * always fire. If the current platform is in this list more than once, only the
 * first entry matching the current platform will be used to determine the
 * sample rate.
*/
type PlatformSamplerConfig = PlatformConfig[];

/**
 * Helper exported for testing. Later values override earlier values.
 */
function resolveConfig(
  config: PlatformSamplerConfig,
  thisPlatform: PlatformUppercase
): {percentageToAllow: number, allowedUnsampledCalls: number } {
  const resolvedConfig = { percentageToAllow: 100, allowedUnsampledCalls: 0 };

  // note that if allowedUnsampledCalls is not passed, it defaults to zero.
  // child samplers do not inherit this value when it is left empty
  config.forEach(({ platforms, percentageToAllow, allowedUnsampledCalls = 0 }) => {
    if (platforms === '*') {
      resolvedConfig.percentageToAllow = percentageToAllow;
      resolvedConfig.allowedUnsampledCalls = allowedUnsampledCalls;
    } else if (platforms.includes(thisPlatform)) {
      resolvedConfig.percentageToAllow = percentageToAllow;
      resolvedConfig.allowedUnsampledCalls = allowedUnsampledCalls;
    }
  });
  return resolvedConfig;
}

/**
 * This is a utility first written to assist with log sampling: only sending a
 * % of log messages to a backend so as to protect the backend from excess
 * traffic, save $ on data storage, etc.
 *
 * The utility is higher-higher-order function. Passed a config, it returns
 * a higher-order function. When this is passed a function F,
 * it returns a function G. When G is invoked, F may be invoked but also may
 * not, depending  on the config and a random value produced internal to the
 * utility.
 *
 * The % of calls to let through is configurable per-platform. If configuration
 * is not passed in for a given platform, all logs are let through. The idea
 * here is that we'll generally want to sample only for larger platforms, and
 * there are fewer of these than smaller platforms. So it works something like
 * a platform-specific block-list with a configurable % of blocks.
 *
 * Note that entries later in the configuration override entries earlier in the
 * configuration. This allows the sampler to be forked, returning a new sampler
 * with new config merged into the parent's config
 */
export function platformSamplerFactory(
  config: PlatformSamplerConfig,
) {
  // how many times has the platformSampler been invoked since initialization?
  // allows allowing through a fixed number of calls
  let callsSoFar = 0;

  // determining the sample rate once in the top level of the
  // HOF ensures that we parse the config only once
  const resolvedConfig = resolveConfig(config, __WEBPLATFORM__ || __OTTPLATFORM__);

  // eslint-disable-next-line @typescript-eslint/ban-types
  function platformSampler<F extends Function>(fnToSample: F): F | ((...args: any[]) => void) {
    if (callsSoFar < resolvedConfig.allowedUnsampledCalls) {
      callsSoFar += 1;
      return fnToSample;
    }
    const diceRoll = Math.random() * 100;
    const shouldSample = diceRoll < resolvedConfig.percentageToAllow;
    return shouldSample ? fnToSample : () => {};
  }

  /**
   * Allow caller to inspect config. Mainly for debugging. Useful when
   * inspecting config in forked "child" samplers
   */
  platformSampler._config = config;

  /**
   * Allow called to inspect resolved config. Useful for debugging & testing
   */
  platformSampler._resolvedConfig = resolvedConfig;

  /**
   * Returns a "child" sampler with config merged into the parent config
   */
  platformSampler.fork = (
    forkConfig: PlatformSamplerConfig,
  ) => {
    return platformSamplerFactory([...config, ...forkConfig]);
  };

  return platformSampler;
}
