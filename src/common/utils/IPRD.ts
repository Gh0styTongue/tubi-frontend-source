import { StubiosDMCAIssueTypeValue } from 'common/constants/stubios';

/**
 * Helper function to check if an issue type is a copyright infringement
 * (handles both Stubios-specific and Tubi-specific copyright infringement types)
 */
export const isCopyrightInfringement = (issueType?: string) => {
  return issueType === StubiosDMCAIssueTypeValue.copyrightInfringement ||
         issueType === StubiosDMCAIssueTypeValue.copyrightInfringementOnTubi;
};

/**
 * Helper function to check if an issue type is a trademark infringement
 * (handles both Stubios-specific and Tubi-specific trademark infringement types)
 */
export const isTrademarkInfringement = (issueType?: string) => {
  return issueType === StubiosDMCAIssueTypeValue.trademarkInfringement ||
         issueType === StubiosDMCAIssueTypeValue.trademarkInfringementOnTubi;
};

/**
 * Helper function to check if an issue type is specifically for Tubi platform
 * (handles both copyright and trademark infringement on Tubi)
 */
export const isInfringementOnTubi = (issueType?: string) => {
  return issueType === StubiosDMCAIssueTypeValue.copyrightInfringementOnTubi ||
         issueType === StubiosDMCAIssueTypeValue.trademarkInfringementOnTubi;
};

/**
 * Helper function to check if an issue type is specifically for Stubios platform
 * (handles both copyright and trademark infringement on Stubios)
 */
export const isInfringementOnStubios = (issueType?: string) => {
  return issueType === StubiosDMCAIssueTypeValue.copyrightInfringement ||
         issueType === StubiosDMCAIssueTypeValue.trademarkInfringement;
};
