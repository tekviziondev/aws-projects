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
import { loadContactFlow } from "../contact-flow-loader"
import { processRootFlowBlock } from "../contact-flow-processor"
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"
/**
  * Invoke a Module from the existing contact flow, to perform a particular task
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA action defined in the Module
  */

export class InvokeModule {
    async processFlowActionInvokeFlowModule(smaEvent: any, action: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {

        let ModuleARN = action.Parameters.FlowModuleId;
        //storing the module's ARN in the contextstore
        contextStore[ContextStore.INVOKE_MODULE_ARN] = ModuleARN;
        //gets the end module execution next action
        let endModuleNextAction = action.Transitions.NextAction;
        //stores the end module execution next action in the contextstore
        contextStore[ContextStore.INVOKATION_MODULE_NEXT_ACTION] = endModuleNextAction;
        let callId: string;
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
            // loading the Module data from the Contact Flow
            const contactFlow = await loadContactFlow(amazonConnectInstanceID, ModuleARN, bucketName, smaEvent, "Invoke_Module");
            console.log(Attributes.DEFAULT_LOGGER + callId + " Transfering to Another contact FLow function")
            params.MetricData[0].MetricName = "InvokeModuleSuccess"
            metric.updateMetric(params);
            return await processRootFlowBlock(smaEvent, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            params.MetricData[0].MetricName = "InvokeModuleFailure"
            metric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of InvokeModule" + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}
