"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminatingFlowUtil = void 0;
const chime_action_types_1 = require("../const/chime-action-types");
const call_details_1 = require("./call-details");
const constant_values_1 = require("../const/constant-values");
const metric_updation_1 = require("./metric-updation");
class TerminatingFlowUtil {
    /**
      * This Terminates the existing call if there are any error occured in the Flow execution
      * @param smaEvent
      * @param actionType
      * @returns SMA Error Speak Action and Hang UP action
      */
    async terminatingFlowAction(smaEvent, actionType) {
        let text;
        let type;
        let x;
        let callId;
        let contextStore = smaEvent.CallDetails.TransactionAttributes.ConnectContextStore;
        let metric = new metric_updation_1.CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            let voiceId = constant_values_1.Attributes.VOICE_ID;
            let engine = constant_values_1.Attributes.ENGINE;
            let languageCode = constant_values_1.Attributes.LANGUAGE_CODE;
            let speechAttributes;
            if (smaEvent.CallDetails.TransactionAttributes)
                speechAttributes = smaEvent.CallDetails.TransactionAttributes[constant_values_1.Attributes.CONNECT_CONTEXT_STORE][constant_values_1.ContextStore.SPEECH_ATTRIBUTES];
            if (speechAttributes && speechAttributes.hasOwnProperty(constant_values_1.SpeechParameters.TEXT_TO_SPEECH_VOICE)) {
                voiceId = speechAttributes[constant_values_1.SpeechParameters.TEXT_TO_SPEECH_VOICE];
            }
            if (speechAttributes && speechAttributes.hasOwnProperty(constant_values_1.SpeechParameters.TEXT_TO_SPEECH_ENGINE)) {
                engine = speechAttributes[constant_values_1.SpeechParameters.TEXT_TO_SPEECH_ENGINE].toLowerCase();
            }
            if (speechAttributes && speechAttributes.hasOwnProperty(constant_values_1.SpeechParameters.LANGUAGE_CODE)) {
                languageCode = speechAttributes[constant_values_1.SpeechParameters.LANGUAGE_CODE];
            }
            let callDetails = new call_details_1.CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let updateMetric = new metric_updation_1.CloudWatchMetric();
            if (actionType == "Invalid_Text") {
                console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + "The Text to Speak has Invalid Attributes. The Flow is going to Terminate, Please Check the Flow");
                text = "There is an Invalid Attribute Present, your call is going to disconnect";
            }
            else if (actionType == "error") {
                text = "There is an Error in the Exceution";
            }
            else {
                params.MetricData[0].MetricName = "UnSupportedAction";
                updateMetric.updateMetric(params);
                console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + "The Action " + actionType + " is not supported , The Flow is going to Terminate, Please use only the Supported Action");
                text = "The action " + actionType + " is unsupported Action defined in the Contact flow, your call is going to disconnect";
            }
            let smaAction = {
                Type: chime_action_types_1.ChimeActions.SPEAK,
                Parameters: {
                    Engine: engine,
                    CallId: legA.CallId,
                    Text: text,
                    TextType: type,
                    LanguageCode: languageCode,
                    VoiceId: voiceId
                }
            };
            let smaAction1 = {
                Type: chime_action_types_1.ChimeActions.HANGUP,
                Parameters: {
                    "SipResponseCode": "0",
                    "CallId": callId
                }
            };
            params.MetricData[0].MetricName = "NO_OF_DISCONNECTED_CALLS";
            updateMetric.updateMetric(params);
            return {
                "SchemaVersion": constant_values_1.Attributes.SCHEMA_VERSION,
                "Actions": [smaAction, smaAction1]
            };
        }
        catch (error) {
            console.error(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of Terminating Events" + error.message);
            return null;
        }
    }
}
exports.TerminatingFlowUtil = TerminatingFlowUtil;
