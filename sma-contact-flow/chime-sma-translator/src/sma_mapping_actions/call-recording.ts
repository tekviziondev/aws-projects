import { CallDetailsUtil } from "../utility/call-details";
import { ChimeActions } from "../const/chime-action-types";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { CloudWatchMetric } from "../utility/metric-updation"

/**
  * Making a SMA action to perform Start Call Recording/Stop Call Recording and storing the recorded file in S3 Bucket location
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */
export class CallRecording {
    async processFlowActionUpdateContactRecordingBehavior(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        let pauseAction = contextStore[ContextStore.PAUSE_ACTION]
        // creating cloud watch metric parameter and updating the metric in cloud watch
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            let smaAction1: any;
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
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
                let destinationLocation = process.env.S3_BUCKET;
                console.log("Destination location  for Call Recording is " + destinationLocation)
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
            metric.updateMetric(params);
            // checking if the pause action is there to perform before the actual action
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
