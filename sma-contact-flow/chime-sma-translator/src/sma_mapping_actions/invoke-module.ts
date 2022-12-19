
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
