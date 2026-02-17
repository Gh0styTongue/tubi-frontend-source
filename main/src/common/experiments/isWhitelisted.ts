const WHITELIST_PATTERN = /^qa\./;

export const isWhitelisted = (experimentName: string): boolean => WHITELIST_PATTERN.test(experimentName);

/**
 * Returns the experiment name without the leading "qa." if present.
 * @param {string} experimentName
 */
export const realExperimentName = (experimentName: string): string => experimentName.replace(WHITELIST_PATTERN, '');
