"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFlowConditionValidation = void 0;
const call_details_1 = require("./call-details");
const find_action_id_1 = require("./find-action-id");
const termination_event_1 = require("./termination-event");
const contact_flow_processor_1 = require("../contact-flow-processor");
const AmazonConnectActionTypes_1 = require("./AmazonConnectActionTypes");
const next_action_error_1 = require("./next-action-error");
const ErrorTypes_1 = require("./ErrorTypes");
/**
  * This function will validate the Recieved digits based on the condition defined in the Block
  * @param smaEvent
  * @param actionObj
  * @param contactFlow
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param recieved_digits
  * @returns SMA Action
  */
async function processFlowConditionValidation(smaEvent, actionObj, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributs, ActualFlowARN, ContactFlowARNMap) {
    let currentAction = contactFlow.Actions.find((action) => action.Identifier === actionObj.Identifier);
    let smaAction;
    let nextAction;
    let nextAction_id;
    const condition = currentAction.Transitions.Conditions;
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    if (smaEvent != null && condition.length > 0) {
        for (let index = 0; index < condition.length; index++) {
            console.log(defaultLogger + callId + " Recieved Digits " + recieved_digits);
            console.log(defaultLogger + callId + " Condition Operands " + condition[index].Condition.Operands[0]);
            if (condition[index].Condition.Operands[0] === recieved_digits) {
                nextAction_id = condition[index].NextAction;
                console.log(defaultLogger + callId + " The condition passsed with recieved digit " + recieved_digits);
                console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                nextAction = (0, find_action_id_1.findActionByID)(contactFlow.Actions, nextAction_id);
                break;
            }
        }
        if (!nextAction_id && actionObj.Parameters.StoreInput == "False") {
            nextAction = await (0, next_action_error_1.getNextActionForError)(currentAction, contactFlow.Actions, ErrorTypes_1.ErrorTypes.NoMatchingCondition, smaEvent, defaultLogger);
            console.log(defaultLogger + callId + " Conditions are not matching with Recieved Digits ");
        }
        else if ((!nextAction_id && actionObj.Parameters.StoreInput == "True")) {
            nextAction = await (0, next_action_error_1.getNextActionForError)(currentAction, contactFlow.Actions, ErrorTypes_1.ErrorTypes.NoMatchingError, smaEvent, defaultLogger);
            console.log(defaultLogger + callId + " Conditions are not matching with Recieved Digits ");
        }
        console.log(defaultLogger + callId + " Next Action identifier:" + nextAction_id);
        let actionType = nextAction.Type;
        if (!AmazonConnectActionTypes_1.AmazonConnectActions.hasOwnProperty(actionType)) {
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributs, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, actionType);
        }
        return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName);
    }
}
exports.processFlowConditionValidation = processFlowConditionValidation;
