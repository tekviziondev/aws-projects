"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count = void 0;
function count(str, find) {
    return (str.split(find)).length - 1;
}
exports.count = count;
