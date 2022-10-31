import { ChimeActions } from "../utility/ChimeActionTypes";
import { getLegACallDetails } from "../utility/call-details";
/**
  * Making a SMA action to perform Ends the interaction.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class DisconnectParticipant {
    async processFlowActionDisconnectParticipant(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any) {
        let callId: string;
        let smaAction1: any;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        ContactFlowARNMap.delete(callId);
        contextAttributes.clear();
        ActualFlowARN.delete(callId);
        SpeechAttributeMap.clear();
        console.log(defaultLogger + callId + " is going to Hang up");
        let smaAction = {
            Type: ChimeActions.Hangup,
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
    }
}