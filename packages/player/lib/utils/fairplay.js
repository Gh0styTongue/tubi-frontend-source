"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = setup;
/* istanbul ignore file */
/* eslint no-bitwise: 0 */
/**
 * This file provides some essential utilities for FairPlay 1.0 support. It heavily borrows
 * most of code from Apple's FPS_in_Safari_Example.html with some customized logic by video team.
 */
var tools_1 = require("./tools");
var constants_1 = require("../constants");
var log = (0, tools_1.debug)('FairPlay utility');
function stringToArray(str) {
    var buffer = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var array = new Uint16Array(buffer);
    var length = str.length;
    for (var i = 0; i < length; i++) {
        array[i] = str.charCodeAt(i);
    }
    return array;
}
function arrayToString(array) {
    var uint16array = new Uint16Array(array.buffer);
    return String.fromCharCode.apply(null, uint16array);
}
function base64DecodeUint8Array(input) {
    var raw = window.atob(input);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}
function base64EncodeUint8Array(input) {
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    var i = 0;
    while (i < input.length) {
        var chr1 = input[i++];
        var chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
        var chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here
        var enc1 = chr1 >> 2;
        var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        var enc4 = chr3 & 63;
        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        }
        else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}
function extractContentId(initData) {
    var contentId = arrayToString(initData);
    // For some reason this code really extracts the hostname, not the content ID as the original author intended.
    // So if the string begins with skd://, simply eliminate it and get the rest part
    if (contentId.startsWith('L\u0000skd://')) {
        contentId = contentId.substr(8);
        return contentId;
    }
    // contentId is passed up as a URI, from which the host must be extracted:
    var link = document.createElement('a');
    link.href = contentId;
    return link.hostname;
}
function concatInitDataIdAndCertificate(initData, id, cert) {
    // layout is [initData][4 byte: idLength][idLength byte: id][4 byte:certLength][certLength byte: cert]
    var offset = 0;
    var contentId = stringToArray(id);
    var buffer = new ArrayBuffer(initData.byteLength + 4 + contentId.byteLength + 4 + cert.byteLength);
    var dataView = new DataView(buffer);
    var initDataArray = new Uint8Array(buffer, offset, initData.byteLength);
    initDataArray.set(initData);
    offset += initData.byteLength;
    dataView.setUint32(offset, contentId.byteLength, true);
    offset += 4;
    var idArray = new Uint16Array(buffer, offset, contentId.length);
    idArray.set(contentId);
    offset += idArray.byteLength;
    dataView.setUint32(offset, cert.byteLength, true);
    offset += 4;
    var certArray = new Uint8Array(buffer, offset, cert.byteLength);
    certArray.set(cert);
    return new Uint8Array(buffer, 0, buffer.byteLength);
}
function setup(videoElement, keySystem, licenseUrl, certificate, onError) {
    var keySession;
    var contentId;
    function onneedkey(event) {
        var videoElement = event.target;
        var initData = event.initData;
        contentId = extractContentId(initData);
        var data = concatInitDataIdAndCertificate(initData, contentId, certificate);
        if (!videoElement.webkitKeys) {
            // This action will set `webkitKeys` on video element if no exception
            videoElement.webkitSetMediaKeys(new window.WebKitMediaKeys(keySystem));
        }
        if (!videoElement.webkitKeys) {
            onError({
                type: constants_1.ErrorType.DRM_ERROR,
                details: constants_1.PLAYER_ERROR_DETAILS.KEY_SYSTEM_NO_KEYS,
                fatal: true,
            });
            return;
        }
        keySession = videoElement.webkitKeys.createSession('video/mp4', data);
        if (!keySession) {
            onError({
                type: constants_1.ErrorType.DRM_ERROR,
                details: constants_1.PLAYER_ERROR_DETAILS.KEY_SYSTEM_NO_SESSION,
                fatal: true,
            });
            return;
        }
        keySession.addEventListener('webkitkeymessage', licenseRequestReady);
        keySession.addEventListener('webkitkeyerror', onkeyerror);
    }
    /**
     * This function assumes the Key Server Module understands the following POST format --
     * spc=<base64 encoded data>&assetId=<data>
     */
    function licenseRequestReady(event) {
        var message = event.message;
        var request = new XMLHttpRequest();
        request.responseType = 'text';
        request.addEventListener('load', licenseRequestLoaded, false);
        request.addEventListener('error', licenseRequestFailed, false);
        var body = "spc=".concat(base64EncodeUint8Array(message), "&assetId=").concat(encodeURIComponent(contentId));
        request.open('POST', licenseUrl, true);
        // application/x-www-form-urlencoded doesn't work for BuyDRM
        request.setRequestHeader('Content-Type', 'text/html; charset=utf-8');
        request.send(body);
    }
    function licenseRequestLoaded(event) {
        var request = event.target;
        // Report fatal error if status is either 4xx or 5xx
        if (request.status >= 400) {
            log('licenseRequestLoaded wrong status', request);
            onError({
                type: constants_1.ErrorType.DRM_ERROR,
                details: constants_1.PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
                fatal: true,
            });
            return;
        }
        // response can be of the form: '\n<ckc>base64encoded</ckc>\n', so trim the excess
        var keyText = request.responseText.trim();
        if (keyText.substr(0, 5) === '<ckc>' && keyText.substr(-6) === '</ckc>') {
            keyText = keyText.slice(5, -6);
        }
        keySession.update(base64DecodeUint8Array(keyText));
    }
    function licenseRequestFailed(event) {
        log('licenseRequestFailed', event);
        onError({
            type: constants_1.ErrorType.DRM_ERROR,
            details: constants_1.PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
            fatal: true,
        });
    }
    function onkeyerror(event) {
        log('onkeyerror', event);
        onError({
            type: constants_1.ErrorType.DRM_ERROR,
            details: constants_1.PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_INVALID_STATUS,
            fatal: true,
        });
    }
    videoElement.addEventListener('webkitneedkey', onneedkey, false);
    return function () {
        videoElement.removeEventListener('webkitneedkey', onneedkey);
    };
}
//# sourceMappingURL=fairplay.js.map