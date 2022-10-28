"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageParticipant = void 0;
const call_details_1 = require("./utility/call-details");
const ConstantValues_1 = require("./utility/ConstantValues");
const count_1 = require("./utility/count");
const ChimeActionTypes_1 = require("./utility/ChimeActionTypes");
const termination_event_1 = require("./utility/termination-event");
const play_audio_1 = require("./play-audio");
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class MessageParticipant {
    async processFlowActionMessageParticipant(smaEvent, action, SpeechAttributeMap, contextAttributs, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction) {
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        if (action.Parameters.Media != null) {
            console.log(defaultLogger + callId + "Play Audio Action");
            let playAudio = new play_audio_1.PlayAudio();
            return await playAudio.processPlayAudio(smaEvent, action, defaultLogger, puaseAction);
        }
        let text;
        let type;
        let x;
        let smaAction1;
        let voiceId = ConstantValues_1.ConstData.voiceId;
        let engine = ConstantValues_1.ConstData.engine;
        let languageCode = ConstantValues_1.ConstData.languageCode;
        if (SpeechAttributeMap.has("TextToSpeechVoice")) {
            voiceId = SpeechAttributeMap.get("TextToSpeechVoice");
        }
        if (SpeechAttributeMap.has("TextToSpeechEngine")) {
            engine = SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
        }
        if (SpeechAttributeMap.has("LanguageCode")) {
            languageCode = SpeechAttributeMap.get("LanguageCode");
        }
        if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text && action.Parameters.Text !== "undefined") {
            text = action.Parameters.Text;
            if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
                //text=textConvertor(text);
                contextAttributs.forEach((value, key) => {
                    if (text.includes(key)) {
                        x = (0, count_1.count)(text, key);
                        for (let index = 0; index < x; index++) {
                            text = text.replace(key, value);
                        }
                    }
                });
            }
            type = ConstantValues_1.ConstData.text;
        }
        else if (action.Parameters.SSML !== null && action.Parameters.SSML && action.Parameters.SSML !== "undefined") {
            text = action.Parameters.SSML;
            if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
                //text=textConvertor(text);
                contextAttributs.forEach((value, key) => {
                    if (text.includes(key)) {
                        x = (0, count_1.count)(text, key);
                        for (let index = 0; index < x; index++) {
                            text = text.replace(key, value);
                        }
                    }
                });
            }
            type = ConstantValues_1.ConstData.ssml;
        }
        if (text.includes("$.")) {
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributs, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "Invalid_Text");
        }
        let smaAction = {
            Type: ChimeActionTypes_1.ChimeActions.Speak,
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
            };
        }
        return {
            "SchemaVersion": "1.0",
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": action
            }
        };
    }
}
exports.MessageParticipant = MessageParticipant;
