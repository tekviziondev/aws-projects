import { ChimeActions } from "../utility/chime-action-types";
import { getLegACallDetails } from "../utility/call-details";
import { Attributes, ContextStore } from "../utility/constant-values";
/**
  * Making a SMA action to perform Ends the interaction.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class DisconnectParticipant {
    async processFlowActionDisconnectParticipant(smaEvent: any, contextStore:any){
        let callId: string;
        let smaAction1: any;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
      
        console.log(Attributes.DEFAULT_LOGGER + callId + "| is going to Hang up");
        let smaAction = {
            Type: ChimeActions.HANGUP,
            Parameters: {
                "SipResponseCode": "0",
                "CallId": callId
            }
        };
        let pauseAction=contextStore[ContextStore.PAUSE_ACTION]
        if (pauseAction) {
            smaAction1 = pauseAction;
            contextStore[ContextStore.PAUSE_ACTION]=null
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction1, smaAction
                ],
            }

        }
        return {
            "SchemaVersion": Attributes.SCHEMA_VERSION,
            "Actions": [
                smaAction
            ],
            
        }
    }
}