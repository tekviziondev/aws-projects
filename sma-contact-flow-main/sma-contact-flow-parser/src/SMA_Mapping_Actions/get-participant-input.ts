import { CallDetailsUtil } from "../utility/call-details";
import { ChimeActions } from "../const/chime-action-types";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { SpeechParameter } from "./speech-parameter";
import { PlayAudioAndGetDigits } from "./play-audio-getdigits";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"
/**
  * Making a SMA action to perform delivering an audio message to obtain customer input.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA Action
  */
export class GetParticipantInput extends SpeechParameter {
    async execute(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
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
        let updateMetric=new UpdateMetricUtil();
        try {
            let smaAction1: any;
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.Media) {
                console.log(Attributes.DEFAULT_LOGGER + callId + " Play Audio And Get Digits");
                let playAudioGetDigits = new PlayAudioAndGetDigits();
                return await playAudioGetDigits.execute(smaEvent, action, contextStore);
            }
            console.log(Attributes.DEFAULT_LOGGER + callId + " Speak and Get Digits Action");
            
            let speech_parameter = await this.getSpeechParameters(smaEvent, action, contextStore,"SpeechParameters")
            let failure_parameter = await this.getSpeechParameters(smaEvent,action, contextStore,"FailureSpeechParameters")
            let smaAction = {
                Type: ChimeActions.SPEAK_AND_GET_DIGITS,
                Parameters: {
                    "CallId": legA.CallId,
                    "SpeechParameters": speech_parameter,
                    "FailureSpeechParameters": failure_parameter,
                    "MinNumberOfDigits": 1,
                    "Repeat": 3,
                }
            };
            let text = smaAction.Parameters.SpeechParameters.Text
            if (text.includes("$.")) {
                return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "Invalid_Text")
            }

            if (action.Parameters?.InputValidation) {
                if (action.Parameters?.InputValidation?.CustomValidation) {
                    if (action.Parameters?.InputValidation?.CustomValidation?.MaximumLength) {
                        smaAction.Parameters['MaxNumberOfDigits'] = action.Parameters?.InputValidation?.CustomValidation?.MaximumLength;
                    }
                }
            }
            if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
                smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
            }
            if (action.Parameters.InputTimeLimitSeconds) {
                const timeLimit: number = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
                smaAction.Parameters["RepeatDurationInMilliseconds"] = timeLimit * 1000;
            }
            params.MetricData[0].MetricName = "SpeakAndGetDigitsSuccess"
            updateMetric.updateMetric(params);
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION];
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
            params.MetricData[0].MetricName = "SpeakAndGetDigitsFailure"
            updateMetric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of GetParticipantInput" + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }
}
