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
import { processFlowAction } from "../contact-flow-processor"
import { loadContactFlow } from "../contact-flow-loader"
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"
/**
  * Ends the execution of the current Module and return Back to Orginal Contact flow.
  * @param smaEvent 
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns orginal Contact Flow next action defined after end flow Module block 
  */

export class EndModule {
  async processFlowActionEndFlowModuleExecution(smaEvent: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
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
      let nextaction_id = contextStore[ContextStore.INVOKATION_MODULE_NEXT_ACTION]
      let contactFlow_id = contextStore[ContextStore.ACTUAL_FLOW_ARN]

      if(contextStore[ContextStore.TRANSFER_FLOW_ARN])
        contactFlow_id =contextStore[ContextStore.TRANSFER_FLOW_ARN];
      contextStore[ContextStore.INVOKATION_MODULE_NEXT_ACTION] = "";
      contextStore[ContextStore.INVOKE_MODULE_ARN] = "";
      // Loads the orginal Contact Flow Details
      const contactFlow = await loadContactFlow(amazonConnectInstanceID, contactFlow_id, bucketName, smaEvent, "Contact_Flow");
      //this method returns the nextion action object
      let nextAction = callDetails.findActionObjectByID(contactFlow.Actions, nextaction_id)
      params.MetricData[0].MetricName = "FlowModuleExecutionSuccess"
      metric.updateMetric(params);
      return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName, contextStore);
    } catch (error) {
      params.MetricData[0].MetricName = "FlowModuleExecutionFailure"
      metric.updateMetric(params);
      console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution EndFlowModule" + error.message);
      return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
    }

  }
}
