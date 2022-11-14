import { getLegACallDetails } from "../utility/call-details";
import { Attributes, ContextStore, SpeechParameters } from "../utility/constant-values"
import { count } from "../utility/count";
import { ChimeActions } from "../utility/chime-action-types";
import { terminatingFlowAction } from "../utility/termination-action";
import { PlayAudio } from "./play-audio";
import { getSpeechParameters } from "../utility/speech-parameter";
import { IContextStore } from "../utility/contextStore";
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA Action
  */
export class MessageParticipant {
    async processFlowActionMessageParticipant(smaEvent: any, action: any, contextStore:IContextStore) {
        let callId: string;
        const legA = getLegACallDetails(smaEvent);
        try {
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.Media != null) {
                console.log(Attributes.DEFAULT_LOGGER + callId + "Play Audio Action");
                let playAudio = new PlayAudio();
                return await playAudio.processPlayAudio(smaEvent, action, contextStore);
            }
            let smaAction1: any;
            let engine = Attributes.ENGINE
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION];
            let speech_parameter = await getSpeechParameters(smaEvent, action, contextStore)
               if (speech_parameter['Text'].includes("$.")) {
                return await terminatingFlowAction(smaEvent, "Invalid_Text")
            }
            let smaAction = {
                Type: ChimeActions.SPEAK,
                Parameters: {
                    Engine: engine,
                    CallId: legA.CallId,
                    Text: speech_parameter['Text'],
                    TextType: speech_parameter['TextType'],
                    LanguageCode: speech_parameter['LanguageCode'],
                    VoiceId: speech_parameter['VoiceId']

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
                        [Attributes.CONNECT_CONTEXT_STORE]: contextStore
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
                    [Attributes.CONNECT_CONTEXT_STORE]: contextStore
                }
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of MessageParticipant " + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }

    }
}
