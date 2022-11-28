import { ChimeActions } from "../const/chime-action-types";
import { CallDetailsUtil } from "./call-details";
import { Attributes, ContextStore, SpeechParameters } from "../const/constant-values";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"

export class TerminatingFlowUtil{

/**
  * This Terminates the existing call if there are any error occured in the Flow execution
  * @param smaEvent 
  * @param actionType
  * @returns SMA Error Speak Action and Hang UP action
  */
async terminatingFlowAction(smaEvent: any, actionType: string) {
    let text: string;
    let type: string;
    let x: Number;
    let callId: string;
    let contextStore = smaEvent.CallDetails.TransactionAttributes.ConnectContextStore
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
        let voiceId = Attributes.VOICE_ID
        let engine = Attributes.ENGINE
        let languageCode = Attributes.LANGUAGE_CODE
        let speechAttributes: any;
        if (smaEvent.CallDetails.TransactionAttributes)
            speechAttributes = smaEvent.CallDetails.TransactionAttributes[Attributes.CONNECT_CONTEXT_STORE][ContextStore.SPEECH_ATTRIBUTES];
        if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_VOICE)) {
            voiceId = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_VOICE]
        }
        if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.TEXT_TO_SPEECH_ENGINE)) {
            engine = speechAttributes[SpeechParameters.TEXT_TO_SPEECH_ENGINE].toLowerCase();
        }
        if (speechAttributes && speechAttributes.hasOwnProperty(SpeechParameters.LANGUAGE_CODE)) {
            languageCode = speechAttributes[SpeechParameters.LANGUAGE_CODE]
        }
        let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent)as any;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let updateMetric=new UpdateMetricUtil();
        if (actionType == "Invalid_Text") {
            console.log(Attributes.DEFAULT_LOGGER + callId + "The Text to Speak has Invalid Attributes. The Flow is going to Terminate, Please Check the Flow");
            text = "There is an Invalid Attribute Present, your call is going to disconnect"
        }
        else if (actionType == "error") {
            text = "There is an Error in the Exceution"
        }
        else {
            params.MetricData[0].MetricName = "UnSupportedAction"
            updateMetric.updateMetric(params)
            console.log(Attributes.DEFAULT_LOGGER + callId + "The Action " + actionType + " is not supported , The Flow is going to Terminate, Please use only the Supported Action");
            text = "The action " + actionType + " is unsupported Action defined in the Contact flow, your call is going to disconnect"
        }
        let smaAction = {
            Type: ChimeActions.SPEAK,
            Parameters: {
                Engine: engine,
                CallId: legA.CallId,
                Text: text,
                TextType: type,
                LanguageCode: languageCode,
                VoiceId: voiceId

            }
        }
        let smaAction1 = {
            Type: ChimeActions.HANGUP,
            Parameters: {
                "SipResponseCode": "0",
                "CallId": callId
            }
        };
        params.MetricData[0].MetricName = "NO_OF_DISCONNECTED_CALLS"
        updateMetric.updateMetric(params);
        return {
            "SchemaVersion": Attributes.SCHEMA_VERSION,
            "Actions": [smaAction, smaAction1]
        }
    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of Terminating Events" + error.message);
        return null;
    }
}
}