import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/chime-action-types";
import { getAudioParameters } from "../utility/audio-parameters";
import { terminatingFlowAction } from "../utility/termination-action";
import { Attributes, ContextStore } from "../utility/constant-values";
import { IContextStore } from "../utility/contextStore";

/**
  * Making a SMA action to play the Audio from S3 bucket
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA Action
  */

export class PlayAudio {
    async processPlayAudio(smaEvent: any, action: any, contextStore:IContextStore) {
        let callId: string;
        let smaAction1: any;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            let pauseAction=contextStore[ContextStore.PAUSE_ACTION];
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(Attributes.DEFAULT_LOGGER + callId + "Play Audio Action");
            let audio_parameters = await getAudioParameters(smaEvent, action);
            let smaAction = {
                Type: ChimeActions.PLAY_AUDIO,
                Parameters: {
                    "CallId": callId,
                    "AudioSource": audio_parameters
                }
            };
            if (pauseAction) {
                smaAction1 = pauseAction;
                contextStore[ContextStore.PAUSE_ACTION]=null
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        [Attributes.CURRENT_FLOW_BLOCK]: action,
                        [Attributes.CONNECT_CONTEXT_STORE]:contextStore
                    }
                }

            }
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    [Attributes.CURRENT_FLOW_BLOCK]: action,
                    [Attributes.CONNECT_CONTEXT_STORE]:contextStore
                }
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of PlayAudio " + error.message);
            return await terminatingFlowAction(smaEvent,"error")
        }
    }

}
