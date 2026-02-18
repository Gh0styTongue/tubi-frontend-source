"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BolaState = void 0;
var tslib_1 = require("tslib");
var tools_1 = require("../../utils/tools");
// BOLA (Buffer Occupancy-based Lyapunov Algorithm) implementation
// Based on dash.js BOLA rule: https://github.com/Dash-Industry-Forum/dash.js/blob/master/src/streaming/rules/abr/BolaRule.js
// Reference: "BOLA: Near-Optimal Bitrate Adaptation for Online Videos" (INFOCOM 2016)
var BolaState;
(function (BolaState) {
    BolaState["STARTUP"] = "STARTUP";
    BolaState["STEADY"] = "STEADY";
})(BolaState = exports.BolaState || (exports.BolaState = {}));
// Dash.js BOLA constants
var MINIMUM_BUFFER_S = 10; // BOLA should never add artificial delays if buffer is less than MINIMUM_BUFFER_S
var MINIMUM_BUFFER_PER_BITRATE_LEVEL_S = 2;
var PLACEHOLDER_BUFFER_DELAY = 0.99; // Make sure placeholder buffer does not stick around too long
var BolaRule = /** @class */ (function () {
    function BolaRule(abrController) {
        this.utilities = [];
        this.bufferTargets = [];
        this.initialized = false;
        this.state = BolaState.STARTUP;
        this.startupPeriod = 0;
        // Dash.js BOLA-specific parameters
        this.Vp = 0; // Video Player parameter for buffer time optimization
        this.gp = 0; // BOLA parameter for balancing quality vs buffer stability
        this.placeholderBuffer = 0; // Placeholder buffer for smooth transitions
        this.representations = []; // Store level representations
        this.currentRepresentation = null; // Current selected representation
        this.abrController = abrController;
        this.config = {
            bufferTarget: 30,
            minBufferLevel: 5,
            stableBufferTime: 12,
            startupPeriodCount: 4,
        };
    }
    BolaRule.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // Use debug function from utils/tools
        if (this.abrController && this.abrController.getHls() && this.abrController.getHls().config.debug) {
            (0, tools_1.debug)('[BOLA]').apply(void 0, args);
        }
    };
    BolaRule.prototype.getSwitchRequestResult = function (abrController) {
        this.abrController = abrController;
        var hls = abrController.getHls();
        var levels = hls.levels;
        var bufferLevel = abrController.getBufferLevel();
        var throughput = abrController.getSafeThroughput();
        if (levels.length === 0) {
            return {
                rule: this.constructor.name,
                level: undefined,
                reason: { message: 'No levels available' },
            };
        }
        // Initialize BOLA if needed
        if (!this.initialized) {
            this._initializeBola(levels);
        }
        // Update state based on buffer conditions
        this._updateBolaState(bufferLevel);
        var selectedLevel;
        var reason = 'No change';
        // Use state-specific handlers like dash.js
        switch (this.state) {
            case BolaState.STARTUP:
                selectedLevel = this._handleBolaStateStartup(levels, bufferLevel, throughput);
                reason = "BOLA startup state: ".concat(this.state);
                break;
            case BolaState.STEADY:
            default:
                selectedLevel = this._handleBolaStateSteady(levels, bufferLevel, throughput);
                reason = 'BOLA steady state';
                break;
        }
        this.log("[BOLA] State: ".concat(this.state, ", Buffer: ").concat(bufferLevel.toFixed(2), "s, ") +
            "Selected currentLevel) {\n            selectedLevel}, Vp: ".concat(this.Vp.toFixed(2), ", gp: ").concat(this.gp.toFixed(2), ", ") +
            "PlaceholderBuffer: ".concat(this.placeholderBuffer.toFixed(2), "s"));
        return {
            rule: this.constructor.name,
            level: selectedLevel,
            reason: {
                message: "".concat(reason, " - Buffer: ").concat(bufferLevel.toFixed(2), "s, Vp: ").concat(this.Vp.toFixed(2), ", gp: ").concat(this.gp.toFixed(2), ", PlaceholderBuffer: ").concat(this.placeholderBuffer.toFixed(2), "s"),
                throughput: throughput * 1000,
                bitrate: selectedLevel !== undefined && levels[selectedLevel] ? levels[selectedLevel].bitrate / 1000 : undefined,
            },
        };
    };
    BolaRule.prototype._initializeBola = function (levels) {
        /* istanbul ignore if: safety check only */
        if (levels.length === 0) {
            return;
        }
        // Store representations for dash.js compatibility
        this.representations = levels.map(function (level, index) { return (tslib_1.__assign(tslib_1.__assign({}, level), { bandwidth: level.bitrate, absoluteIndex: index })); });
        // Calculate utility values using dash.js normalization
        var bitrates = levels.map(function (level) { return level.bitrate; });
        var utilities = bitrates.map(function (b) { return Math.log(b); });
        utilities = utilities.map(function (u) { return u - utilities[0] + 1; }); // normalize like dash.js
        this.utilities = utilities;
        // Calculate BOLA parameters (Vp and gp) using dash.js algorithm
        this._calculateBolaParameters(this.config.bufferTarget, this.representations, this.utilities);
        // Calculate buffer targets for each quality level using BOLA algorithm
        this._calculateBufferTargets(levels);
        this.initialized = true;
    };
    /**
     * Calculate BOLA parameters (Vp and gp) based on dash.js algorithm
     * This is critical for proper BOLA operation
     */
    BolaRule.prototype._calculateBolaParameters = function (bufferTimeDefault, representations, utilities) {
        var highestUtilityIndex = utilities.reduce(function (highestIndex, u, uIndex) {
            return (u > utilities[highestIndex] ? uIndex : highestIndex);
        }, 0);
        // Calculate gp parameter
        this.gp = (utilities[highestUtilityIndex] - 1) / (bufferTimeDefault / MINIMUM_BUFFER_PER_BITRATE_LEVEL_S - 1);
        // Calculate Vp parameter
        this.Vp = MINIMUM_BUFFER_S + MINIMUM_BUFFER_PER_BITRATE_LEVEL_S;
        // Adjust for number of representations
        if (representations.length > 1) {
            this.Vp = MINIMUM_BUFFER_S + representations.length * MINIMUM_BUFFER_PER_BITRATE_LEVEL_S;
        }
    };
    BolaRule.prototype._calculateBufferTargets = function (levels) {
        var numLevels = levels.length;
        this.bufferTargets = new Array(numLevels);
        if (numLevels === 1) {
            this.bufferTargets[0] = this.config.bufferTarget;
            return;
        }
        // BOLA buffer target calculation using dash.js algorithm
        for (var i = 0; i < numLevels; i++) {
            if (i === 0) {
                // Lowest quality gets minimum buffer target
                this.bufferTargets[i] = this.config.minBufferLevel;
            }
            else if (i === numLevels - 1) {
                // Highest quality gets maximum buffer target
                this.bufferTargets[i] = this.config.bufferTarget;
            }
            else {
                // Intermediate qualities get interpolated targets
                var utilityDiff = this.utilities[i] - this.utilities[0];
                var maxUtilityDiff = this.utilities[numLevels - 1] - this.utilities[0];
                var targetRange = this.config.bufferTarget - this.config.minBufferLevel;
                this.bufferTargets[i] = this.config.minBufferLevel +
                    (utilityDiff / maxUtilityDiff) * targetRange;
            }
        }
    };
    BolaRule.prototype._updateBolaState = function (bufferLevel) {
        // Update placeholder buffer with delay
        this._updatePlaceholderBuffer();
        switch (this.state) {
            case BolaState.STARTUP:
                // Transition to steady when buffer is stable and we have enough history
                // This matches dash.js logic in _handleBolaStateStartup
                if (this.startupPeriod >= this.config.startupPeriodCount &&
                    bufferLevel >= this.config.stableBufferTime) {
                    this.state = BolaState.STEADY;
                }
                break;
            case BolaState.STEADY:
            default:
                // Stay in steady state unless buffer drops significantly
                // Return to startup if buffer becomes critically low
                if (bufferLevel < this.config.minBufferLevel) {
                    this.state = BolaState.STARTUP;
                }
                break;
        }
    };
    /**
     * Update placeholder buffer with delay factor (dash.js implementation)
     */
    BolaRule.prototype._updatePlaceholderBuffer = function () {
        this.placeholderBuffer *= PLACEHOLDER_BUFFER_DELAY;
    };
    /**
     * Core BOLA algorithm - get representation from buffer level using dash.js formula
     * This is the corrected algorithm that was wrong in the original implementation
     */
    BolaRule.prototype._getRepresentationFromBufferLevel = function (bufferLevel) {
        var bitrateCount = this.representations.length;
        var quality = 0;
        var score = -Infinity;
        for (var i = 0; i < bitrateCount; i++) {
            // CORRECTED DASH.JS FORMULA:
            // score = (Vp * (utility - 1 + gp) - bufferLevel) / bitrate
            var utility = this.utilities[i];
            var bitrate = this.representations[i].bandwidth;
            var s = (this.Vp * (utility - 1 + this.gp) - bufferLevel) / bitrate;
            if (s >= score) {
                score = s;
                quality = i;
            }
        }
        return this.representations[quality];
    };
    /**
     * Minimum buffer level which prefers to download at quality rather than wait
     */
    BolaRule.prototype._minBufferLevelForRepresentation = function (representation) {
        var absoluteIndex = representation.absoluteIndex;
        var qBitrate = representation.bandwidth;
        var qUtility = this.utilities[absoluteIndex];
        var min = 0;
        // For each bitrate less than current bitrate, BOLA should prefer quality
        for (var i = absoluteIndex - 1; i >= 0; i--) {
            if (this.utilities[i] < this.utilities[absoluteIndex]) {
                var iBitrate = this.representations[i].bandwidth;
                var iUtility = this.utilities[i];
                var level = this.Vp * (this.gp + (qBitrate * iUtility - iBitrate * qUtility) / (qBitrate - iBitrate));
                min = Math.max(min, level);
            }
        }
        return min;
    };
    /**
     * Maximum buffer level which prefers to download at quality rather than wait
     */
    BolaRule.prototype._maxBufferLevelForRepresentation = function (representation) {
        return this.Vp * (this.utilities[representation.absoluteIndex] + this.gp);
    };
    // Handle quality change requests (dash.js _onQualityChangeRequested implementation)
    BolaRule.prototype.onLevelSwitching = function (_abrController, data) {
        // Simple dash.js implementation: just update current representation
        if (data && this.representations.length > 0) {
            var newLevel = data.level;
            if (newLevel !== undefined && newLevel >= 0 && newLevel < this.representations.length) {
                this.currentRepresentation = this.representations[newLevel];
            }
        }
    };
    // Track successful buffer appends
    BolaRule.prototype.onBufferAppended = function (data) {
        if (data.frag.type === 'main') {
            this.startupPeriod++;
        }
    };
    // Reset BOLA state when seeking or on major buffer changes
    BolaRule.prototype.onSeeking = function () {
        this.initialized = false;
        this.utilities = [];
        this.bufferTargets = [];
        this.representations = [];
        this.state = BolaState.STARTUP;
        this.startupPeriod = 0;
        // Reset dash.js specific parameters
        this.Vp = 0;
        this.gp = 0;
        this.placeholderBuffer = 0;
        this.currentRepresentation = null;
    };
    // Handle buffer empty events (dash.js BUFFER_EMPTY event)
    BolaRule.prototype.onBufferEmpty = function () {
        // Reset placeholder buffer when buffer runs empty to avoid artificially inflating BOLA quality
        if (this.state === BolaState.STEADY) {
            this.placeholderBuffer = 0;
            this.log('[BOLA] Buffer empty detected - resetting placeholder buffer');
        }
    };
    // Handle fragment loaded events (dash.js MEDIA_FRAGMENT_LOADED event)
    BolaRule.prototype.onFragmentLoaded = function (abrController, data) {
        var _a;
        if (((_a = data === null || data === void 0 ? void 0 : data.frag) === null || _a === void 0 ? void 0 : _a.type) === 'main' && data.frag.level !== undefined) {
            this.startupPeriod++;
            // Extract segment information
            var segmentStart = data.frag.start;
            var segmentDuration = data.frag.duration;
            var levelIndex = data.frag.level;
            // Update current representation if we have it
            if (levelIndex >= 0 && levelIndex < this.representations.length) {
                this.currentRepresentation = this.representations[levelIndex];
                this.log("[BOLA] Fragment loaded: start=".concat(segmentStart.toFixed(2), "s, ") +
                    "duration=".concat(segmentDuration.toFixed(2), "s, level=").concat(levelIndex, ", ") +
                    "bitrate=".concat(this.currentRepresentation.bitrate, "bps"));
            }
            // Check transition to steady state based on segment count
            if (this.state === BolaState.STARTUP && this.startupPeriod >= 3) {
                var bufferLevel = abrController.getBufferLevel();
                if (bufferLevel >= this.config.minBufferLevel) {
                    this.state = BolaState.STEADY;
                    this.log('[BOLA] Transitioning to STEADY state after fragment loading');
                }
            }
        }
    };
    // Handle fragment loading abandonment (dash.js _onFragmentLoadingAbandoned implementation)
    BolaRule.prototype.onFragmentLoadingAbandoned = function (abrController) {
        if (this.currentRepresentation && this.state !== BolaState.STARTUP) {
            var bufferLevel = (abrController === null || abrController === void 0 ? void 0 : abrController.getBufferLevel()) || 0;
            // Deflate placeholderBuffer conservatively when abandoning (dash.js logic)
            var wantEffectiveBufferLevel = void 0;
            if (this.currentRepresentation.absoluteIndex > 0) {
                // Deflate to point where BOLA just chooses current quality over lower quality
                wantEffectiveBufferLevel = this._minBufferLevelForRepresentation(this.currentRepresentation);
            }
            else {
                // For lowest quality, use minimum buffer
                wantEffectiveBufferLevel = MINIMUM_BUFFER_S;
            }
            var maxPlaceholderBuffer = Math.max(0, wantEffectiveBufferLevel - bufferLevel);
            this.placeholderBuffer = Math.min(this.placeholderBuffer, maxPlaceholderBuffer);
            this.log('[BOLA] Fragment loading abandoned - deflated placeholder buffer to', this.placeholderBuffer.toFixed(2));
        }
    };
    BolaRule.prototype._handleBolaStateStartup = function (levels, bufferLevel, throughput) {
        // Implementation of _handleBolaStateStartup method
        var safeThroughput = throughput;
        if (isNaN(safeThroughput)) {
            return 0;
        }
        var representation = this._getOptimalRepresentationForBitrate(levels, safeThroughput);
        if (!representation) {
            return 0;
        }
        var selectedLevel = levels.findIndex(function (level) { return level.bitrate === representation.bandwidth; });
        // Set placeholder buffer for startup
        this.placeholderBuffer = Math.max(0, this._minBufferLevelForRepresentation(representation) - bufferLevel);
        this.currentRepresentation = representation;
        // Check if we should transition to steady state
        if (bufferLevel >= this.config.minBufferLevel) {
            this.state = BolaState.STEADY;
        }
        return selectedLevel >= 0 ? selectedLevel : 0;
    };
    BolaRule.prototype._handleBolaStateSteady = function (levels, bufferLevel, throughput) {
        // Update placeholder buffer using dash.js delay mechanism
        this._updatePlaceholderBuffer();
        // Use effective buffer level including placeholder buffer (key dash.js insight)
        var effectiveBufferLevel = bufferLevel + this.placeholderBuffer;
        // Get representation from buffer level using core BOLA algorithm
        var representation = this._getRepresentationFromBufferLevel(effectiveBufferLevel);
        // BOLA-O variant: avoid oscillations by checking throughput constraint
        var representationForThroughput = this._getOptimalRepresentationForBitrate(levels, throughput);
        if (this.currentRepresentation && representationForThroughput) {
            // Only intervene if we are trying to *increase* quality to an *unsustainable* level
            if (representation.absoluteIndex > this.currentRepresentation.absoluteIndex &&
                representation.absoluteIndex > representationForThroughput.absoluteIndex) {
                // Avoid oscillations - do not drop below last quality
                representation = representationForThroughput.absoluteIndex > this.currentRepresentation.absoluteIndex ?
                    representationForThroughput : this.currentRepresentation;
            }
        }
        // Avoid overfilling buffer with low quality chunks (dash.js buffer management)
        var delayS = Math.max(0, effectiveBufferLevel - this._maxBufferLevelForRepresentation(representation));
        // First reduce placeholder buffer, then schedule delay
        if (delayS <= this.placeholderBuffer) {
            this.placeholderBuffer -= delayS;
            delayS = 0;
        }
        else {
            delayS -= this.placeholderBuffer;
            this.placeholderBuffer = 0;
            // Note: In full dash.js implementation, this would signal schedule controller to delay
            // For HLS.js, we just log the recommended delay
            if (delayS > 0) {
                this.log("BOLA recommends delay of ".concat(delayS.toFixed(2), "s to avoid buffer overfill"));
            }
        }
        this.currentRepresentation = representation;
        var selectedLevel = levels.findIndex(function (level) { return level.bitrate === representation.bandwidth; });
        return selectedLevel >= 0 ? selectedLevel : 0;
    };
    /**
     * Get optimal representation for given bitrate (similar to dash.js abrController method)
     */
    BolaRule.prototype._getOptimalRepresentationForBitrate = function (levels, safeThroughput) {
        var safeThroughputBps = safeThroughput * 1000; // Convert kbps to bps
        // Find the highest bitrate that doesn't exceed safe throughput
        var selectedIndex = 0;
        for (var i = 0; i < levels.length; i++) {
            if (levels[i].bitrate <= safeThroughputBps) {
                selectedIndex = i;
            }
            else {
                break;
            }
        }
        if (selectedIndex < this.representations.length) {
            return this.representations[selectedIndex];
        }
        return this.representations[0] || null;
    };
    return BolaRule;
}());
exports.default = BolaRule;
//# sourceMappingURL=bolaRule.js.map