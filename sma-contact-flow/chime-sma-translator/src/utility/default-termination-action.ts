/*
Copyright (c) 2023 tekVizion PVS, Inc. 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { ChimeActions } from "../const/chime-action-types";
import { CallDetailsUtil } from "./call-details";
import { Attributes, ContextStore, SpeechParameters } from "../const/constant-values";
import { METRIC_PARAMS } from "../const/constant-values"
import { CloudWatchMetric } from "./metric-updation"

export class TerminatingFlowUtil {

    /**
      * This Terminates the existing call if there are any error occured in the Flow execution
      * @param smaEvent 
      * @param actionType
      * @returns SMA Error Speak Action and Hang UP action
      */
    async terminatingFlowAction(smaEvent: any, actionType: string) {
        let text: string;
        let type: string;
        let x: Number;
        let callId: string;
        let contextStore = smaEvent.CallDetails.TransactionAttributes.ConnectContextStore
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            let voiceId = Attributes.VOICE_ID
            let engine = Attributes.ENGINE
            let languageCode = Attributes.LANGUAGE_CODE
            let speechAttributes: any;
            if (smaEvent.CallDetails.TransactionAttributes)
                speechAttributes = smaEvent.CallDetails.TransactionAttributes[Attributes.CONNECT_CONTEXT_STORE][ContextStore.SPEECH_ATTRIBUTES];
            if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_VOICE)) {
                voiceId = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_VOICE]
            }
            if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_ENGINE)) {
                engine = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_ENGINE].toLowerCase();
            }
            if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.LANGUAGE_CODE)) {
                languageCode = speechAttributes[SpeechParameters.LANGUAGE_CODE]
            }
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let updateMetric = new CloudWatchMetric();
            if (actionType == "Invalid_Text") {
                console.log(Attributes.DEFAULT_LOGGER + callId + "The Text to Speak has Invalid Attributes. The Flow is going to Terminate, Please Check the Flow");
                text = "There is an Invalid Attribute Present, your call is going to disconnect"
            }
            else if (actionType == "error") {
                text = "There is an Error in the Exceution"
            }
            else {
                params.MetricData[0].MetricName = "UnSupportedAction"
                updateMetric.updateMetric(params)
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
            params.MetricData[0].MetricName = "NO_OF_DISCONNECTED_CALLS"
            updateMetric.updateMetric(params);
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [smaAction, smaAction1]
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of Terminating Events" + error.message);
            return null;
        }
    }
}