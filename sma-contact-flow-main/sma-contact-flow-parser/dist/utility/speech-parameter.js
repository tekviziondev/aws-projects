"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailureSpeechParameters = exports.getSpeechParameters = void 0;
const call_details_1 = require("./call-details");
const ConstantValues_1 = require("./ConstantValues");
const count_1 = require("./count");
/**
  * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
  * @param smaEvent
  * @param action
  * @param contextAttributs
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Speech Parameters
  */
function getSpeechParameters(smaEvent, action, contextAttributs, SpeechAttributeMap, defaultLogger) {
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (!callId)
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
        if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text) {
            text = action.Parameters.Text;
            if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
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
        else if (action.Parameters.SSML !== null && action.Parameters.SSML) {
            text = action.Parameters.SSML;
            if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
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
/**
  * This function process SMA Event and returns the Failure Speech Parameters for SpeakAndGetDigits
  * @param smaEvent
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Failure Speech Parameters
  */
function FailureSpeechParameters(smaEvent, SpeechAttributeMap, defaultLogger) {
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (!callId)
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
    rv = {
        Text: "<speak>  We're sorry.  We didn't get that. Please try again. <break time=\"200ms\"/></speak>",
        TextType: ConstantValues_1.ConstData.ssml,
        Engine: engine,
        LanguageCode: languageCode,
        VoiceId: voiceId,
    };
    console.log(defaultLogger + callId + "Speech Parameters are : " + rv);
    return rv;
}
exports.FailureSpeechParameters = FailureSpeechParameters;
