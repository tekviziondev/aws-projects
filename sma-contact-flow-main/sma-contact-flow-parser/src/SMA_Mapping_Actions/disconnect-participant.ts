import { ChimeActions } from "../const/chime-action-types";
import { CallDetailsUtil } from "../utility/call-details";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"

/**
  * Making a SMA action to perform Hang up the Active Call.
  * @param smaEvent 
  * @param contextStore
  * @returns SMA action
  */
export class DisconnectParticipant {
    async processFlowActionDisconnectParticipant(smaEvent: any, contextStore: IContextStore) {
        let callId: string;
        let smaAction1: any;
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
            console.log(Attributes.DEFAULT_LOGGER + callId + "| is going to Hang up");
            let smaAction = {
                Type: ChimeActions.HANGUP,
                Parameters: {
                    "SipResponseCode": "0", //Mandatory
                    "CallId": callId //Mandatory
                }
            };
            params.MetricData[0].MetricName = "NO_OF_DISCONNECTED_CALLS"
            metric.updateMetric(params);
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION]

            // checking if the pause action is there to perform before the actual action
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
