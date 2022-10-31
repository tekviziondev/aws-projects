import { getLegACallDetails } from "../utility/call-details";
import { ConstData } from "../utility/ConstantValues"
import { ChimeActions } from "../utility/ChimeActionTypes";
import { terminatingFlowAction } from "../utility/termination-event";
/**
  * Making a SMA action to perform Transfer a call to a phone number for voice interactions.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */

export class TransferTOThirdParty {
    async processFlowActionTransferParticipantToThirdParty(smaEvent: any, action: any, defaultLogger: string, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
        const legA = getLegACallDetails(smaEvent);
        let callId: string;
        let smaAction1: any;
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
                Type: ChimeActions.CallAndBridge,
                Parameters: {
                    "CallTimeoutSeconds": action.Parameters.ThirdPartyConnectionTimeLimitSeconds,
                    "CallerIdNumber": fromNumber,
                    "Endpoints": [
                        {
                            "BridgeEndpointType": ConstData.BridgeEndpointType,
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
                }

            }

            return {
                "SchemaVersion": "1.0",
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action
                }
            }
        } catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of TransferToThirdParty " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }

    }

}