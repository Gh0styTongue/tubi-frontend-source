"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdPodDuration = exports.sendVASTNotUsedBeacon = exports.getUrlForUnusedActions = exports.sendVASTErrorBeacon = exports.getAdTrackFn = exports.buildAdQueue = exports.fetchJsonAds = exports.getOverlappingRequests = void 0;
var tslib_1 = require("tslib");
var queryString_1 = require("@adrise/utils/lib/queryString");
var uuid_1 = require("uuid");
var fetchWrapper_1 = require("./fetchWrapper");
var tools_1 = require("./tools");
var constants_1 = require("../constants");
/**
 * Returns the most recent performance timing detail for the network request of the specified URL.
 * @param url
 * @returns PerformanceResourceTiming
 */
function getMostRecentNetworkPerformanceForUrl(url) {
    var _a;
    if (typeof ((_a = window.performance) === null || _a === void 0 ? void 0 : _a.getEntriesByName) !== 'function')
        return;
    /* eslint-disable-next-line compat/compat */
    var resourceEntries = performance.getEntriesByName(url, 'resource');
    if (!resourceEntries || resourceEntries.length === 0) {
        return;
    }
    // MDN states that resourceEntries should be sorted in chronological order
    // though we'll sort it just in case it's not on some browsers
    var latestResource = resourceEntries.reduce(function (latest, resource) {
        return resource.startTime > latest.startTime ? resource : latest;
    });
    if (typeof latestResource.responseEnd !== 'undefined') {
        return latestResource;
    }
}
/**
 * A mapping of URL patterns to identifiers for use in generating a hash
 * that summarizes overlapping network requests.
 */
var urlMappings = [
    {
        regex: /^https:\/\/uapi\.(staging|production)-public\.tubi\.io\/datascience\/logging(?:\?.*)?$/,
        id: 'A',
    },
    {
        regex: /^https:\/\/analytics-ingestion\.(staging|production)-public\.tubi\.io\/analytics-ingestion\/v2\/single-event(?:\?.*)?$/,
        id: 'B',
    },
    {
        regex: /^https:\/\/cdn\.adrise\.tv\/tubitv-assets\/img\/ott\/intro_background_repaint_with_logo\.jpg$/,
        id: 'C',
    },
    {
        regex: /^http:\/\/a-fds\.youborafds01\.com\/data\?.*$/,
        id: 'D',
    },
    {
        regex: /^http:\/\/(a-fds\.youborafds01\.com|infinity-[\w-]+\.youboranqs01\.com)\/init\?.*$/,
        id: 'E',
    },
    {
        regex: /^https:\/\/user-queue\.(staging|production)-public\.tubi\.io\/api\/v2\/queues$/,
        id: 'F',
    },
    {
        regex: /^https:\/\/lishi\.(staging|production)-public\.tubi\.io\/api\/v2\/view_history\?.*$/,
        id: 'G',
    },
    {
        regex: /^https:\/\/tensor-cdn\.(staging|production)-public\.tubi\.io\/api\/v5\/containers\/queue\?.*$/,
        id: 'H',
    },
    {
        regex: /^http:\/\/tpc\.googlesyndication\.com\/sodar\/[A-Za-z0-9]+\.[A-Za-z]+$/,
        id: 'I',
    },
    {
        regex: /^http:\/\/[\w.-]+\/dist\/.*\.chunk\.js$/,
        id: 'J',
    },
];
function getIdentifierForUrl(url) {
    for (var _i = 0, urlMappings_1 = urlMappings; _i < urlMappings_1.length; _i++) {
        var mapping = urlMappings_1[_i];
        if (mapping.regex.test(url)) {
            return mapping.id;
        }
    }
    return 'U'; // For unknown
}
/**
 * Generates a hash that summarizes overlapping network requests (e.g. 'A:2,B:4,C:1').
 * @param entries - PerformanceEntry[]
 * @returns string - A hash that summarizes overlapping network requests
 */
function generateOverlappingRequestHash(entries) {
    var counts = entries.reduce(function (acc, entry) {
        var id = getIdentifierForUrl(entry.name);
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(counts)
        .map(function (_a) {
        var id = _a[0], count = _a[1];
        return "".concat(id, ":").concat(count);
    })
        .join(',');
}
/**
 * Returns all network requests that overlap with the specified URL.
 * This function is useful for estimating the number of requests that may be blocking a specific request,
 * though it can’t definitively identify whether one request is directly blocking another.
 *
 * @param targetUrl
 * @returns PerformanceEntry[]
 */
function getOverlappingRequests(targetUrl) {
    var _a;
    if (typeof ((_a = window.performance) === null || _a === void 0 ? void 0 : _a.getEntriesByName) !== 'function' || typeof window.performance.getEntriesByType !== 'function')
        return [];
    /* eslint-disable-next-line compat/compat */
    var targetRequests = performance.getEntriesByName(targetUrl, 'resource');
    if (targetRequests.length === 0)
        return [];
    // MDN states that resourceEntries should be sorted in chronological order
    // though we'll sort it just in case it's not on some browsers
    var targetRequest = targetRequests.reduce(function (latest, resource) {
        return resource.startTime > latest.startTime ? resource : latest;
    });
    var targetStart = targetRequest.startTime;
    var resources = performance.getEntriesByType('resource');
    var targetIndex = resources.indexOf(targetRequest);
    if (targetIndex === -1)
        return [];
    var overlappingRequests = resources.slice(0, targetIndex).filter(function (entry) {
        if (typeof entry.responseEnd === 'undefined')
            return false;
        return entry.startTime < targetStart && entry.responseEnd > targetStart;
    });
    return overlappingRequests;
}
exports.getOverlappingRequests = getOverlappingRequests;
/**
 * makes a request to the url and builds an adQueue based on the JSON response
 */
var fetchJsonAds = function (url, _a) {
    var _b = _a === void 0 ? {} : _a, requestProcessBeforeFetch = _b.requestProcessBeforeFetch, _c = _b.timeout, timeout = _c === void 0 ? 10000 : _c, maxRetries = _b.maxRetries;
    return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var startTime, fullUrl, headers, promiseOrNot, e_1;
        var _d;
        return tslib_1.__generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    startTime = Date.now();
                    fullUrl = url;
                    headers = {};
                    if (!requestProcessBeforeFetch) return [3 /*break*/, 6];
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 5, , 6]);
                    promiseOrNot = requestProcessBeforeFetch(url, headers);
                    if (!(promiseOrNot instanceof Promise)) return [3 /*break*/, 3];
                    return [4 /*yield*/, promiseOrNot];
                case 2:
                    _d = _e.sent(), fullUrl = _d[0], headers = _d[1];
                    return [3 /*break*/, 4];
                case 3:
                    fullUrl = promiseOrNot[0], headers = promiseOrNot[1];
                    _e.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_1 = _e.sent();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, (0, fetchWrapper_1.xhrRequest)(fullUrl, tslib_1.__assign({ headers: tslib_1.__assign({ Accept: 'application/json' }, headers), responseType: 'json', timeout: timeout }, (maxRetries ? { maxRetries: maxRetries } : {})))
                        .then(function (response) {
                        var retries = response.retries;
                        return response.json().then(function (data) {
                            return { data: data, retries: retries };
                        });
                    })
                        .then(function (_a) {
                        var _b;
                        var data = _a.data, retries = _a.retries;
                        var endTime = Date.now();
                        var performanceTiming = getMostRecentNetworkPerformanceForUrl(fullUrl);
                        var overlappingRequests = getOverlappingRequests(fullUrl);
                        var overlappingRequestHash = generateOverlappingRequestHash(overlappingRequests);
                        var networkResponseTime = performanceTiming && (performanceTiming.responseEnd - performanceTiming.startTime) / 1000;
                        var requestQueueTime = performanceTiming && Math.max(0, (performanceTiming.requestStart - performanceTiming.startTime) / 1000);
                        return {
                            ads: buildAdQueue(data),
                            metrics: {
                                responseTime: Math.max((endTime - startTime) / 1000, 0),
                                networkResponseTime: networkResponseTime,
                                requestQueueTime: requestQueueTime,
                                retries: retries,
                                overlappingRequests: overlappingRequests.length,
                                overlappingRequestHash: overlappingRequestHash,
                                requestId: (_b = data.metadata) === null || _b === void 0 ? void 0 : _b.request_id,
                            },
                        };
                    })
                        .catch(function (error) {
                        var overlappingRequests = getOverlappingRequests(fullUrl);
                        error.overlappingRequests = overlappingRequests.length;
                        error.overlappingRequestHash = generateOverlappingRequestHash(overlappingRequests);
                        throw error;
                    })];
            }
        });
    });
};
exports.fetchJsonAds = fetchJsonAds;
function buildAdQueue(rawData) {
    if (rawData === void 0) { rawData = {}; }
    return (rawData.items || []).map(function (item) { return ({
        id: item.ad_id,
        video: (0, queryString_1.addQueryStringToUrl)(item.media.streamurl, { tid: (0, uuid_1.v4)() }),
        duration: parseInt(item.media.duration, 10),
        imptracking: item.imptracking || [],
        trackingevents: item.media.trackingevents,
        clickthrough: item.clickthrough,
        clicktracking: item.clicktracking || [],
        skiptracking: item.skiptracking || [],
        error: item.error || '',
        icon: item.icon,
    }); });
}
exports.buildAdQueue = buildAdQueue;
function getAdTrackFn(ad, errorHandler, useQueueImpressions) {
    var timePoints = [0, 25, 50, 75, 100];
    var firedPercent = {};
    return function (position) {
        var adQuartile = -1;
        timePoints.some(function (timePoint) {
            if (firedPercent[timePoint])
                return false;
            if (position < Math.ceil(ad.duration * timePoint / 100))
                return false;
            firedPercent[timePoint] = true;
            if (timePoint === 0) {
                (0, tools_1.sendBeaconRequest)(ad.imptracking, errorHandler, useQueueImpressions);
            }
            var trackingUrls = ad.trackingevents["tracking_".concat(timePoint)];
            if (trackingUrls) {
                (0, tools_1.sendBeaconRequest)(trackingUrls, errorHandler, useQueueImpressions);
            }
            adQuartile = (timePoint * 4) / 100;
            return true;
        });
        return adQuartile;
    };
}
exports.getAdTrackFn = getAdTrackFn;
var sendVASTErrorBeacon = function (ad, code, errorHandler) {
    if (ad.error) {
        // The error field might be encoded and we need to cover this case
        (0, tools_1.sendBeaconRequest)([ad.error.replace('[ERRORCODE]', code).replace('%5BERRORCODE%5D', code)], errorHandler);
    }
};
exports.sendVASTErrorBeacon = sendVASTErrorBeacon;
var getUrlForUnusedActions = function (url, code) {
    return url.replace('[TUBI:NOT_USED_ACTION]', code).replace('%5BTUBI:NOT_USED_ACTION%5D', code);
};
exports.getUrlForUnusedActions = getUrlForUnusedActions;
/**
 * Send beacon if ads is not used, it depends on the value of code
 * code=VAST_AD_NOT_USED.EXIT_MID_POD: currentAd is not used with flag `exit_mid_pod` and the ads in AdPods
 *  after currentAd is not used with flag `exit_pre_pod`
 * code=VAST_AD_NOT_USED.EXIT_PRE_POD: All ads in AdPods is not used with flag `exit_pre_pod`
 * code=VAST_AD_NOT_USED.FFWD: All ads in AdPods is not used with flag `ffwd`
 */
var sendVASTNotUsedBeacon = function (ads, code, currentAdIndex, errorHandler) {
    if (code === constants_1.VAST_AD_NOT_USED.EXIT_MID_POD && currentAdIndex > 0) {
        var playingAd = ads[currentAdIndex - 1];
        if (playingAd && playingAd.trackingevents && playingAd.trackingevents.not_used) {
            (0, tools_1.sendBeaconRequest)(playingAd.trackingevents.not_used.map(function (url) {
                return (0, exports.getUrlForUnusedActions)(url, code);
            }), errorHandler);
        }
        var notUsedUrls = ads.slice(currentAdIndex).reduce(function (prev, cur) {
            if (cur.trackingevents && cur.trackingevents.not_used) {
                var urls = cur.trackingevents.not_used;
                return prev.concat(urls);
            }
            return prev;
        }, []);
        (0, tools_1.sendBeaconRequest)(notUsedUrls.map(function (url) {
            return (0, exports.getUrlForUnusedActions)(url, constants_1.VAST_AD_NOT_USED.EXIT_PRE_POD);
        }), errorHandler);
    }
    else {
        var notUsedUrls = ads.slice().reduce(function (prev, cur) {
            if (cur.trackingevents && cur.trackingevents.not_used) {
                var urls = cur.trackingevents.not_used;
                return prev.concat(urls);
            }
            return prev;
        }, []);
        (0, tools_1.sendBeaconRequest)(notUsedUrls.map(function (url) {
            return (0, exports.getUrlForUnusedActions)(url, code);
        }), errorHandler);
    }
};
exports.sendVASTNotUsedBeacon = sendVASTNotUsedBeacon;
function getAdPodDuration(adPod) {
    return adPod.reduce(function (duration, ad) {
        return duration + ad.duration;
    }, 0);
}
exports.getAdPodDuration = getAdPodDuration;
//# sourceMappingURL=adTools.js.map