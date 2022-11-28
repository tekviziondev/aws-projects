import { CallDetailsUtil } from "../utility/call-details";
import { Attributes, ContextStore, SpeechParameters } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { TerminatingFlowUtil } from "../utility/default-termination-action";

export abstract class SpeechParameter {
  /**
   * This method process Contact Flow speech related action object and returns the Speech Parameters for SpeakAndGetDigits
   * @param smaEvent
   * @param action
   * @param contextStore
   * @returns Speech Parameters
   */
  async getSpeechParameters(smaEvent: any, action: any, contextStore: IContextStore, error: any) {
    let callId: string;
    try {
      let rv = null;
      let voiceId = Attributes.VOICE_ID;
      let engine = Attributes.ENGINE;
      let languageCode = Attributes.LANGUAGE_CODE;
      // getting the CallID of the Active call from the SMA Event
      let callDetails = new CallDetailsUtil();
      const legA = callDetails.getLegACallDetails(smaEvent) as any;
      callId = legA.CallId;
      if (!callId) callId = smaEvent.ActionData.Parameters.CallId;
      let speechAttributes = contextStore[ContextStore.SPEECH_ATTRIBUTES];
      let contextAttributes = contextStore[ContextStore.CONTEXT_ATTRIBUTES];
      if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_VOICE)) {
        voiceId = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_VOICE];
      }
      if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_ENGINE)) {
        engine = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_ENGINE].toLowerCase();
      }
      if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.LANGUAGE_CODE)) {
        languageCode = speechAttributes[SpeechParameters.LANGUAGE_CODE];
      }
      let text: string;
      let type: string;
      if (error.includes("FailureSpeechParameters")) {
        if (Attributes.Failure_Speech_SSML)
          text = Attributes.Failure_Speech_SSML;
        else
          text = "<speak>  We're sorry.  We didn't get that. Please try again. <break time=\"200ms\"/></speak>";
        type = Attributes.SSML;
      }
      else {
        console.log("Text value: " + action.Parameters.Text);

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
      }
      if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
        // checking if the text/SSML contains any user defined, system or External attributes to replace with corresponding values
        let x: Number;
        let callDetails = new CallDetailsUtil();
        const keys = Object.keys(contextAttributes);
        console.log("Keys: " + keys);
        keys.forEach((key, index) => {
          if (text.includes(key)) {
            x = this.count(text, key) as any;
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
    } catch (error) {
      console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of getting the Speech parameters " + error.message);
      return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error");
    }
  }
  /**
  * This method will count the number of occurences of the string in the speech text 
  * @param str 
  * @param find
  * @returns count
  */
  count(str, find) {
    return (str.split(find)).length - 1;
  }
  abstract execute(smaEvent: any, action: any, contextStore: IContextStore): any;
}