
import { getLegACallDetails } from "../utility/call-details";
import { terminatingFlowAction } from "../utility/termination-action";
import { loadContactFlow } from "../contact-flow-loader"
import { processRootFlowBlock } from "../contact-flow-processor"
import { Attributes, ContextStore } from "../utility/constant-values";
import { IContextStore } from "../utility/context-store";
import { METRIC_PARAMS } from "../utility/constant-values"
import { updateMetric } from "../utility/metric-updation"
/**
  * Invoke a Module from the existing contact flow, to perform a particular task
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA Action defined in the Module
  */

export class InvokeModule {
    async processFlowActionInvokeFlowModule(smaEvent: any, action: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let params = METRIC_PARAMS
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
        let ModuleARN = action.Parameters.FlowModuleId;
        contextStore[ContextStore.INVOKE_MODULE_ARN] = ModuleARN;
        let endModuleNextAction = action.Transitions.NextAction;
        contextStore[ContextStore.INVOKATION_MODULE_NEXT_ACTION] = endModuleNextAction;
        let callId: string;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            const contactFlow = await loadContactFlow(amazonConnectInstanceID, ModuleARN, bucketName, smaEvent, "Invoke_Module");
            console.log(Attributes.DEFAULT_LOGGER + callId + " Transfering to Another contact FLow function")
            params.MetricData[0].MetricName = "InvokeModuleSuccess"
            updateMetric(params);
            return await processRootFlowBlock(smaEvent, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            params.MetricData[0].MetricName = "InvokeModuleFailure"
            updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of InvokeModule" + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }

    }
}
