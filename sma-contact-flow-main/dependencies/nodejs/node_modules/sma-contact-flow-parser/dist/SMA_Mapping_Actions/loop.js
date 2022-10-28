"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loop = void 0;
const call_details_1 = require("../utility/call-details");
const contact_flow_processor_1 = require("../contact-flow-processor");
const find_action_id_1 = require("../utility/find-action-id");
const termination_event_1 = require("../utility/termination-event");
/**
  * Making a SMA action to perform Repeats the looping branch for the specified number of times. After which, the complete branch is followed.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
class Loop {
    async processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, puaseAction, loopMap, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap) {
        let smaAction;
        let smaAction1;
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            if (!loopMap.has(callId) || loopMap.get(callId) != action.Parameters.LoopCount) {
                const nextAction = (0, find_action_id_1.findActionByID)(actions, action.Transitions.Conditions[1].NextAction);
                console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.Conditions[1].NextAction);
                smaAction = await (await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
                let count = String(Number.parseInt(loopMap.get(callId)) + 1);
                if (!loopMap.has(callId))
                    loopMap.set(callId, "1");
                else
                    loopMap.set(callId, count);
                console.log("Next Action Data:" + smaAction);
                if (puaseAction != null && puaseAction && puaseAction != "") {
                    smaAction1 = puaseAction;
                    puaseAction = null;
                    return {
                        "SchemaVersion": "1.0",
                        "Actions": [
                            smaAction1, smaAction
                        ],
                        "TransactionAttributes": {
                            "currentFlowBlock": nextAction
                        }
                    };
                }
                return {
                    "SchemaVersion": "1.0",
                    "Actions": [
                        smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": nextAction
                    }
                };
            }
            else {
                loopMap.delete(callId);
                let nextAction = (0, find_action_id_1.findActionByID)(actions, action.Transitions.Conditions[0].NextAction);
                console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
                return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
            }
        }
        catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of Loop " + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.Loop = Loop;
