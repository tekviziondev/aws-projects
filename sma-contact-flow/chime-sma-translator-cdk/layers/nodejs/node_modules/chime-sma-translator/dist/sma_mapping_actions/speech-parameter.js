"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechParameter = void 0;
const call_details_1 = require("../utility/call-details");
const constant_values_1 = require("../const/constant-values");
const default_termination_action_1 = require("../utility/default-termination-action");
class SpeechParameter {
    /**
     * This method process Contact Flow speech related action object and returns the Speech Parameters for SpeakAndGetDigits
     * @param smaEvent
     * @param action
     * @param contextStore
     * @returns Speech Parameters
     */
    async getSpeechParameters(smaEvent, action, contextStore, error) {
        let callId;
        try {
            let rv = null;
            let voiceId = constant_values_1.Attributes.VOICE_ID;
            let engine = constant_values_1.Attributes.ENGINE;
            let languageCode = constant_values_1.Attributes.LANGUAGE_CODE;
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new call_details_1.CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let speechAttributes = contextStore[constant_values_1.ContextStore.SPEECH_ATTRIBUTES];
            let contextAttributes = contextStore[constant_values_1.ContextStore.CONTEXT_ATTRIBUTES];
            if (speechAttributes && speechAttributes.hasOwnProperty(constant_values_1.SpeechParameters.TEXT_TO_SPEECH_VOICE)) {
                voiceId = speechAttributes[constant_values_1.SpeechParameters.TEXT_TO_SPEECH_VOICE];
            }
            if (speechAttributes && speechAttributes.hasOwnProperty(constant_values_1.SpeechParameters.TEXT_TO_SPEECH_ENGINE)) {
                engine = speechAttributes[constant_values_1.SpeechParameters.TEXT_TO_SPEECH_ENGINE].toLowerCase();
            }
            if (speechAttributes && speechAttributes.hasOwnProperty(constant_values_1.SpeechParameters.LANGUAGE_CODE)) {
                languageCode = speechAttributes[constant_values_1.SpeechParameters.LANGUAGE_CODE];
            }
            let text;
            let type;
            if (error.includes("FailureSpeechParameters")) {
                if (constant_values_1.Attributes.Failure_Speech_SSML)
                    text = constant_values_1.Attributes.Failure_Speech_SSML;
                else
                    text = "<speak>  We're sorry.  We didn't get that. Please try again. <break time=\"200ms\"/></speak>";
                type = constant_values_1.Attributes.SSML;
            }
            else {
                console.log("Text value: " + action.Parameters.Text);
                if (action.Parameters.Text || action.Parameters.SSML) {
                    if (action.Parameters.Text) {
                        text = action.Parameters.Text;
                        // checking if the text contains any user defined, system or External attributes to replace with corresponding values
                        type = constant_values_1.Attributes.TEXT;
                    }
                    else if (action.Parameters.SSML) {
                        text = action.Parameters.SSML;
                        console.log("SSML value: " + action.Parameters.SSML);
                        type = constant_values_1.Attributes.SSML;
                    }
                }
            }
            if (text.includes("$.External.") || text.includes("$.Attributes.") || text.includes("$.")) {
                // checking if the text/SSML contains any user defined, system or External attributes to replace with corresponding values
                let x;
                let callDetails = new call_details_1.CallDetailsUtil();
                const keys = Object.keys(contextAttributes);
                console.log("Keys: " + keys);
                keys.forEach((key, index) => {
                    if (text.includes(key)) {
                        x = this.count(text, key);
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
        catch (error) {
            console.error(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of getting the Speech parameters " + error.message);
            return await new default_termination_action_1.TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error");
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
}
exports.SpeechParameter = SpeechParameter;
