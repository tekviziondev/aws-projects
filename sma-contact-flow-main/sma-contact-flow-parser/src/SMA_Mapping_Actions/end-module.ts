import { CallDetailsUtil } from "../utility/call-details";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { processFlowAction } from "../contact-flow-processor"
import { loadContactFlow } from "../contact-flow-loader"
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"
/**
  * End the execution of the current Module and returns Back to Orginal Contact flow.
  * @param smaEvent 
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA Action defined after end flow Module
  */

export class EndModule {
  async processFlowActionEndFlowModuleExecution(smaEvent: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
    let callId: string;
    let params = METRIC_PARAMS
        try {
            params.MetricData[0].Dimensions[0].Value = contextStore.ContextAttributes['$.InstanceARN']
            if (contextStore['InvokeModuleARN']) {
                params.MetricData[0].Dimensions[1].Name = 'Module Flow ID'
                params.MetricData[0].Dimensions[1].Value = contextStore['InvokeModuleARN']
            }
            else if (contextStore['TransferFlowARN']) {
                params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
                params.MetricData[0].Dimensions[1].Value = contextStore['TransferFlowARN']
            }
            else {
                params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
                params.MetricData[0].Dimensions[1].Value = contextStore['ActualFlowARN']
            }
        } catch (error) {
          console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId+ Attributes.METRIC_ERROR + error.message);
        }
        let updateMetric=new UpdateMetricUtil();
    try {
      let callDetails = new CallDetailsUtil();
      const legA = callDetails.getLegACallDetails(smaEvent)as any;
      callId = legA.CallId;
      if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
      let nextaction_id = contextStore[ContextStore.INVOKATION_MODULE_NEXT_ACTION]
      let contactFlow_id = contextStore[ContextStore.ACTUAL_FLOW_ARN]
      contextStore[ContextStore.INVOKATION_MODULE_NEXT_ACTION] = "";
      contextStore[ContextStore.INVOKE_MODULE_ARN] = "";
      const contactFlow = await loadContactFlow(amazonConnectInstanceID, contactFlow_id, bucketName, smaEvent, "Contact_Flow");
      let nextAction = callDetails.findActionByID(contactFlow.Actions, nextaction_id)
      params.MetricData[0].MetricName = "FlowModuleExecutionSuccess"
      updateMetric.updateMetric(params);
      return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName, contextStore);
    } catch (error) {
      params.MetricData[0].MetricName = "FlowModuleExecutionFailure"
      updateMetric.updateMetric(params);
      console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution EndFlowModule" + error.message);
      return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
    }

  }
}
