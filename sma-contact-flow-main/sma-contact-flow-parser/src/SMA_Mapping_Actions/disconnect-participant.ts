import { ChimeActions } from "../utility/chime-action-types";
import { getLegACallDetails } from "../utility/call-details";
import { Attributes } from "../utility/constant-values";
/**
  * Making a SMA action to perform Ends the interaction.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class DisconnectParticipant {
    async processFlowActionDisconnectParticipant(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, pauseAction: any) {
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
        console.log(defaultLogger + callId + "| is going to Hang up");
        let smaAction = {
            Type: ChimeActions.HANGUP,
            Parameters: {
                "SipResponseCode": "0",
                "CallId": callId
            }
        };
        if (pauseAction) {
            smaAction1 = pauseAction;
            pauseAction = null;
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction1, smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action
                }
            }

        }
        return {
            "SchemaVersion": Attributes.SCHEMA_VERSION,
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": action
            }
        }
    }
}