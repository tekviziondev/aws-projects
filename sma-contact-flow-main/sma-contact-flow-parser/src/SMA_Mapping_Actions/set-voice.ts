import { CallDetailsUtil } from "../utility/call-details";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { processFlowAction } from "../contact-flow-processor";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"
/**
  * Sets the voice parameters to interact with the customer
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA Action
  */
export class SetVoice {
    async processFlowActionUpdateContactTextToSpeechVoice(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
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
            let speechAttributes = contextStore[ContextStore.SPEECH_ATTRIBUTES]
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let SpeechParameters = action.Parameters
            const keys = Object.keys(SpeechParameters);
            keys.forEach((key, index) => {
                speechAttributes[key] = SpeechParameters[key];
            });
            let nextAction = callDetails.findActionByID(actions, action.Transitions.NextAction) as any;
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            if (nextAction.Type == "UpdateContactData") {
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action Type:" + nextAction.Type);
                let SpeechParameter = nextAction.Parameters
                const keys = Object.keys(SpeechParameter);
                keys.forEach((key, index) => {
                    speechAttributes[key] = SpeechParameters[key];
                });
                nextAction = callDetails.findActionByID(actions, nextAction.Transitions.NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            }
            params.MetricData[0].MetricName = "UpdateContactTextToSpeechVoiceSuccess"
            updateMetric.updateMetric(params);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            params.MetricData[0].MetricName = "UpdateContactTextToSpeechVoiceFailure"
            updateMetric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of UpdateContactTextToSpeechVoice " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }
}
