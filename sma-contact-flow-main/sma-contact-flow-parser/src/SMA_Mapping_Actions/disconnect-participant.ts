import { ChimeActions } from "../const/chime-action-types";
import { CallDetailsUtil } from "../utility/call-details";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"

/**
  * Making a SMA action to perform Ends the interaction.
  * @param smaEvent 
  * @param contextStore
  * @returns SMA Action
  */
export class DisconnectParticipant {
    async processFlowActionDisconnectParticipant(smaEvent: any, contextStore: IContextStore) {
        let callId: string;
        let smaAction1: any;
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
        try {
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
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
            let updateMetric=new UpdateMetricUtil();
            updateMetric.updateMetric(params);
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION]
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
}
