"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypes = void 0;
var EventTypes;
(function (EventTypes) {
    EventTypes["NEW_INBOUND_CALL"] = "NEW_INBOUND_CALL";
    EventTypes["ACTION_SUCCESSFUL"] = "ACTION_SUCCESSFUL";
    EventTypes["CALL_ANSWERED"] = "CALL_ANSWERED";
    EventTypes["ACTION_FAILED"] = "ACTION_FAILED";
    EventTypes["INVALID_LAMBDA_RESPONSE"] = "INVALID_LAMBDA_RESPONSE";
    EventTypes["HANGUP"] = "HANGUP";
})(EventTypes = exports.EventTypes || (exports.EventTypes = {}));
