"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingPageName = exports.GenericPageTypeAction = exports.LandingPageName = exports.AccountPageType = exports.LoginChoiceType = void 0;
// Page object for login/signin page
var LoginChoiceType;
(function (LoginChoiceType) {
    LoginChoiceType["UNKNOWN"] = "UNKNOWN";
    LoginChoiceType["AS_GUEST"] = "AS_GUEST";
    LoginChoiceType["SIGNIN"] = "SIGNIN";
    LoginChoiceType["REGISTER"] = "REGISTER";
    LoginChoiceType["CODE"] = "CODE";
    LoginChoiceType["EMAIL_OR_FACEBOOK"] = "EMAIL_OR_FACEBOOK";
    LoginChoiceType["EMAIL"] = "EMAIL";
    LoginChoiceType["LINK"] = "LINK";
})(LoginChoiceType = exports.LoginChoiceType || (exports.LoginChoiceType = {}));
// Page object user account page.
var AccountPageType;
(function (AccountPageType) {
    AccountPageType["UNKNOWN"] = "UNKNOWN";
    AccountPageType["ACCOUNT"] = "ACCOUNT";
    AccountPageType["HISTORY"] = "HISTORY";
    AccountPageType["PARENTAL"] = "PARENTAL";
    AccountPageType["CLOSED_CAPTIONS"] = "CLOSED_CAPTIONS";
    AccountPageType["VIDEO_PREVIEW"] = "VIDEO_PREVIEW";
    AccountPageType["AUTOSTART"] = "AUTOSTART";
    AccountPageType["AUTOPLAY"] = "AUTOPLAY";
    AccountPageType["NOTIFICATION"] = "NOTIFICATION";
    AccountPageType["PRIVACY_PREFERENCES"] = "PRIVACY_PREFERENCES";
    AccountPageType["REPORT_PROBLEM"] = "REPORT_PROBLEM";
})(AccountPageType = exports.AccountPageType || (exports.AccountPageType = {}));
// Page object for landing page
var LandingPageName;
(function (LandingPageName) {
    LandingPageName["LINEAR_SERIES"] = "LinearSeries";
    LandingPageName["EVENT_ONBOARDING"] = "EventOnboarding";
    LandingPageName["SWEEPSTAKES"] = "Sweepstakes";
})(LandingPageName = exports.LandingPageName || (exports.LandingPageName = {}));
// Page object generic page. Any page that does
// not fall in the above pages is considered a generic page.
var GenericPageTypeAction;
(function (GenericPageTypeAction) {
    GenericPageTypeAction["UNKNOWN"] = "UNKNOWN";
    GenericPageTypeAction["OTT_MENU"] = "OTT_MENU";
})(GenericPageTypeAction = exports.GenericPageTypeAction || (exports.GenericPageTypeAction = {}));
var OnboardingPageName;
(function (OnboardingPageName) {
    OnboardingPageName["PERSONALIZATION"] = "Personalization";
    OnboardingPageName["CONTENT_TYPE_SELECTOR"] = "ContentTypeSelection";
    OnboardingPageName["VIDEO"] = "Video";
    OnboardingPageName["TITLE_PERSONALIZATION"] = "EnhancedPersonalizationFragment";
    OnboardingPageName["TITLE_PERSONALIZATION_THANK_YOU"] = "EnhancedPersonalizationTenCardsRated";
    OnboardingPageName["PROFILE_SELECTION"] = "ProfileSelection";
    OnboardingPageName["CONTINUE_WATCHING_CONSENT"] = "ContinueWatchingConsent";
})(OnboardingPageName = exports.OnboardingPageName || (exports.OnboardingPageName = {}));
//# sourceMappingURL=pages.js.map