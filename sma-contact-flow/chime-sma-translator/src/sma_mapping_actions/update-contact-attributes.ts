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
import { ErrorTypes } from "../const/error-types";
import { processFlowAction } from "../contact-flow-processor"
import { NextActionValidationUtil } from "../utility/next-action-error-handler"
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"
/**
  * Get the Contact attribute details from Contact Flow and updating in the ContextStore
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns The Next SMA action to perform
  */
export class UpdateContactAttrbts {
    async processFlowActionUpdateContactAttributes(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        let tmpMap = contextStore[ContextStore.TMP_MAP]
        let contextAttributes = contextStore[ContextStore.CONTEXT_ATTRIBUTES]
        // getting the CallID of the Active call from the SMA Event
        let callDetails = new CallDetailsUtil();
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let ContactAttributes: any[][] = Object.entries(action.Parameters.Attributes);
            //iterate the contact attributes, if the value has any external attribute to replace
            for (let i = 0; i < ContactAttributes.length; i++) {
                let x: string = ContactAttributes[i][1]
                if (x.includes("$.External.")) {
                    let tmp: any[] = x.split("$.External.")
                    if (tmpMap.hasOwnProperty(tmp[1])) {
                        contextAttributes["$.Attributes." + ContactAttributes[i][0]] = tmpMap[tmp[1]]
                    }
                }
                //iterate the contact attributes, if the value has any system attribute to replace
                else if (x.includes("$.Attributes.")) {
                    let tmp: any[] = x.split("$.Attributes.")
                    if (tmpMap.hasOwnProperty(tmp[1])) {
                        contextAttributes["$.Attributes." + ContactAttributes[i][0]] = tmpMap[tmp[1]];
                    }
                }
                else {
                    contextAttributes["$.Attributes." + ContactAttributes[i][0]] = ContactAttributes[i][1];
                }
            }
            params.MetricData[0].MetricName = "UpdateContactAttributeSuccess"
            metric.updateMetric(params);
        } catch (e) {
            params.MetricData[0].MetricName = "UpdateContactAttributeFailure"
            metric.updateMetric(params);
            let nextAction = await new NextActionValidationUtil().getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        }
        contextStore[ContextStore.TMP_MAP] = null;
        let nextAction = callDetails.findActionObjectByID(actions, action.Transitions.NextAction);
        console.error(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + nextAction);
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
    }
}
