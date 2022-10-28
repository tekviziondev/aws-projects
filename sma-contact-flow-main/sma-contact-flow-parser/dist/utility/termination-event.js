"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminatingFlowAction = void 0;
const ChimeActionTypes_1 = require("./ChimeActionTypes");
const call_details_1 = require("./call-details");
const ConstantValues_1 = require("./ConstantValues");
/**
  * This Terminates the existing call if there are any error occured in the Flow execution
  * @param smaEvent
  * @param SpeechAttributeMap
  * @param contextAttributes
  * @param ActualFlowARN
  * @param ContactFlowARNMap
  * @param defaultLogger
  * @param actionType
  * @returns SMA Error Speak Action and Hang UP action
  */
async function terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, actionType) {
    let text;
    let type;
    let x;
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
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    ContactFlowARNMap.delete(callId);
    contextAttributes.clear();
    ActualFlowARN.delete(callId);
    SpeechAttributeMap.clear();
    if (actionType == "Invalid_Text") {
        console.log(defaultLogger + callId + "The Text to Speak has Invalid Attributes. The Flow is going to Terminate, Please Check the Flow");
        text = "There is an Invalid Attribute Present, your call is going to disconnect";
    }
    else if (actionType == "error") {
        text = "There is an Error in the Exceution";
    }
    else {
        console.log(defaultLogger + callId + "The Action " + actionType + " is not supported , The Flow is going to Terminate, Please use only the Supported Action");
        text = "The action " + actionType + " is unsupported Action defined in the Contact flow, your call is going to disconnect";
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
    let smaAction1 = {
        Type: ChimeActionTypes_1.ChimeActions.Hangup,
        Parameters: {
            "SipResponseCode": "0",
            "CallId": callId
        }
    };
    return {
        "SchemaVersion": "1.0",
        "Actions": [smaAction, smaAction1]
    };
}
exports.terminatingFlowAction = terminatingFlowAction;
