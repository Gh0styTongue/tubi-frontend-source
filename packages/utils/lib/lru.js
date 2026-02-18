"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Taken from https://github.com/mhart/aws4/blob/master/lru.js, converted to Typescript and modified.
var doublyLinkedList_1 = require("./doublyLinkedList");
var LRUCache = /** @class */ (function () {
    function LRUCache(capacity) {
        this.capacity = capacity;
        // Object.create(null) creates an object that doesn't have any prototype, not even `Object.prototype`.
        // It is preferred when using objects as maps. See https://stackoverflow.com/q/15518328/.
        this.map = Object.create(null);
        this.list = new doublyLinkedList_1.DoublyLinkedList();
    }
    LRUCache.prototype.has = function (key) {
        return key in this.map;
    };
    /**
     * Retrieve the entry from the cache if it exists and moves it to the front of the list since it is being accessed.
     * @param key
     */
    LRUCache.prototype.get = function (key) {
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
    LRUCache.prototype.peek = function (key) {
        var _a;
        return (_a = this.map[key]) === null || _a === void 0 ? void 0 : _a.val;
    };
    LRUCache.prototype.set = function (key, val) {
        var node = this.map[key];
        if (node) {
            node.val = val;
        }
        else {
            if (!this.capacity)
                this.prune();
            if (!this.capacity)
                return false;
            node = new doublyLinkedList_1.DoublyLinkedNode(key, val);
            this.map[key] = node;
            this.capacity--;
        }
        this.used(node);
        return true;
    };
    LRUCache.prototype.remove = function (key) {
        if (!this.has(key)) {
            return false;
        }
        var node = this.map[key];
        this.list.remove(node);
        delete this.map[key];
        this.capacity++;
        return true;
    };
    LRUCache.prototype.clear = function () {
        while (!this.list.isEmpty()) {
            this.prune();
        }
    };
    LRUCache.prototype.isEmpty = function () {
        return this.list.isEmpty();
    };
    LRUCache.prototype.indexOf = function (key) {
        var node = this.map[key];
        if (!node)
            return -1;
        return this.list.indexOf(node);
    };
    LRUCache.prototype.used = function (node) {
        this.list.moveToFront(node);
    };
    LRUCache.prototype.prune = function () {
        var node = this.list.pop();
        if (node !== null) {
            delete this.map[node.key];
            this.capacity++;
        }
    };
    return LRUCache;
}());
exports.default = LRUCache;
//# sourceMappingURL=lru.js.map