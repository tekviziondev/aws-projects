"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayAudio = void 0;
const call_details_1 = require("../utility/call-details");
const ChimeActionTypes_1 = require("../utility/ChimeActionTypes");
const audio_parameters_1 = require("../utility/audio-parameters");
const termination_event_1 = require("../utility/termination-event");
/**
  * Making a SMA action to play the Audio from S3 bucket
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class PlayAudio {
    async processPlayAudio(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction) {
        let callId;
        let smaAction1;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            console.log(defaultLogger + callId + "Play Audio Action");
            let smaAction = {
                Type: ChimeActionTypes_1.ChimeActions.PlayAudio,
                Parameters: {
                    "CallId": callId,
                    "AudioSource": (0, audio_parameters_1.getAudioParameters)(smaEvent, action, defaultLogger)
                }
            };
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
            console.log(defaultLogger + callId + " There is an Error in execution of PlayAudio " + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.PlayAudio = PlayAudio;
