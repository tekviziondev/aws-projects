"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextActionForError = void 0;
const call_details_1 = require("./call-details");
const find_action_id_1 = require("./find-action-id");
/**
  * Based on the Error condition, the Next action performed
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param defaultLogger
  * @returns SMA Action
  */
function getNextActionForError(currentAction, contactFlow, ErrorType, smaEvent, defaultLogger) {
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    let callId;
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    let nextAction;
    console.log(defaultLogger + callId + " Error Action Count:" + currentAction.Transitions.Errors);
    console.log(defaultLogger + callId + " Next Action Validation:" + currentAction.Transitions.Errors.length);
    if (currentAction.Transitions.Errors.length > 2 && currentAction.Transitions.Errors[2].ErrorType.includes(ErrorType)) {
        nextAction = (0, find_action_id_1.findActionByID)(contactFlow, currentAction.Transitions.Errors[2].NextAction);
        console.log(defaultLogger + callId + " Next Action identifier:" + currentAction.Transitions.Errors[2].NextAction);
    }
    else if (currentAction.Transitions.Errors.length > 1 && currentAction.Transitions.Errors[1].ErrorType.includes(ErrorType)) {
        nextAction = (0, find_action_id_1.findActionByID)(contactFlow, currentAction.Transitions.Errors[1].NextAction);
        console.log(defaultLogger + callId + " Next Action identifier:" + currentAction.Transitions.Errors[1].NextAction);
    }
    else if (currentAction.Transitions.Errors.length > 0 && currentAction.Transitions.Errors[0].ErrorType.includes(ErrorType)) {
        nextAction = (0, find_action_id_1.findActionByID)(contactFlow, currentAction.Transitions.Errors[0].NextAction);
        console.log(defaultLogger + callId + " Next Action identifier:" + currentAction.Transitions.Errors[0].NextAction);
    }
    return nextAction;
}
exports.getNextActionForError = getNextActionForError;
