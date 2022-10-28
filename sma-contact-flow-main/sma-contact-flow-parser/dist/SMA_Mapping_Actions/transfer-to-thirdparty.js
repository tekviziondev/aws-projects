"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferTOThirdParty = void 0;
const call_details_1 = require("../utility/call-details");
const ConstantValues_1 = require("../utility/ConstantValues");
const ChimeActionTypes_1 = require("../utility/ChimeActionTypes");
const termination_event_1 = require("../utility/termination-event");
/**
  * Making a SMA action to perform Transfer a call to a phone number for voice interactions.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class TransferTOThirdParty {
    async processFlowActionTransferParticipantToThirdParty(smaEvent, action, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap) {
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        let callId;
        let smaAction1;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let fromNumber = legA.From;
        if (action.Parameters.hasOwnProperty("CallerId")) {
            fromNumber = action.Parameters.CallerId.Number;
        }
        try {
            console.log(defaultLogger + callId + " Transfering call to Third Party Number");
            let smaAction = {
                Type: ChimeActionTypes_1.ChimeActions.CallAndBridge,
                Parameters: {
                    "CallTimeoutSeconds": action.Parameters.ThirdPartyConnectionTimeLimitSeconds,
                    "CallerIdNumber": fromNumber,
                    "Endpoints": [
                        {
                            "BridgeEndpointType": ConstantValues_1.ConstData.BridgeEndpointType,
                            "Uri": action.Parameters.ThirdPartyPhoneNumber
                        }
                    ]
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
            console.log(defaultLogger + callId + " There is an Error in execution of TransferToThirdParty " + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.TransferTOThirdParty = TransferTOThirdParty;
