"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayAudio = void 0;
const call_details_1 = require("../utility/call-details");
const chime_action_types_1 = require("../const/chime-action-types");
const audio_parameters_1 = require("./audio-parameters");
const default_termination_action_1 = require("../utility/default-termination-action");
const constant_values_1 = require("../const/constant-values");
const metric_updation_1 = require("../utility/metric-updation");
/**
  * Making a SMA action to play the Audio File from S3 bucket location
  * @param smaEvent
  * @param action
  * @param contextStore
  * @returns SMA action
  */
class PlayAudio extends audio_parameters_1.AudioParameter {
    async execute(smaEvent, action, contextStore) {
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
            let pauseAction = contextStore[constant_values_1.ContextStore.PAUSE_ACTION];
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + "Play Audio Action");
            let audio_parameters = await this.getAudioParameters(smaEvent, action, "PlayAudio");
            let smaAction = {
                Type: chime_action_types_1.ChimeActions.PLAY_AUDIO,
                Parameters: {
                    "CallId": callId,
                    "AudioSource": audio_parameters //Mandatory
                }
            };
            params.MetricData[0].MetricName = "PlayAudioSuccess";
            metric.updateMetric(params);
            // checking if the pause action is there to perform before the actual action
            if (pauseAction) {
                smaAction1 = pauseAction;
                contextStore[constant_values_1.ContextStore.PAUSE_ACTION] = null;
                return {
                    "SchemaVersion": constant_values_1.Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        [constant_values_1.Attributes.CURRENT_FLOW_BLOCK]: action,
                        [constant_values_1.Attributes.CONNECT_CONTEXT_STORE]: contextStore
                    }
                };
            }
            return {
                "SchemaVersion": constant_values_1.Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    [constant_values_1.Attributes.CURRENT_FLOW_BLOCK]: action,
                    [constant_values_1.Attributes.CONNECT_CONTEXT_STORE]: contextStore
                }
            };
        }
        catch (error) {
            params.MetricData[0].MetricName = "PlayAudioFailure";
            metric.updateMetric(params);
            console.error(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of PlayAudio " + error.message);
            return await new default_termination_action_1.TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error");
        }
    }
}
exports.PlayAudio = PlayAudio;
