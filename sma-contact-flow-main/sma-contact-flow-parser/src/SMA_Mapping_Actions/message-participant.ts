import { getLegACallDetails } from "../utility/call-details";
import { Attributes, ContextStore, SpeechParameters } from "../utility/constant-values"
import { count } from "../utility/count";
import { ChimeActions } from "../utility/chime-action-types";
import { terminatingFlowAction } from "../utility/termination-action";
import { PlayAudio } from "./play-audio";
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class MessageParticipant {
    async processFlowActionMessageParticipant(smaEvent: any, action: any, contextStore: any) {
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
            let text: string;
            let type: string;
            let x: Number;
            let smaAction1: any;
            let voiceId = Attributes.VOICE_ID
            let engine = Attributes.ENGINE
            let languageCode = Attributes.LANGUAGE_CODE 
            let speechAttributes = contextStore[ContextStore.SPEECH_ATTRIBUTES];
            let contextAttributes = contextStore[ContextStore.CONTEXT_ATTRIBUTES];
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION];
            if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_VOICE)) {
                voiceId = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_VOICE]
            }
            if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_ENGINE)) {
                engine = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_ENGINE].toLowerCase();
            }
            if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.LANGUAGE_CODE)) {
                languageCode = speechAttributes[SpeechParameters.LANGUAGE_CODE]
            }
            if (action.Parameters.Text) {
                text = action.Parameters.Text;
                if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
                    //text=textConvertor(text);
                    const keys = Object.keys(contextAttributes);
                    keys.forEach((key, index) => {
                        if (text.includes(key)) {
                            x = count(text, key)
                            for (let index = 0; index < x; index++) {
                                text = text.replace(key, contextAttributes[key])
                            }
                        }

                    });
                }
                type = Attributes.TEXT;
            }
            else if (action.Parameters.SSML) {
                text = action.Parameters.SSML;
                if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
                    //text=textConvertor(text);
                    const keys = Object.keys(contextAttributes);
                    keys.forEach((key, index) => {
                        if (text.includes(key)) {
                            x = count(text, key)
                            for (let index = 0; index < x; index++) {
                                text = text.replace(key, contextAttributes[key])
                            }
                        }

                    });
                    
                }
                type = Attributes.SSML;
            }
            if (text.includes("$.")) {
                return await terminatingFlowAction(smaEvent, "Invalid_Text")
            }
            let smaAction = {
                Type: ChimeActions.SPEAK,
                Parameters: {
                    Engine: engine,
                    CallId: legA.CallId,
                    Text: text,
                    TextType: type,
                    LanguageCode: languageCode,
                    VoiceId: voiceId

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