"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpeechParameters = void 0;
const call_details_1 = require("./call-details");
const ConstantValues_1 = require("./utility/ConstantValues");
const count_1 = require("./count");
function getSpeechParameters(smaEvent, action, contextAttributs, SpeechAttributeMap, defaultLogger) {
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    let rv = null;
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
    if (action.Text !== null || action.SSML !== null) {
        let text;
        let type;
        let x;
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
        rv = {
            Text: text,
            TextType: type,
            Engine: engine,
            LanguageCode: languageCode,
            VoiceId: voiceId,
        };
    }
    console.log(defaultLogger + callId + "Speech Parameters are : " + rv);
    return rv;
}
exports.getSpeechParameters = getSpeechParameters;
