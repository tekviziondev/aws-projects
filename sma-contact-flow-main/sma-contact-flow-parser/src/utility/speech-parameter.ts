import { getLegACallDetails } from "./call-details";
import { Attributes } from "./constant-values"
import { count } from "./count";
import { terminatingFlowAction } from "./termination-action";
/**
  * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
  * @param smaEvent 
  * @param action
  * @param contextAttributes
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Speech Parameters
  */
export async function getSpeechParameters(smaEvent: any, action: any, contextAttributes: Map<any, any>, SpeechAttributeMap: Map<string, string>, defaultLogger: string, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, pauseAction: any) {
    let callId: string;
    try {
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let rv = null;
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
        if (action.Text || action.SSML) {
            let text: string;
            let type: string;
            let x: Number;
            if (action.Parameters.Text) {
                text = action.Parameters.Text;
                // checking if the text contains any user defined, system or External attributes to replace with corresponding values
                if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
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
                // checking if the SSML contains any user defined, system or External attributes to replace with corresponding values
                if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
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
            rv = {
                Text: text,
                TextType: type,
                Engine: engine,
                LanguageCode: languageCode,
                VoiceId: voiceId,
            }
        }
        console.log(defaultLogger + callId + "Speech Parameters are : " + rv);
        return rv;
    } catch (error) {
        console.error(defaultLogger + callId + " There is an Error in execution of getting the Speech parameters " + error.message);
        return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
    }
}
/**
  * This function process SMA Event and returns the Failure Speech Parameters for SpeakAndGetDigits
  * @param smaEvent 
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Failure Speech Parameters
  */
export async function FailureSpeechParameters(smaEvent: any, action: any, contextAttributes: Map<any, any>, SpeechAttributeMap: Map<string, string>, defaultLogger: string, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, pauseAction: any) {
    let callId: string;
    let rv: any
    try {
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;

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

        rv = {
            Text: Attributes.Failure_Speech_SSML,
            TextType: Attributes.SSML,
            Engine: engine,
            LanguageCode: languageCode,
            VoiceId: voiceId,
        }
        console.log(defaultLogger + callId + "Speech Parameters are : " + rv);
        return rv;
    } catch (error) {
        console.error(defaultLogger + callId + " There is an Error in execution of getting the Failure Speech parameters " + error.message);
        return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
    }
}
