"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayAudio = void 0;
const call_details_1 = require("./utility/call-details");
const ChimeActionTypes_1 = require("./utility/ChimeActionTypes");
const audio_parameters_1 = require("./utility/audio-parameters");
class PlayAudio {
    async processPlayAudio(smaEvent, action, defaultLogger, puaseAction) {
        let callId;
        let smaAction1;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
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
}
exports.PlayAudio = PlayAudio;
