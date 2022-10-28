"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayAudioAndGetDigits = void 0;
const call_details_1 = require("../utility/call-details");
const ChimeActionTypes_1 = require("../utility/ChimeActionTypes");
const audio_parameters_1 = require("../utility/audio-parameters");
const termination_event_1 = require("../utility/termination-event");
/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class PlayAudioAndGetDigits {
    async processPlayAudioAndGetDigits(smaEvent, action, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        let callId;
        let smaAction1;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            console.log(defaultLogger + callId + " Action| Play Audio Action and Get Digits");
            let smaAction = {
                Type: ChimeActionTypes_1.ChimeActions.PlayAudioAndGetDigits,
                Parameters: {
                    "CallId": callId,
                    "AudioSource": (0, audio_parameters_1.getAudioParameters)(smaEvent, action, defaultLogger),
                    "FailureAudioSource": (0, audio_parameters_1.failureAudioParameters)(smaEvent, action, defaultLogger),
                    "MinNumberOfDigits": 5,
                    "Repeat": 3
                }
            };
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
            console.log(defaultLogger + callId + " There is an Error in execution of PlayAudioAndGetDigits " + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.PlayAudioAndGetDigits = PlayAudioAndGetDigits;
