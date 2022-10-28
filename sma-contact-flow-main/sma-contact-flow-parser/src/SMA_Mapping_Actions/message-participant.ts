import { getLegACallDetails } from "../utility/call-details";
import { ConstData } from "../utility/ConstantValues"
import { count } from "../utility/count";
import { ChimeActions } from "../utility/ChimeActionTypes";
import { terminatingFlowAction } from "../utility/termination-event";
import { PlayAudio } from "./play-audio";
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class MessageParticipant {
    async processFlowActionMessageParticipant(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any) {
        let callId: string;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            if (action.Parameters.Media != null) {
                console.log(defaultLogger + callId + "Play Audio Action");
                let playAudio = new PlayAudio();
                return await playAudio.processPlayAudio(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction);
            }
            let text: string;
            let type: string;
            let x: Number;
            let smaAction1: any;
            let voiceId = ConstData.voiceId
            let engine = ConstData.engine
            let languageCode = ConstData.languageCode
            if (SpeechAttributeMap.has("TextToSpeechVoice")) {
                voiceId = SpeechAttributeMap.get("TextToSpeechVoice")
            }
            if (SpeechAttributeMap.has("TextToSpeechEngine")) {
                engine = SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
            }
            if (SpeechAttributeMap.has("LanguageCode")) {
                languageCode = SpeechAttributeMap.get("LanguageCode")
            }
            if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text) {
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
                type = ConstData.text;
            }
            else if (action.Parameters.SSML !== null && action.Parameters.SSML) {
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
                type = ConstData.ssml;
            }
            if (text.includes("$.")) {
                return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "Invalid_Text")
            }
            let smaAction = {
                Type: ChimeActions.Speak,
                Parameters: {
                    Engine: engine,
                    CallId: legA.CallId,
                    Text: text,
                    TextType: type,
                    LanguageCode: languageCode,
                    VoiceId: voiceId

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
            console.log(defaultLogger + callId + " There is an Error in execution of MessageParticipant " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }

    }
}
