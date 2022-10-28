"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetParticipantInput = void 0;
const call_details_1 = require("../utility/call-details");
const ChimeActionTypes_1 = require("../utility/ChimeActionTypes");
const termination_event_1 = require("../utility/termination-event");
const speech_parameter_1 = require("../utility/speech-parameter");
const play_audio_getdigits_1 = require("./play-audio-getdigits");
/**
  * Making a SMA action to perform delivering an audio message to obtain customer input.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class GetParticipantInput {
    async processFlowActionGetParticipantInput(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        let callId;
        let smaAction1;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            if (action.Parameters.Media != null) {
                console.log(defaultLogger + callId + " Play Audio And Get Digits");
                let playAudioGetDigits = new play_audio_getdigits_1.PlayAudioAndGetDigits();
                return await playAudioGetDigits.processPlayAudioAndGetDigits(smaEvent, action, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ActualFlowARN);
            }
            console.log(defaultLogger + callId + " Speak and Get Digits Action");
            let smaAction = {
                Type: ChimeActionTypes_1.ChimeActions.SpeakAndGetDigits,
                Parameters: {
                    "CallId": legA.CallId,
                    "SpeechParameters": (0, speech_parameter_1.getSpeechParameters)(smaEvent, action, contextAttributes, SpeechAttributeMap, defaultLogger),
                    "FailureSpeechParameters": (0, speech_parameter_1.FailureSpeechParameters)(smaEvent, SpeechAttributeMap, defaultLogger),
                    "MinNumberOfDigits": 1,
                    "Repeat": 3,
                }
            };
            let text = smaAction.Parameters.SpeechParameters.Text;
            if (text.includes("$.")) {
                return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "Invalid_Text");
            }
            if ((_a = action.Parameters) === null || _a === void 0 ? void 0 : _a.InputValidation) {
                if ((_c = (_b = action.Parameters) === null || _b === void 0 ? void 0 : _b.InputValidation) === null || _c === void 0 ? void 0 : _c.CustomValidation) {
                    if ((_f = (_e = (_d = action.Parameters) === null || _d === void 0 ? void 0 : _d.InputValidation) === null || _e === void 0 ? void 0 : _e.CustomValidation) === null || _f === void 0 ? void 0 : _f.MaximumLength) {
                        smaAction.Parameters['MaxNumberOfDigits'] = (_j = (_h = (_g = action.Parameters) === null || _g === void 0 ? void 0 : _g.InputValidation) === null || _h === void 0 ? void 0 : _h.CustomValidation) === null || _j === void 0 ? void 0 : _j.MaximumLength;
                    }
                }
            }
            if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
                smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
            }
            if (action.Parameters.InputTimeLimitSeconds) {
                const timeLimit = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
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
                };
            }
            return {
                "SchemaVersion": "1.0",
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action
                }
            };
        }
        catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of GetParticipantInput" + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.GetParticipantInput = GetParticipantInput;
