"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisconnectParticipant = void 0;
const ChimeActionTypes_1 = require("../utility/ChimeActionTypes");
const call_details_1 = require("../utility/call-details");
/**
  * Making a SMA action to perform Ends the interaction.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class DisconnectParticipant {
    async processFlowActionDisconnectParticipant(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction) {
        let callId;
        let smaAction1;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        ContactFlowARNMap.delete(callId);
        contextAttributes.clear();
        ActualFlowARN.delete(callId);
        SpeechAttributeMap.clear();
        console.log(defaultLogger + callId + " is going to Hang up");
        let smaAction = {
            Type: ChimeActionTypes_1.ChimeActions.Hangup,
            Parameters: {
                "SipResponseCode": "0",
                "CallId": callId
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
exports.DisconnectParticipant = DisconnectParticipant;
