"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wait = void 0;
const call_details_1 = require("./utility/call-details");
const ChimeActionTypes_1 = require("./utility/ChimeActionTypes");
const ConstantValues_1 = require("./utility/ConstantValues");
const contact_flow_processor_1 = require("./contact-flow-processor");
/**
  * Making a SMA action to perform Wait for a specified period of time.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
class Wait {
    async processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, puaseAction) {
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        console.log(defaultLogger + callId + " Pause Action");
        let timeLimit = getWaitTimeParameter(action);
        let smaAction = {
            Type: ChimeActionTypes_1.ChimeActions.Pause,
            Parameters: {
                "DurationInMilliseconds": timeLimit
            }
        };
        const nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
        console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
        let smaAction1 = await (await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
        let smaAction1_Type = nextAction.Type;
        if (ConstantValues_1.constActions.includes(smaAction1_Type)) {
            console.log(defaultLogger + callId + " Pause action is Performed for " + timeLimit + " Milliseconds");
            puaseAction = smaAction;
            return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        }
        console.log(defaultLogger + callId + "Next Action Data:" + smaAction1);
        return {
            "SchemaVersion": "1.0",
            "Actions": [
                smaAction, smaAction1
            ],
            "TransactionAttributes": {
                "currentFlowBlock": nextAction
            }
        };
    }
}
exports.Wait = Wait;
function getWaitTimeParameter(action) {
    let rv;
    if (action.TimeLimitSeconds !== null) {
        let seconds;
        const timeLimitSeconds = Number.parseInt(action.Parameters.TimeLimitSeconds);
        rv = String(timeLimitSeconds * 1000);
    }
    console.log("Wait Parameter : " + rv);
    return rv;
}
function findActionByID(actions, identifier) {
    return actions.find((action) => action.Identifier === identifier);
}
