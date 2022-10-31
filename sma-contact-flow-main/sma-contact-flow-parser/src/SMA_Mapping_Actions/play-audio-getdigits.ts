import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/ChimeActionTypes";
import { getAudioParameters,failureAudioParameters } from "../utility/audio-parameters";
import { terminatingFlowAction } from "../utility/termination-event";
/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class PlayAudioAndGetDigits {
    async processPlayAudioAndGetDigits(smaEvent: any, action: any, defaultLogger: string, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
        let callId: string;
        let smaAction1: any;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            console.log(defaultLogger + callId + " Action| Play Audio Action and Get Digits");
            let smaAction = {
                Type: ChimeActions.PlayAudioAndGetDigits,
                Parameters: {
                    "CallId": callId,
                    "AudioSource": getAudioParameters(smaEvent, action, defaultLogger),
                    "FailureAudioSource": failureAudioParameters(smaEvent, action, defaultLogger),
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
            if (puaseAction != null && puaseAction && puaseAction != "") {
                smaAction1 = puaseAction;
                puaseAction = null;
                return {
                    "SchemaVersion": "1.0",
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": action
                    }
                }

            }
            return {
                "SchemaVersion": "1.0",
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action
                }
            }

        } catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of PlayAudioAndGetDigits " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }

    }
}