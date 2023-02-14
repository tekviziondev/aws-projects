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

import { CallDetailsUtil } from "../utility/call-details";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { processFlowAction } from "../contact-flow-processor";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"
/**
  * Sets the voice parameters to interact with the customer
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns The Next SMA action
  */
export class SetVoice {
    async processFlowActionUpdateContactTextToSpeechVoice(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            let speechAttributes = contextStore[ContextStore.SPEECH_ATTRIBUTES]
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            // iterating the parameters and storing in speech attributes in the contextstore
            let SpeechParameters = action.Parameters
            const keys = Object.keys(SpeechParameters);
            keys.forEach((key, index) => {
                speechAttributes[key] = SpeechParameters[key];
            });
            let nextAction = callDetails.findActionObjectByID(actions, action.Transitions.NextAction) as any;
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            if (nextAction.Type == "UpdateContactData") {
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action Type:" + nextAction.Type);
                let SpeechParameter = nextAction.Parameters
                const keys = Object.keys(SpeechParameter);
                keys.forEach((key, index) => {
                    speechAttributes[key] = SpeechParameters[key];
                });
                nextAction = callDetails.findActionObjectByID(actions, nextAction.Transitions.NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            }
            params.MetricData[0].MetricName = "UpdateContactTextToSpeechVoiceSuccess"
            metric.updateMetric(params);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            params.MetricData[0].MetricName = "UpdateContactTextToSpeechVoiceFailure"
            metric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of UpdateContactTextToSpeechVoice " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }
}
