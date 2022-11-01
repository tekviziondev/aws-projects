import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/chime-action-types";
import { getAudioParameters } from "../utility/audio-parameters";
import { terminatingFlowAction } from "../utility/termination-action";
import { Attributes } from "../utility/constant-values";

/**
  * Making a SMA action to play the Audio from S3 bucket
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */

export class PlayAudio {
    async processPlayAudio(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, pauseAction: any) {
        let callId: string;
        let smaAction1: any;
        try {
            const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
            console.log(defaultLogger + callId + "Play Audio Action");
            let smaAction = {
                Type: ChimeActions.PLAY_AUDIO,
                Parameters: {
                    "CallId": callId,
                    "AudioSource": getAudioParameters(smaEvent, action, defaultLogger)
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
        } catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of PlayAudio " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
        }
    }

}