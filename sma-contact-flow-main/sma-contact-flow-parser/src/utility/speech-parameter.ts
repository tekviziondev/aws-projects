import { getLegACallDetails } from "./call-details";
import { Attributes} from "./constant-values"
import { count} from "./count";
/**
  * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
  * @param smaEvent 
  * @param action
  * @param contextAttributs
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Speech Parameters
  */
export function getSpeechParameters(smaEvent:any,action: any,contextAttributs:Map<any, any>,SpeechAttributeMap:Map<string, string>,defaultLogger:string) {
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(!callId)
     callId=  smaEvent.ActionData.Parameters.CallId;
    let rv = null;
    let voiceId=Attributes.VOICE_ID
        let engine=Attributes.ENGINE
        let languageCode=Attributes.LANGUAGE_CODE
        if(SpeechAttributeMap.has("TextToSpeechVoice")){
            voiceId=SpeechAttributeMap.get("TextToSpeechVoice")
        }
        if(SpeechAttributeMap.has("TextToSpeechEngine")){
            engine=SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
        }
        if(SpeechAttributeMap.has("LanguageCode")){
            languageCode=SpeechAttributeMap.get("LanguageCode")
        }
    if (action.Text  || action.SSML) {
        let text: string;
        let type: string;
        let x:Number;
        if (action.Parameters.Text) {
            text = action.Parameters.Text;
            if(text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.") ){
                contextAttributs.forEach((value, key) => {
                    if(text.includes(key)){
                      x=count(text,key)
                      for (let index = 0; index < x; index++) {
                        text=text.replace(key,value)
                    }}

                  })
            }
            type = Attributes.TEXT;
        }
       else if (action.Parameters.SSML ) {
            text = action.Parameters.SSML;
            if(text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.") ){
                contextAttributs.forEach((value, key) => {
                    if(text.includes(key)){
                      x=count(text,key)
                      for (let index = 0; index < x; index++) {
                        text=text.replace(key,value)
                    }}

                  })
            }
            type = Attributes.SSML;
        }
        rv = {
            Text: text,
            TextType: type,
            Engine: engine,     
            LanguageCode:languageCode, 
            VoiceId:voiceId, 
        }
    }
    console.log(defaultLogger+callId+"Speech Parameters are : "+rv);
    return rv;
}
/**
  * This function process SMA Event and returns the Failure Speech Parameters for SpeakAndGetDigits
  * @param smaEvent 
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Failure Speech Parameters
  */
export function FailureSpeechParameters(smaEvent:any,SpeechAttributeMap:Map<string, string>,defaultLogger:string) {
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(!callId)
     callId=  smaEvent.ActionData.Parameters.CallId;
    let rv = null;
    let voiceId=Attributes.VOICE_ID
        let engine=Attributes.ENGINE
        let languageCode=Attributes.LANGUAGE_CODE
        if(SpeechAttributeMap.has("TextToSpeechVoice")){
            voiceId=SpeechAttributeMap.get("TextToSpeechVoice")
        }
        if(SpeechAttributeMap.has("TextToSpeechEngine")){
            engine=SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
        }
        if(SpeechAttributeMap.has("LanguageCode")){
            languageCode=SpeechAttributeMap.get("LanguageCode")
        }
   
        rv = {
            Text: "<speak>  We're sorry.  We didn't get that. Please try again. <break time=\"200ms\"/></speak>",
            TextType: Attributes.SSML,
            Engine: engine,     
            LanguageCode:languageCode, 
            VoiceId:voiceId, 
        } 
    console.log(defaultLogger+callId+"Speech Parameters are : "+rv);
    return rv;
}
