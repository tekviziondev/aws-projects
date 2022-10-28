"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count = void 0;
/**
  * This function will count the number of occurences of the of string in the Text
  * @param str
  * @param find
  * @returns count
  */
function count(str, find) {
    return (str.split(find)).length - 1;
}
exports.count = count;
