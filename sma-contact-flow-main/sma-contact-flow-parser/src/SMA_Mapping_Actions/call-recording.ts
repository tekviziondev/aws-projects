import { CallDetailsUtil } from "../utility/call-details";
import { ChimeActions } from "../const/chime-action-types";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"

/**
  * Making a SMA action to perform Call Recording and Start storing it in the S3 Bucket Location or Stop Call Recording
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA Action
  */

export class CallRecording {
    async processFlowActionUpdateContactRecordingBehavior(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        let pauseAction = contextStore[ContextStore.PAUSE_ACTION]
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
            let smaAction1: any;
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
            callId = legA.CallId;
            let smaAction: any;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.RecordingBehavior.RecordedParticipants.length < 1) {
                smaAction = {
                    Type: ChimeActions.STOP_CALL_RECORDING,
                    Parameters: {
                        "CallId": legA.CallId
                    }
                };

            } else {
                let destinationLocation = "";
                if (Attributes.destinationLocation)
                    destinationLocation = Attributes.destinationLocation;
                else
                    destinationLocation = "flow-cache1"
                console.log("Destination location "+ destinationLocation)
                smaAction = {
                    Type: ChimeActions.START_CALL_RECORDING,
                    Parameters: {
                        "CallId": legA.CallId, //Mandatory
                        "Track": Attributes.TRACK, //Mandatory
                        Destination: {
                            "Type": Attributes.DESTINATION_TYPE, //Mandatory
                            "Location": destinationLocation 
                        }
                    }
                };
            }
            params.MetricData[0].MetricName = smaAction.Type + "Success"
            let updateMetric=new UpdateMetricUtil();
            updateMetric.updateMetric(params);
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
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution UpdateContactRecordingBehavior |" + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }
}
