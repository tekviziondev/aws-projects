import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/chime-action-types";
import { Attributes, ContextStore } from "../utility/constant-values";
import { IContextStore } from "../utility/context-store";
import { terminatingFlowAction } from "../utility/termination-action";
import {METRIC_PARAMS} from "../utility/constant-values"
import {updateMetric} from "../utility/metric-updation"

/**
  * Making a SMA action to perform Call Recording and Start storing it in the S3 Bucket Location
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA Action
  */

export class CallRecording {
    async processFlowActionUpdateContactRecordingBehavior(smaEvent: any, action: any,contextStore:IContextStore){
        let callId: string;
        let pauseAction=contextStore[ContextStore.PAUSE_ACTION]
        let params=METRIC_PARAMS
        params.MetricData[0].Dimensions[0].Value=contextStore.ContextAttributes['$.InstanceARN']
        if(contextStore['InvokeModuleARN']){
            params.MetricData[0].Dimensions[1].Name='Module Flow ID'
            params.MetricData[0].Dimensions[1].Value=contextStore['InvokeModuleARN']
        }
        else if(contextStore['TransferFlowARN']){
            params.MetricData[0].Dimensions[1].Name='Contact Flow ID'
            params.MetricData[0].Dimensions[1].Value=contextStore['TransferFlowARN']
        }
        else{
            params.MetricData[0].Dimensions[1].Name='Contact Flow ID'
            params.MetricData[0].Dimensions[1].Value=contextStore['ActualFlowARN']
        }
        try {
            let smaAction1: any;
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            let smaAction:any;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.RecordingBehavior.RecordedParticipants.length < 1) {
                 smaAction = {
                    Type: ChimeActions.STOP_CALL_RECORDING,
                    Parameters: {
                        "CallId": legA.CallId
                    }
                };
               
            }else{
                let destinationLocation="";
                if(Attributes.destinationLocation)
                destinationLocation=Attributes.destinationLocation;
                else
                destinationLocation="flow-cache1"
             smaAction = {
                Type: ChimeActions.START_CALL_RECORDING,
                Parameters: {
                    "CallId": legA.CallId,
                    "Track": Attributes.TRACK,
                    Destination: {
                        "Type": Attributes.DESTINATION_TYPE,
                        "Location": destinationLocation
                    }
                }
            };
        }
        params.MetricData[0].MetricName=smaAction.Type+"Success"
        updateMetric(params);
            if (pauseAction) {
                smaAction1 = pauseAction;
                contextStore[ContextStore.PAUSE_ACTION]=null
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        [Attributes.CURRENT_FLOW_BLOCK]: action,
                        [Attributes.CONNECT_CONTEXT_STORE]:contextStore
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
                    [Attributes.CONNECT_CONTEXT_STORE]:contextStore
                }
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution UpdateContactRecordingBehavior |" + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }
    }
}
