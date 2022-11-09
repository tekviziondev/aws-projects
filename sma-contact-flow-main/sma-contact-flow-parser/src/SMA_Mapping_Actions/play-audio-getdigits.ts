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
    async processPlayAudioAndGetDigits(smaEvent: any, action: any, contextStore:any){
        let callId: string;
        let smaAction1: any;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(Attributes.DEFAULT_LOGGER + callId + " Action| Play Audio Action and Get Digits");
            let audio_parameters = await getAudioParameters(smaEvent, action)
            let failure_audio = await failureAudioParameters(smaEvent, action)
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
            let pauseAction=contextStore['PauseAction'];
            if (pauseAction) {
                smaAction1 = pauseAction;
                contextStore['PauseAction']=null
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": action,
                        "ConnectContextStore":contextStore
                    }
                }

            }
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action,
                    "ConnectContextStore":contextStore
                }
            }

        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of PlayAudioAndGetDigits " + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }

    }
}
