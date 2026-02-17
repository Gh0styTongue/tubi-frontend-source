"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoublyLinkedNode = exports.DoublyLinkedList = void 0;
var DoublyLinkedList = /** @class */ (function () {
    function DoublyLinkedList() {
        this.firstNode = null;
        this.lastNode = null;
    }
    DoublyLinkedList.prototype.moveToFront = function (node) {
        if (this.firstNode === node)
            return;
        this.remove(node);
        this.unshift(node);
    };
    DoublyLinkedList.prototype.isEmpty = function () {
        return this.firstNode === null;
    };
    /**
     * Add node to back of list
     */
    DoublyLinkedList.prototype.push = function (node) {
        if (this.lastNode === null) {
            this.firstNode = node;
            this.lastNode = node;
            node.prev = null;
            node.next = null;
        }
        else {
            node.prev = this.lastNode;
            node.next = null;
            node.prev.next = node;
            this.lastNode = node;
        }
    };
    DoublyLinkedList.prototype.pop = function () {
        var lastNode = this.lastNode;
        if (lastNode !== null) {
            this.remove(lastNode);
        }
        return lastNode;
    };
    /**
     * Remove node at front of list and return it
     */
    DoublyLinkedList.prototype.shift = function () {
        var firstNode = this.firstNode;
        if (firstNode !== null) {
            this.remove(firstNode);
        }
        return firstNode;
    };
    /**
     * Add node to front of list
     */
    DoublyLinkedList.prototype.unshift = function (node) {
        if (this.firstNode === null) {
            this.firstNode = node;
            this.lastNode = node;
            node.prev = null;
            node.next = null;
        }
        else {
            node.prev = null;
            node.next = this.firstNode;
            node.next.prev = node;
            this.firstNode = node;
        }
    };
    DoublyLinkedList.prototype.insertAfter = function (existing, node) {
        this.remove(node); // in case it already exists
        if (existing === this.lastNode) {
            this.push(node);
        }
        else {
            existing.next.prev = node;
            node.prev = existing;
            node.next = existing.next;
            existing.next = node;
        }
    };
    DoublyLinkedList.prototype.insertBefore = function (existing, node) {
        this.remove(node); // in case it already exists
        if (existing === this.firstNode) {
            this.unshift(node);
        }
        else {
            existing.prev.next = node;
            node.next = existing;
            node.prev = existing.prev;
            existing.prev = node;
        }
    };
    DoublyLinkedList.prototype.remove = function (node) {
        if (this.firstNode === node) {
            this.firstNode = node.next;
        }
        else if (node.prev !== null) {
            node.prev.next = node.next;
        }
        if (this.lastNode === node) {
            this.lastNode = node.prev;
        }
        else if (node.next !== null) {
            node.next.prev = node.prev;
        }
    };
    DoublyLinkedList.prototype.forEach = function (callback) {
        var node = this.firstNode;
        while (node !== null) {
            callback(node);
            node = node.next;
        }
    };
    DoublyLinkedList.prototype.find = function (callback) {
        var node = this.firstNode;
        while (node !== null) {
            if (callback(node))
                return node;
            node = node.next;
        }
        return null;
    };
    DoublyLinkedList.prototype.findLast = function (callback) {
        var node = this.lastNode;
        while (node !== null) {
            if (callback(node))
                return node;
            node = node.prev;
        }
        return null;
    };
    DoublyLinkedList.prototype.map = function (callback) {
        var newList = new DoublyLinkedList();
        this.forEach(function (node) { return newList.push(callback(node)); });
        return newList;
    };
    DoublyLinkedList.prototype.keys = function () {
        var keys = [];
        this.forEach(function (node) { return keys.push(node.key); });
        return keys;
    };
    DoublyLinkedList.prototype.values = function () {
        var values = [];
        this.forEach(function (node) { return values.push(node.val); });
        return values;
    };
    DoublyLinkedList.prototype.indexOf = function (node) {
        // A note about the lines ignored for coverage in this function:
        // They are not possible to hit currently because this class is not
        // exposed externally, even to tests, and the LRUCache class currently
        // prevents this function being called if the node is not in the list.
        // But I wanted to leave the lines in there for completeness, and in case
        // this class ever gets pulled out into a standalone thing.
        /* istanbul ignore next */
        if (!node || !this.firstNode)
            return -1;
        var index = 0;
        var current = this.firstNode;
        while (current && current !== node) {
            current = current.next;
            index++;
        }
        /* istanbul ignore next */
        if (!current)
            return -1;
        return index;
    };
    DoublyLinkedList.prototype.clear = function () {
        var currentNode = this.firstNode;
        while (currentNode !== null) {
            var nextNode = currentNode.next;
            currentNode.prev = null;
            currentNode.next = null;
            currentNode = nextNode;
        }
        this.firstNode = null;
        this.lastNode = null;
    };
    return DoublyLinkedList;
}());
exports.DoublyLinkedList = DoublyLinkedList;
var DoublyLinkedNode = /** @class */ (function () {
    function DoublyLinkedNode(key, val) {
        this.key = key;
        this.val = val;
        this.prev = null;
        this.next = null;
    }
    return DoublyLinkedNode;
}());
exports.DoublyLinkedNode = DoublyLinkedNode;
//# sourceMappingURL=doublyLinkedList.js.map