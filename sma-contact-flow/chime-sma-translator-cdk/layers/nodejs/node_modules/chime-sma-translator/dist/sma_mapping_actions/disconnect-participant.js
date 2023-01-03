"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisconnectParticipant = void 0;
const chime_action_types_1 = require("../const/chime-action-types");
const call_details_1 = require("../utility/call-details");
const constant_values_1 = require("../const/constant-values");
const metric_updation_1 = require("../utility/metric-updation");
/**
  * Making a SMA action to perform Hang up the Active Call.
  * @param smaEvent
  * @param contextStore
  * @returns SMA action
  */
class DisconnectParticipant {
    async processFlowActionDisconnectParticipant(smaEvent, contextStore) {
        let callId;
        let smaAction1;
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new metric_updation_1.CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new call_details_1.CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + "| is going to Hang up");
            let smaAction = {
                Type: chime_action_types_1.ChimeActions.HANGUP,
                Parameters: {
                    "SipResponseCode": "0",
                    "CallId": callId //Mandatory
                }
            };
            params.MetricData[0].MetricName = "NO_OF_DISCONNECTED_CALLS";
            metric.updateMetric(params);
            let pauseAction = contextStore[constant_values_1.ContextStore.PAUSE_ACTION];
            // checking if the pause action is there to perform before the actual action
            if (pauseAction) {
                smaAction1 = pauseAction;
                contextStore[constant_values_1.ContextStore.PAUSE_ACTION] = null;
                return {
                    "SchemaVersion": constant_values_1.Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                };
            }
            return {
                "SchemaVersion": constant_values_1.Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
            };
        }
        catch (error) {
            console.log("There is an error in Disconnceting Participant for call ID" + callId + error.message);
        }
    }
}
exports.DisconnectParticipant = DisconnectParticipant;
