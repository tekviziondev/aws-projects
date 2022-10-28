"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallRecording = void 0;
const call_details_1 = require("./utility/call-details");
const ChimeActionTypes_1 = require("./utility/ChimeActionTypes");
const ConstantValues_1 = require("./utility/ConstantValues");
/**
  * Making a SMA action to perform Call Recording.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class CallRecording {
    async processFlowActionUpdateContactRecordingBehavior(smaEvent, action, puaseAction) {
        let callId;
        let smaAction1;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
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
}
exports.CallRecording = CallRecording;
