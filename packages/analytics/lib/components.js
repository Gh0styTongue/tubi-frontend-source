"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYTICS_DESTINATION_COMPONENTS = exports.ANALYTICS_COMPONENTS = exports.NavSection = void 0;
// refer to https://github.com/adRise/protos/blob/155711b97bb57ced00a26a0a799e6016327f465a/analytics/client.proto#L462-L474
var NavSection;
(function (NavSection) {
    NavSection["UNKNOWN_SECTION"] = "UNKNOWN_SECTION";
    NavSection["ACCOUNT"] = "ACCOUNT";
    NavSection["SEARCH"] = "SEARCH";
    NavSection["HOME"] = "HOME";
    NavSection["MOVIES"] = "MOVIES";
    NavSection["SERIES"] = "SERIES";
    NavSection["QUEUE"] = "QUEUE";
    NavSection["FOR_YOU"] = "FOR_YOU";
    NavSection["GENRE"] = "GENRE";
    NavSection["COLLECTION"] = "COLLECTION";
    // To users these are categories, internally they are containers
    NavSection["CATEGORIES"] = "CATEGORIES";
    NavSection["CHANNEL"] = "CHANNEL";
    NavSection["SETTINGS"] = "SETTINGS";
    NavSection["EXIT"] = "EXIT";
    NavSection["KIDS"] = "KIDS";
    NavSection["NEWS"] = "NEWS";
    NavSection["ESPANOL"] = "ESPANOL";
    NavSection["SPORTS"] = "SPORTS";
    NavSection["LINEAR"] = "LINEAR";
    NavSection["LINEAR_ALL"] = "HOME";
    NavSection["BACK"] = "BACK";
    NavSection["SUBTITLES"] = "SUBTITLES";
    // EPG containers
    NavSection["ENTERTAINMENT"] = "ENTERTAINMENT";
    NavSection["NATIONAL_NEWS"] = "NATIONAL_NEWS";
    NavSection["BUSINESS_NEWS"] = "BUSINESS_NEWS";
    NavSection["GLOBAL_NEWS"] = "GLOBAL_NEWS";
    NavSection["CULTURE_AND_ENTERTAINMENT_NEWS"] = "CULTURE_AND_ENTERTAINMENT_NEWS";
    NavSection["LOCAL_NEWS"] = "LOCAL_NEWS";
    NavSection["WEATHER"] = "WEATHER";
    NavSection["RECENTLY_ADDED"] = "RECENTLY_ADDED";
    NavSection["FEATURED"] = "FEATURED";
    NavSection["SET_REMINDER"] = "SET_REMINDER";
    NavSection["REMOVE_REMINDER"] = "REMOVE_REMINDER";
    NavSection["FAVORITES"] = "FAVORITES";
    NavSection["RECOMMENDED"] = "RECOMMENDED";
    // Mainly used for ott detail page
    NavSection["CONTINUE_WATCHING"] = "CONTINUE_WATCHING";
    NavSection["PLAY"] = "PLAY";
    NavSection["WATCH_TRAILER"] = "WATCH_TRAILER";
    NavSection["LIKE"] = "LIKE";
    NavSection["DISLIKE"] = "DISLIKE";
    NavSection["LIKE_OR_DISLIKE"] = "LIKE_OR_DISLIKE";
    NavSection["EPISODES_LIST"] = "EPISODES_LIST";
    NavSection["SIGNUP_TO_SAVE_PROGRESS"] = "SIGNUP_TO_SAVE_PROGRESS";
    NavSection["SIGNIN"] = "SIGNIN";
    NavSection["ADD_TO_MY_LIST"] = "ADD_TO_MY_LIST";
    NavSection["REMOVE_FROM_MY_LIST"] = "REMOVE_FROM_MY_LIST";
    NavSection["REMOVE_FROM_HISTORY"] = "REMOVE_FROM_HISTORY";
    NavSection["GO_TO_NETWORK"] = "GO_TO_NETWORK";
    NavSection["START_FROM_BEGINNING"] = "START_FROM_BEGINNING";
    NavSection["SHARE"] = "SHARE";
    NavSection["REPORT_PROBLEM"] = "REPORT_PROBLEM";
    NavSection["LIKE_REMOVE_RATING"] = "LIKE_REMOVE_RATING";
    NavSection["DISLIKE_REMOVE_RATING"] = "DISLIKE_REMOVE_RATING";
    NavSection["SIGNIN_TO_WATCH_EARLY"] = "SIGNIN_TO_WATCH_EARLY";
})(NavSection = exports.NavSection || (exports.NavSection = {}));
// Component key strings used in Analytics redesign
// https://github.com/adRise/protos/blob/master/analytics/events.proto#L552
exports.ANALYTICS_COMPONENTS = {
    navigationDrawerComponent: 'navigation_drawer_component',
    // To analytics these are categories, internally they are containers
    containerComponent: 'category_component',
    castListComponent: 'cast_list_component',
    channelGuideComponent: 'channel_guide_component',
    autoplayComponent: 'auto_play_component',
    relatedComponent: 'related_component',
    episodeVideoListComponent: 'episode_video_list_component',
    searchResultComponent: 'search_result_component',
    genericComponent: 'generic_component',
    leftSideNavComponent: 'left_side_nav_component',
    middleNavComponent: 'middle_nav_component',
    topNavComponent: 'top_nav_component',
    genreListComponent: 'genre_list_component',
    allEpisodesComponent: 'all_episodes_component',
    epgComponent: 'epg_component',
    reminderComponent: 'reminder_component',
    buttonComponent: 'button_component',
    accountPage: 'account_page',
    myStuffComponent: 'mystuff_component',
    sideSheetComponent: 'side_sheet_component',
    tileComponent: 'tile_component',
    browserMenuComponent: 'browser_menu_component',
};
// Destination components
// https://github.com/adRise/protos/blob/65f75a48cd7c74b3b50f3e7f34d7c428cf8b99bf/analytics/events.proto#L573
exports.ANALYTICS_DESTINATION_COMPONENTS = {
    destinationLeftSideNavComponent: 'dest_left_side_nav_component',
    destinationTopNavComponent: 'dest_top_nav_component',
    destinationEPGComponent: 'dest_epg_component',
    destinationMiddleNavComponent: 'dest_middle_nav_component',
    destinationCategoryComponent: 'dest_category_component',
};
//# sourceMappingURL=components.js.map