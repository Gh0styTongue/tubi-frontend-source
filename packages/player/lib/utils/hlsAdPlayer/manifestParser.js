"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestParser = void 0;
var ManifestParser = /** @class */ (function () {
    function ManifestParser(options) {
        this.options = options;
    }
    ManifestParser.prototype.buildUrl = function (baseUrl, hlsUrl) {
        // absolute URL
        if (hlsUrl.startsWith('http://') || hlsUrl.startsWith('https://')) {
            return hlsUrl;
        }
        // absolute path to root
        if (hlsUrl.startsWith('/')) {
            return baseUrl.substring(0, baseUrl.indexOf('/', baseUrl.indexOf('://') + 3)) + hlsUrl;
        }
        return baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1) + hlsUrl;
    };
    ManifestParser.prototype.getAttributes = function (attributes) {
        var attrName = '';
        var attrValue = '';
        var quoted = false;
        var attribute = false;
        var results = {};
        for (var _i = 0, attributes_1 = attributes; _i < attributes_1.length; _i++) {
            var character = attributes_1[_i];
            if (attribute) {
                if (attrValue === '' && character === '"') {
                    quoted = true;
                }
                else if ((quoted && character === '"') ||
                    (!quoted && character === ',')) {
                    quoted = false;
                    results[attrName] = attrValue;
                    attrName = '';
                    attribute = false;
                }
                else {
                    attrValue += character;
                }
            }
            else if (character === '=') {
                attribute = true;
                attrValue = '';
            }
            else {
                attrName += character;
            }
        }
        if (attrName) {
            results[attrName] = attrValue;
        }
        return results;
    };
    /**
     * Selects which level to load.
     * If we have no bandwidth estimate we use the smallest 480p
     * If we have bandwidth estimate we use 720p if enough bandwidth
     */
    ManifestParser.prototype.selectLevelToLoad = function (levels) {
        var lowest480p;
        var lowest720p;
        var bandwidthEstimate = this.options.bandwidthEstimate || -1;
        for (var _i = 0, levels_1 = levels; _i < levels_1.length; _i++) {
            var level = levels_1[_i];
            if (level.resolution.length !== 2) {
                continue;
            }
            var height = Number(level.resolution[1]);
            if (!lowest480p && height === 480) {
                lowest480p = level;
            }
            else if (height === 720) {
                lowest720p = level;
                break;
            }
        }
        if (bandwidthEstimate !== -1 && lowest720p && lowest720p.bandwidth < (bandwidthEstimate / 2)) {
            return lowest720p;
        }
        return lowest480p || levels[0];
    };
    ManifestParser.prototype.getLevelFromManifest = function (adUrl, responseText) {
        var levels = [];
        try {
            var lines = responseText.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.startsWith('#EXT-X-STREAM-INF:')) {
                    var tags = this.getAttributes(line.substring(18));
                    levels.push({ variant: this.buildUrl(adUrl, lines[i + 1]), resolution: String(tags.RESOLUTION).split('x'), bandwidth: Number(tags.BANDWIDTH), codecs: tags.CODECS });
                }
            }
        }
        catch (e) {
            throw new Error("error parsing main manifest ".concat(String(e)));
        }
        if (levels.length === 0) {
            throw new Error('empty manifest detected');
        }
        return this.selectLevelToLoad(levels);
    };
    ManifestParser.prototype.getMetadataFromVariant = function (variantUrl, responseText) {
        var segments = [];
        try {
            var lines = responseText.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.startsWith('#EXTINF:')) {
                    segments.push({
                        url: this.buildUrl(variantUrl, lines[i + 1]),
                        duration: Number(line.substring(8, line.indexOf(','))),
                    });
                }
            }
        }
        catch (e) {
            throw new Error("error parsing variant ".concat(String(e)));
        }
        if (segments.length === 0) {
            throw new Error('no segments found in manifest');
        }
        return {
            segments: segments,
        };
    };
    return ManifestParser;
}());
exports.ManifestParser = ManifestParser;
//# sourceMappingURL=manifestParser.js.map