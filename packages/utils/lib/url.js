"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractLiveStreamToken = exports.toCSSUrl = exports.trimQueryString = void 0;
var queryString_1 = require("./queryString");
/**
 * Remove query string and all things behind of it in the url
 */
var trimQueryString = function (url) {
    var startIndex = url.indexOf('?');
    return startIndex === -1 ? url : url.slice(0, startIndex);
};
exports.trimQueryString = trimQueryString;
/**
 * Returns "url(<providedUrl>)" with any parentheses or other special characters in the URL escaped.
 * @param url The desired URL
 * @returns {string} A string safe to use in inline styles for images and other static assets.
 */
var toCSSUrl = function (url) {
    if (!url)
        return '';
    // From the [CSSv2 spec](https://www.w3.org/TR/CSS2/syndata.html#:~:text=Some%20characters%20appearing%20in%20an%20unquoted%20URI%2C%20such%20as%20parentheses%2C%20white%20space%20characters%2C%20single%20quotes%20(%27)%20and%20double%20quotes%20(%22)%2C%20must%20be%20escaped%20with%20a%20backslash%20so%20that%20the%20resulting%20URI%20value%20is%20a%20URI%20token%3A%20%27%5C(%27%2C%20%27%5C)%27):
    // > Some characters appearing in an unquoted URI, such as parentheses, white space characters, single quotes (')
    // > and double quotes ("), must be escaped with a backslash so that the resulting URI value is a URI token: '\(', '\)'.
    var escapedUrl = url.replace(/([()\s'"])/g, '\\$1');
    return "url(".concat(escapedUrl, ")");
};
exports.toCSSUrl = toCSSUrl;
var extractLiveStreamToken = function (url) {
    try {
        // Create a URL object
        var urlObj = new URL(url);
        // Parse the query string into parameters
        var params = (0, queryString_1.parseQueryString)(urlObj.search);
        // Retrieve the token parameter
        var token = params.token || '';
        if (token) {
            // Shorten the token
            if (token.includes('.')) {
                // If it's a JWT, take the first 4 characters of each part
                var tokenParts = token.split('.');
                token = tokenParts.map(function (part) { return part.substring(0, 4); }).join('.');
            }
            else {
                // If it's not a JWT, keep the first and last 4 characters
                token = "".concat(token.substring(0, 4), "...").concat(token.substring(token.length - 4));
            }
        }
        // Return the modified or original URL
        return token || '';
    }
    catch (error) {
        // Return the original string if the URL is invalid
        return url.slice(0, 80);
    }
};
exports.extractLiveStreamToken = extractLiveStreamToken;
//# sourceMappingURL=url.js.map