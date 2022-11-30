"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageParticipant = void 0;
const call_details_1 = require("../utility/call-details");
const constant_values_1 = require("../const/constant-values");
const default_termination_action_1 = require("../utility/default-termination-action");
const play_audio_1 = require("./play-audio");
const speak_action_1 = require("./speak-action");
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent
  * @param action
  * @param contextStore
  * @returns SMA action
  */
class MessageParticipant {
    async execute(smaEvent, action, contextStore) {
        let callId;
        // getting the CallID of the Active call from the SMA Event
        let callDetails = new call_details_1.CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent);
        try {
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.Media != null) {
                console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + "Play Audio Action");
                let playAudio = new play_audio_1.PlayAudio();
                return await playAudio.execute(smaEvent, action, contextStore);
            }
            else {
                console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + "Speak Action");
                let speakAction = new speak_action_1.SpeakAction();
                return await speakAction.execute(smaEvent, action, contextStore);
            }
        }
        catch (error) {
            console.error(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of MessageParticipant " + error.message);
            return await new default_termination_action_1.TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error");
        }
    }
}
exports.MessageParticipant = MessageParticipant;
