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
    async processPlayAudio(smaEvent: any, action: any, defaultLogger: string, contextStore:any) {
        let callId: string;
        let smaAction1: any;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            let pauseAction=contextStore['pauseAction'];
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
                contextStore['pauseAction']=null
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": action,
                        "connectContextStore":contextStore
                    }
                }

            }
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action,
                    "connectContextStore":contextStore
                }
            }
        } catch (error) {
            console.error(defaultLogger + callId + " There is an Error in execution of PlayAudio " + error.message);
            return await terminatingFlowAction(smaEvent, defaultLogger,  "error")
        }
    }

}