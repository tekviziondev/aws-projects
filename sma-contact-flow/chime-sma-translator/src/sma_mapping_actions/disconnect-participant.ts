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
import { CallDetailsUtil } from "../utility/call-details";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"

/**
  * Making a SMA action to perform Hang up the Active Call.
  * @param smaEvent 
  * @param contextStore
  * @returns SMA action
  */
export class DisconnectParticipant {
    async processFlowActionDisconnectParticipant(smaEvent: any, contextStore: IContextStore) {
        let callId: string;
        let smaAction1: any;
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(Attributes.DEFAULT_LOGGER + callId + "| is going to Hang up");
            let smaAction = {
                Type: ChimeActions.HANGUP,
                Parameters: {
                    "SipResponseCode": "0", //Mandatory
                    "CallId": callId //Mandatory
                }
            };
            params.MetricData[0].MetricName = "NO_OF_DISCONNECTED_CALLS"
            metric.updateMetric(params);
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION]

            // checking if the pause action is there to perform before the actual action
            if (pauseAction) {
                smaAction1 = pauseAction;
                contextStore[ContextStore.PAUSE_ACTION] = null
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                }

            }
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],

            }
        } catch (error) {
            console.log("There is an error in Disconnceting Participant for call ID" + callId + error.message)
        }

    }
    async processFlowActionDisconnectBothParticipant(smaEvent: any, contextStore: IContextStore) {
        let callId: string;
        let callId1: string;

        let actionList: any[] = [];
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            const legB = callDetails.getLegBCallDetails(smaEvent) as any;
            callId = legA.CallId;
            callId1 = legB.CallId;  
            if (callId && legA.Status === "Connected") {
                let smaAction = {
                    Type: ChimeActions.HANGUP,
                    Parameters: {
                        "SipResponseCode": "0", //Mandatory
                        "CallId": callId //Mandatory
                    }
                };
                actionList.push(smaAction)
                console.log(Attributes.DEFAULT_LOGGER + callId + "| is going to Hang up" + JSON.stringify(legA));
            }

            if (callId1 && legB.Status === "Connected") {

                let smaAction1 = {
                    Type: ChimeActions.HANGUP,
                    Parameters: {
                        "SipResponseCode": "0", //Mandatory
                        "CallId": callId1 //Mandatory
                    }
                };
                actionList.push(smaAction1)
                console.log(Attributes.DEFAULT_LOGGER + callId1 + "| is going to Hang up"+JSON.stringify(legB));
            }

            params.MetricData[0].MetricName = "NO_OF_DISCONNECTED_CALLS"
            metric.updateMetric(params);

            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": actionList,

            }
        } catch (error) {
            console.log("There is an error in Disconnceting Participant for call ID" + callId + error.message)
        }

    }


}
