import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/ChimeActionTypes";
import { terminatingFlowAction } from "../utility/termination-event";
import { getSpeechParameters ,FailureSpeechParameters} from "../utility/speech-parameter";
import { PlayAudioAndGetDigits } from "./play-audio-getdigits";
/**
  * Making a SMA action to perform delivering an audio message to obtain customer input.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class GetParticipantInput {
    async processFlowActionGetParticipantInput(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any) {
        
        let callId: string;
        let smaAction1: any;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            if (action.Parameters.Media != null) {
                console.log(defaultLogger + callId + " Play Audio And Get Digits");
                let playAudioGetDigits = new PlayAudioAndGetDigits();
                return await playAudioGetDigits.processPlayAudioAndGetDigits(smaEvent, action, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ActualFlowARN);
            }
            console.log(defaultLogger + callId + " Speak and Get Digits Action");
            let smaAction = {
                Type: ChimeActions.SpeakAndGetDigits,
                Parameters: {
                    "CallId": legA.CallId,
                    "SpeechParameters": getSpeechParameters(smaEvent, action, contextAttributes, SpeechAttributeMap, defaultLogger),
                    "FailureSpeechParameters": FailureSpeechParameters(smaEvent,SpeechAttributeMap, defaultLogger),
                    "MinNumberOfDigits": 1,
                    "Repeat": 3,
                }
            };
            let text = smaAction.Parameters.SpeechParameters.Text
            if (text.includes("$.")) {
                return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "Invalid_Text")
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
            console.log(defaultLogger + callId + " There is an Error in execution of GetParticipantInput" + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }
    }
}