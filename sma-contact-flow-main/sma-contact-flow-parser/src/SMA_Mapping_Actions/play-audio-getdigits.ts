import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/chime-action-types";
import { getAudioParameters, failureAudioParameters } from "../utility/audio-parameters";
import { terminatingFlowAction } from "../utility/termination-action";
import { Attributes } from "../utility/constant-values";
/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class PlayAudioAndGetDigits {
    async processPlayAudioAndGetDigits(smaEvent: any, action: any, defaultLogger: string, pauseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
        let callId: string;
        let smaAction1: any;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(defaultLogger + callId + " Action| Play Audio Action and Get Digits");
            let audio_parameters = await getAudioParameters(smaEvent, action, defaultLogger, pauseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap)
            let failure_audio = await failureAudioParameters(smaEvent, action, defaultLogger, pauseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap)
            let smaAction = {
                Type: ChimeActions.PLAY_AUDIO_AND_GET_DIGITS,
                Parameters: {
                    "CallId": callId,
                    "AudioSource": audio_parameters,
                    "FailureAudioSource": failure_audio,
                    "MinNumberOfDigits": 5,
                    "Repeat": 3
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
            if (pauseAction) {
                smaAction1 = pauseAction;
                pauseAction = null;
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": action
                    }
                }

            }
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action
                }
            }

        } catch (error) {
            console.error(defaultLogger + callId + " There is an Error in execution of PlayAudioAndGetDigits " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
        }

    }
}
