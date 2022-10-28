"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallRecording = void 0;
const call_details_1 = require("../utility/call-details");
const ChimeActionTypes_1 = require("../utility/ChimeActionTypes");
const ConstantValues_1 = require("../utility/ConstantValues");
const termination_event_1 = require("../utility/termination-event");
/**
  * Making a SMA action to perform Call Recording.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class CallRecording {
    async processFlowActionUpdateContactRecordingBehavior(smaEvent, action, puaseAction, defaultLogger, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap) {
        let callId;
        let smaAction1;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            if (action.Parameters.RecordingBehavior.RecordedParticipants.length < 1) {
                let smaAction = {
                    Type: ChimeActionTypes_1.ChimeActions.StopCallRecording,
                    Parameters: {
                        "CallId": legA.CallId
                    }
                };
                if (puaseAction != null && puaseAction && puaseAction != "") {
                    smaAction1 = puaseAction;
                    puaseAction = null;
                    return {
                        "SchemaVersion": "1.0",
                        "Actions": [
                            smaAction1, smaAction
                        ],
                        "TransactionAttributes": {
                            "currentFlowBlock": action
                        }
                    };
                }
                return {
                    "SchemaVersion": "1.0",
                    "Actions": [
                        smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": action
                    }
                };
            }
            let smaAction = {
                Type: ChimeActionTypes_1.ChimeActions.StartCallRecording,
                Parameters: {
                    "CallId": legA.CallId,
                    "Track": ConstantValues_1.ConstData.Track,
                    Destination: {
                        "Type": ConstantValues_1.ConstData.destinationType,
                        "Location": ConstantValues_1.ConstData.destinationLocation
                    }
                }
            };
            if (puaseAction != null && puaseAction && puaseAction != "") {
                smaAction1 = puaseAction;
                puaseAction = null;
                return {
                    "SchemaVersion": "1.0",
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": action
                    }
                };
            }
            return {
                "SchemaVersion": "1.0",
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action
                }
            };
        }
        catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution UpdateContactRecordingBehavior" + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.CallRecording = CallRecording;
