"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeakAction = void 0;
const call_details_1 = require("../utility/call-details");
const chime_action_types_1 = require("../const/chime-action-types");
const default_termination_action_1 = require("../utility/default-termination-action");
const constant_values_1 = require("../const/constant-values");
const metric_updation_1 = require("../utility/metric-updation");
const speech_parameter_1 = require("./speech-parameter");
/**
  * Making the SMA action for converting the Text or SSML to perform speak action.
  * @param smaEvent
  * @param action
  * @param contextStore
  * @returns SMA action
  */
class SpeakAction extends speech_parameter_1.SpeechParameter {
    async execute(smaEvent, action, contextStore) {
        let callId;
        // getting the CallID of the Active call from the SMA Event
        let callDetails = new call_details_1.CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent);
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new metric_updation_1.CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            let smaAction1;
            let engine = constant_values_1.Attributes.ENGINE;
            let pauseAction = contextStore[constant_values_1.ContextStore.PAUSE_ACTION];
            // verifing if there are any Invalid_Text present.
            let speech_parameter = await this.getSpeechParameters(smaEvent, action, contextStore, "SpeechParameters");
            if (speech_parameter['Text'].includes("$.")) {
                return await new default_termination_action_1.TerminatingFlowUtil().terminatingFlowAction(smaEvent, "Invalid_Text");
            }
            let smaAction = {
                Type: chime_action_types_1.ChimeActions.SPEAK,
                Parameters: {
                    Engine: engine,
                    CallId: legA.CallId,
                    Text: speech_parameter['Text'],
                    TextType: speech_parameter['TextType'],
                    LanguageCode: speech_parameter['LanguageCode'],
                    VoiceId: speech_parameter['VoiceId']
                }
            };
            params.MetricData[0].MetricName = "SpeakSuccess";
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
            params.MetricData[0].MetricName = "SpeakFailure";
            metric.updateMetric(params);
            console.error(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of MessageParticipant " + error.message);
            return await new default_termination_action_1.TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error");
        }
    }
}
exports.SpeakAction = SpeakAction;
