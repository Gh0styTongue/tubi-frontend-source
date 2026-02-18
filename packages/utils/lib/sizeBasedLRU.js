"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Taken from https://github.com/mhart/aws4/blob/master/lru.js, converted to Typescript and modified.
var has_1 = __importDefault(require("lodash/has"));
var doublyLinkedList_1 = require("./doublyLinkedList");
var SizeBasedLRUCache = /** @class */ (function () {
    function SizeBasedLRUCache(maxSize, options) {
        this.maxSize = maxSize;
        // Object.create(null) creates an object that doesn't have any prototype, not even `Object.prototype`.
        // It is preferred when using objects as maps. See https://stackoverflow.com/q/15518328/.
        this.map = Object.create(null);
        this.list = new doublyLinkedList_1.DoublyLinkedList();
        this.totalSize = 0;
        this.onEviction = options === null || options === void 0 ? void 0 : options.onEviction;
    }
    Object.defineProperty(SizeBasedLRUCache.prototype, "size", {
        get: function () {
            return this.totalSize;
        },
        enumerable: false,
        configurable: true
    });
    SizeBasedLRUCache.prototype.values = function () {
        var values = [];
        for (var key in this.map) {
            if ((0, has_1.default)(this.map, key)) {
                values.push(this.map[key]);
            }
        }
        return values;
    };
    SizeBasedLRUCache.prototype.has = function (key) {
        return key in this.map;
    };
    /**
     * Retrieve the entry from the cache if it exists and moves it to the front of the list since it is being accessed.
     * @param key
     */
    SizeBasedLRUCache.prototype.get = function (key) {
        if (!this.has(key))
            return undefined;
        var node = this.map[key];
        this.used(node);
        return node.val;
    };
    /**
     * Retrieve the entry from the cache if it exists but don't alter its position in the list.
     * @param key
     */
    SizeBasedLRUCache.prototype.peek = function (key) {
        var _a;
        return (_a = this.map[key]) === null || _a === void 0 ? void 0 : _a.val;
    };
    SizeBasedLRUCache.prototype.set = function (key, val, context) {
        val.context = context;
        var size = val.size;
        if (size > this.maxSize) {
            return false;
        }
        var node = this.map[key];
        if (node) {
            this.totalSize -= node.val.size;
            node.val = val;
            this.used(node);
            this.totalSize += size;
            if (this.totalSize > this.maxSize) {
                var sizeNeeded = this.totalSize - this.maxSize;
                this.totalSize = this.maxSize;
                this.prune(sizeNeeded);
                this.totalSize += size - sizeNeeded;
            }
        }
        else {
            if (this.totalSize + size > this.maxSize)
                this.prune(size);
            node = new doublyLinkedList_1.DoublyLinkedNode(key, val);
            this.map[key] = node;
            this.totalSize += size;
        }
        this.used(node);
        return true;
    };
    SizeBasedLRUCache.prototype.remove = function (key) {
        var _a;
        if (!this.has(key)) {
            return false;
        }
        var node = this.map[key];
        (_a = this.onEviction) === null || _a === void 0 ? void 0 : _a.call(this, node.key, node.val);
        this.list.remove(node);
        this.totalSize -= node.val.size;
        delete this.map[key];
        return true;
    };
    SizeBasedLRUCache.prototype.clear = function () {
        var _this = this;
        this.list.forEach(function (node) {
            var _a;
            (_a = _this.onEviction) === null || _a === void 0 ? void 0 : _a.call(_this, node.key, node.val);
            delete _this.map[node.key];
        });
        this.list.clear();
        this.totalSize = 0;
    };
    SizeBasedLRUCache.prototype.isEmpty = function () {
        return this.list.isEmpty();
    };
    SizeBasedLRUCache.prototype.indexOf = function (key) {
        var node = this.map[key];
        if (!node)
            return -1;
        return this.list.indexOf(node);
    };
    SizeBasedLRUCache.prototype.setAsUtilized = function (key) {
        if (this.has(key)) {
            this.map[key].val.utilized = true;
        }
    };
    SizeBasedLRUCache.prototype.used = function (node) {
        this.list.moveToFront(node);
    };
    SizeBasedLRUCache.prototype.prune = function (sizeNeeded) {
        var _a;
        while (this.totalSize + sizeNeeded > this.maxSize && !this.list.isEmpty()) {
            var node = this.list.pop();
            if (node !== null) {
                (_a = this.onEviction) === null || _a === void 0 ? void 0 : _a.call(this, node.key, node.val);
                this.totalSize -= node.val.size;
                delete this.map[node.key];
            }
        }
    };
    return SizeBasedLRUCache;
}());
exports.default = SizeBasedLRUCache;
//# sourceMappingURL=sizeBasedLRU.js.map