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
import { Attributes, ContextStore } from "../const/constant-values"
import { ChimeActions } from "../const/chime-action-types";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation";
import { AudioParameter } from "./audio-parameters";



/**
  * Making a SMA action to perform Transfer a call to a third party PSTN number
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */

export class TransferTOThirdParty extends AudioParameter {
    async execute(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        let smaAction1: any;
        let contextAttributes = contextStore[ContextStore.CONTEXT_ATTRIBUTES];
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
            let fromNumber = legA.From;
            if (action.Parameters.hasOwnProperty("CallerId")) {
                fromNumber = action.Parameters.CallerId.Number;
            }
            let thirdPartyNumber = action.Parameters.ThirdPartyPhoneNumber;
            let x: Number;
            const keys = Object.keys(contextAttributes);
            console.log("Keys: " + keys);
            keys.forEach((key, index) => {
                if (thirdPartyNumber.includes(key)) {
                    x = this.count(thirdPartyNumber, key) as any;
                    for (let index = 0; index < x; index++) {
                        thirdPartyNumber = thirdPartyNumber.replace(key, contextAttributes[key]);
                    }
                }
            });
            console.log(Attributes.DEFAULT_LOGGER + callId + " Transfering call to Third Party Number");
            let bucketName: string;
            let type: string;
            let uri: string;
            let uriObj: string[];
            let key: string;
            let ringBack = {};
            if (Attributes.Ring_Back_Audio) {
                uri = Attributes.Ring_Back_Audio;
                uriObj = uri.split("/");
                bucketName = uriObj[2];
                key = uriObj[3];
               // type = action.Parameters.Media.SourceType;
                ringBack = {
                    Type: "S3", //Mandatory
                    BucketName: bucketName, //Mandatory
                    Key: key //Mandatory
                }
            }

            let smaAction = {
                Type: ChimeActions.CALL_AND_BRIDGE,
                Parameters: {
                    "CallTimeoutSeconds": action.Parameters.ThirdPartyConnectionTimeLimitSeconds, //Optional
                    "CallerIdNumber": fromNumber, //Mandatory
                    "RingbackTone": ringBack,
                    "Endpoints": [
                        {
                            "BridgeEndpointType": Attributes.BRDIGE_ENDPOINT_TYPE, //Mandatory
                            "Uri": thirdPartyNumber
                        }
                    ]
                }

            };
            params.MetricData[0].MetricName = "TransferToThirdPartySuccess"
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
                    "TransactionAttributes": {
                        [Attributes.CURRENT_FLOW_BLOCK]: action,
                        [Attributes.CONNECT_CONTEXT_STORE]: contextStore
                    }
                }

            }
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    [Attributes.CURRENT_FLOW_BLOCK]: action,
                    [Attributes.CONNECT_CONTEXT_STORE]: contextStore
                }
            }
        } catch (error) {
            params.MetricData[0].MetricName = "TransferToThirdPartyFailure"
            metric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of TransferToThirdParty " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
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
