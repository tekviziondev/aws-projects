import { CallDetailsUtil } from "../utility/call-details";
import { ErrorTypes } from "../const/error-types";
import { processFlowAction } from "../contact-flow-processor"
import { NextActionValidationUtil } from "../utility/next-action-error"
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"
/**
  * Updating the Contact Attribute Details
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns The Next SMA Action to perform
  */
export class UpdateContactAttrbts {
    async processFlowActionUpdateContactAttributes(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        let tmpMap = contextStore[ContextStore.TMP_MAP]
        let contextAttributes = contextStore[ContextStore.CONTEXT_ATTRIBUTES]
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
        let callDetails = new CallDetailsUtil();
        let updateMetric=new UpdateMetricUtil();
        try {
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let ContactAttributes: any[][] = Object.entries(action.Parameters.Attributes);
            for (let i = 0; i < ContactAttributes.length; i++) {
                let x: string = ContactAttributes[i][1]
                if (x.includes("$.External.")) {
                    let tmp: any[] = x.split("$.External.")
                    if (tmpMap.hasOwnProperty(tmp[1])) {
                        contextAttributes["$.Attributes." + ContactAttributes[i][0]] = tmpMap[tmp[1]]
                    }
                }
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
           updateMetric. updateMetric(params);
        } catch (e) {
            params.MetricData[0].MetricName = "UpdateContactAttributeFailure"
            updateMetric.updateMetric(params);
            let nextAction = await new NextActionValidationUtil().getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        }
        contextStore[ContextStore.TMP_MAP] = null;
        let nextAction = callDetails.findActionByID(actions, action.Transitions.NextAction);
        console.error(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + nextAction);
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
    }
}
