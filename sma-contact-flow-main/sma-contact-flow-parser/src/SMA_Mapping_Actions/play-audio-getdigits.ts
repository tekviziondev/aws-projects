import { CallDetailsUtil } from "../utility/call-details";
import { ChimeActions } from "../const/chime-action-types";
import { AudioParameter} from "./audio-parameters";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation";
/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA Action
  */
export class PlayAudioAndGetDigits extends AudioParameter{
    async execute(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        let smaAction1: any;
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
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(Attributes.DEFAULT_LOGGER + callId + " Action| Play Audio Action and Get Digits");
            let audio_parameters = await this.getAudioParameters(smaEvent, action,"PlayAudio")
            let failure_audio = await this.getAudioParameters(smaEvent, action,"FailureAudioParameters")
            let smaAction = {
                Type: ChimeActions.PLAY_AUDIO_AND_GET_DIGITS,
                Parameters: {
                    "CallId": callId, //Optional
                    "AudioSource": audio_parameters, //Mandatory
                    "FailureAudioSource": failure_audio, //Mandatory
                    "MinNumberOfDigits": 5, //Optional
                    "Repeat": 3 //Optional
                }
            };
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
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION];
            params.MetricData[0].MetricName = "PlayAudioGetDigitsSuccess"
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
            params.MetricData[0].MetricName = "PlayAudioGetDigitsFailure"
            updateMetric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of PlayAudioAndGetDigits " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}

