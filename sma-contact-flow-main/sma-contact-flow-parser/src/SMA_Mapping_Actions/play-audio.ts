import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/ChimeActionTypes";
import { getAudioParameters } from "../utility/audio-parameters";
import { terminatingFlowAction } from "../utility/termination-event";

/**
  * Making a SMA action to play the Audio from S3 bucket
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */

export class PlayAudio {
    async processPlayAudio(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any) {
        let callId: string;
        let smaAction1: any;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            console.log(defaultLogger + callId + "Play Audio Action");
            let smaAction = {
                Type: ChimeActions.PlayAudio,
                Parameters: {
                    "CallId": callId,
                    "AudioSource": getAudioParameters(smaEvent, action, defaultLogger)
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
            console.log(defaultLogger + callId + " There is an Error in execution of PlayAudio " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }
    }

}