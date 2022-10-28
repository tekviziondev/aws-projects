"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findActionByID = void 0;
/**
  * This function gets the ID of the Action and Returns the corresponding Amazon Connect Action Object
  * @param actions
  * @param identifier
  * @returns Amazon Connect Action Object
  */
function findActionByID(actions, identifier) {
    return actions.find((action) => action.Identifier === identifier);
}
exports.findActionByID = findActionByID;
