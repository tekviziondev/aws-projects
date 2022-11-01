import { getLegACallDetails } from "../utility/call-details";
import { Attributes } from "../utility/constant-values"
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
    async processFlowActionMessageParticipant(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, pauseAction: any) {
        let callId: string;
        const legA = getLegACallDetails(smaEvent);
        try {
            callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.Media != null) {
                console.log(defaultLogger + callId + "Play Audio Action");
                let playAudio = new PlayAudio();
                return await playAudio.processPlayAudio(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction);
            }
            let text: string;
            let type: string;
            let x: Number;
            let smaAction1: any;
            let voiceId = Attributes.VOICE_ID
            let engine = Attributes.ENGINE
            let languageCode = Attributes.LANGUAGE_CODE
            if (SpeechAttributeMap.has("TextToSpeechVoice")) {
                voiceId = SpeechAttributeMap.get("TextToSpeechVoice")
            }
            if (SpeechAttributeMap.has("TextToSpeechEngine")) {
                engine = SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
            }
            if (SpeechAttributeMap.has("LanguageCode")) {
                languageCode = SpeechAttributeMap.get("LanguageCode")
            }
            if (action.Parameters.Text) {
                text = action.Parameters.Text;
                if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
                    //text=textConvertor(text);
                    contextAttributes.forEach((value, key) => {
                        if (text.includes(key)) {
                            x = count(text, key)
                            for (let index = 0; index < x; index++) {
                                text = text.replace(key, value)
                            }
                        }

                    })
                }
                type = Attributes.TEXT;
            }
            else if (action.Parameters.SSML) {
                text = action.Parameters.SSML;
                if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
                    //text=textConvertor(text);
                    contextAttributes.forEach((value, key) => {
                        if (text.includes(key)) {
                            x = count(text, key)
                            for (let index = 0; index < x; index++) {
                                text = text.replace(key, value)
                            }
                        }

                    })
                }
                type = Attributes.SSML;
            }
            if (text.includes("$.")) {
                return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "Invalid_Text")
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
            console.log(defaultLogger + callId + " There is an Error in execution of MessageParticipant " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
        }

    }
}