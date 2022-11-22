import { StringTargetList } from "aws-sdk/clients/transcribeservice";
import { getLegACallDetails } from "./call-details";
import { Attributes, ContextStore, SpeechParameters } from "./constant-values";
import { IContextStore } from "./context-store";
import { count } from "./count";
import { terminatingFlowAction } from "./termination-action";
/**
 * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
 * @param smaEvent
 * @param action
 * @param contextStore
 * @returns Speech Parameters
 */
export async function getSpeechParameters(smaEvent: any, action: any, contextStore: IContextStore) {
  let callId: string;
  try {
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (!callId) callId = smaEvent.ActionData.Parameters.CallId;
    let speechAttributes = contextStore[ContextStore.SPEECH_ATTRIBUTES];
    let contextAttributes = contextStore[ContextStore.CONTEXT_ATTRIBUTES];
    console.log("Text value: " + action.Parameters.Text);
    let text: string;
    let type: string;
    if (action.Parameters.Text || action.Parameters.SSML) {
      if (action.Parameters.Text) {
        text = action.Parameters.Text;
        // checking if the text contains any user defined, system or External attributes to replace with corresponding values
        type = Attributes.TEXT;
      } else if (action.Parameters.SSML) {
        text = action.Parameters.SSML;
        console.log("SSML value: " + action.Parameters.SSML);
        type = Attributes.SSML;
      }
    }
    return await speechParameters(text, type, speechAttributes, contextAttributes);
  } catch (error) {
    console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of getting the Speech parameters " + error.message);
    return await terminatingFlowAction(smaEvent, "error");
  }
}
/**
 * This function process SMA Event and returns the Failure Speech Parameters for SpeakAndGetDigits
 * @param smaEvent
 * @param SpeechAttributeMap
 * @param defaultLogger
 * @returns Failure Speech Parameters
 */
export async function FailureSpeechParameters(smaEvent: any, contextStore: any) {
  let callId: string;
  try {
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (!callId) callId = smaEvent.ActionData.Parameters.CallId;
    let speechAttributes = contextStore[ContextStore.SPEECH_ATTRIBUTES];
    let contextAttributes = contextStore[ContextStore.CONTEXT_ATTRIBUTES];
    let failureSpeech = "";
    if (Attributes.Failure_Speech_SSML)
      failureSpeech = Attributes.Failure_Speech_SSML;
    else
      failureSpeech = "<speak>  We're sorry.  We didn't get that. Please try again. <break time=\"200ms\"/></speak>";
    return await speechParameters(failureSpeech, Attributes.SSML, speechAttributes, contextAttributes);
  } catch (error) {
    console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of getting the Failure Speech parameters " + error.message);
    return await terminatingFlowAction(smaEvent, "error");
  }
}

async function speechParameters(text: string, type: string, speechAttributes: any, contextAttributes: any) {
  let rv = null;
  let voiceId = Attributes.VOICE_ID;
  let engine = Attributes.ENGINE;
  let languageCode = Attributes.LANGUAGE_CODE;
  if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_VOICE)) {
    voiceId = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_VOICE];
  }
  if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_ENGINE)) {
    engine = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_ENGINE].toLowerCase();
  }
  if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.LANGUAGE_CODE)) {
    languageCode = speechAttributes[SpeechParameters.LANGUAGE_CODE];
  }

  if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
    // checking if the text/SSML contains any user defined, system or External attributes to replace with corresponding values
    let x: Number;
    const keys = Object.keys(contextAttributes);
    console.log("Keys: " + keys);
    keys.forEach((key, index) => {
      if (text.includes(key)) {
        x = count(text, key);
        for (let index = 0; index < x; index++) {
          text = text.replace(key, contextAttributes[key]);
        }
      }
    });
  }
  rv = {
    Text: text,
    TextType: type,
    Engine: engine,
    LanguageCode: languageCode,
    VoiceId: voiceId,
  };
  return rv;
}
