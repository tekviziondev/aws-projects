import { ChimeActions } from "./ChimeActionTypes";
import { getLegACallDetails } from "./call-details";
import { constActions, ConstData } from "./ConstantValues";
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
export async function terminatingFlowAction(smaEvent: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any, actionType: string) {
    let text: string;
    let type: string;
    let x: Number;
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
    let callId: string;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    ContactFlowARNMap.delete(callId);
    contextAttributes.clear();
    ActualFlowARN.delete(callId);
    SpeechAttributeMap.clear();
    if (actionType == "Invalid_Text") {
        console.log(defaultLogger + callId + "The Text to Speak has Invalid Attributes. The Flow is going to Terminate, Please Check the Flow");
        text = "There is an Invalid Attribute Present, your call is going to disconnect"
    }
    else if (actionType == "error") {
        text = "There is an Error in the Exceution"
    }
    else {
        console.log(defaultLogger + callId + "The Action " + actionType + " is not supported , The Flow is going to Terminate, Please use only the Supported Action");
        text = "The action " + actionType + " is unsupported Action defined in the Contact flow, your call is going to disconnect"
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
    }
    let smaAction1 = {
        Type: ChimeActions.Hangup,
        Parameters: {
            "SipResponseCode": "0",
            "CallId": callId
        }
    };
    return {
        "SchemaVersion": "1.0",
        "Actions": [smaAction, smaAction1]
    }
}