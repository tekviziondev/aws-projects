import { ChimeActions } from "./chime-action-types";
import { getLegACallDetails } from "./call-details";
import { Attributes, ContextStore, SpeechParameters } from "./constant-values";
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
export async function terminatingFlowAction(smaEvent: any,  actionType: string) {
    let text: string;
    let type: string;
    let x: Number;
    let callId: string;

    try {
        let voiceId = Attributes.VOICE_ID
        let engine = Attributes.ENGINE
        let languageCode = Attributes.LANGUAGE_CODE
        let speechAttributes:any;
        if(smaEvent.CallDetails.TransactionAttributes)
        speechAttributes=smaEvent.CallDetails.TransactionAttributes[ContextStore.CONTEXT_ATTRIBUTES][ContextStore.SPEECH_ATTRIBUTES];
        if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_VOICE)) {
            voiceId = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_VOICE]
        }
        if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_ENGINE)) {
            engine = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_ENGINE].toLowerCase();
        }
        if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.LANGUAGE_CODE)) {
            languageCode = speechAttributes[SpeechParameters.LANGUAGE_CODE]
        }
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
       
        if (actionType == "Invalid_Text") {
            console.log(Attributes.DEFAULT_LOGGER + callId + "The Text to Speak has Invalid Attributes. The Flow is going to Terminate, Please Check the Flow");
            text = "There is an Invalid Attribute Present, your call is going to disconnect"
        }
        else if (actionType == "error") {
            text = "There is an Error in the Exceution"
        }
        else {
            console.log(Attributes.DEFAULT_LOGGER + callId + "The Action " + actionType + " is not supported , The Flow is going to Terminate, Please use only the Supported Action");
            text = "The action " + actionType + " is unsupported Action defined in the Contact flow, your call is going to disconnect"
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
        }
        let smaAction1 = {
            Type: ChimeActions.HANGUP,
            Parameters: {
                "SipResponseCode": "0",
                "CallId": callId
            }
        };
        return {
            "SchemaVersion": Attributes.SCHEMA_VERSION,
            "Actions": [smaAction, smaAction1]
        }
    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of Terminating Events" + error.message);
    }
}