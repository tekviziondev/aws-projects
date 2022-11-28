import { CallDetailsUtil } from "../utility/call-details";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { loadContactFlow } from "../contact-flow-loader"
import { processRootFlowBlock } from "../contact-flow-processor"
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"
/**
  * Transfer to another Contact Flow to Execute.
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA Action of Another Contact Flow
  */

export class TrasferToFlow {
    async processFlowActionTransferToFlow(smaEvent: any, action: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
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
            let TransferFlowARN = action.Parameters.ContactFlowId;
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            contextStore[ContextStore.TRANSFER_FLOW_ARN] = TransferFlowARN
            const contactFlow = await loadContactFlow(amazonConnectInstanceID, TransferFlowARN, bucketName, smaEvent, "Contact_Flow");
            console.log(Attributes.DEFAULT_LOGGER + callId + " Transfering to Another contact FLow function")
            params.MetricData[0].MetricName = "TransferToFlowSuccess"
            updateMetric.updateMetric(params);
            return await processRootFlowBlock(smaEvent, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            params.MetricData[0].MetricName = "TransferToFlowFailure"
            updateMetric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of TransferToFlow " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}
