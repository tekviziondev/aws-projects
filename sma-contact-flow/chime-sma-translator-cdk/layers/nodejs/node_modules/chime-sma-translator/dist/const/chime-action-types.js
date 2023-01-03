"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChimeActions = void 0;
// Amazon Chime SMA ations supported by the tekVizion's Library
var ChimeActions;
(function (ChimeActions) {
    ChimeActions["SPEAK_AND_GET_DIGITS"] = "SpeakAndGetDigits";
    ChimeActions["PLAY_AUDIO_AND_GET_DIGITS"] = "PlayAudioAndGetDigits";
    ChimeActions["SPEAK"] = "Speak";
    ChimeActions["PLAY_AUDIO"] = "PlayAudio";
    ChimeActions["HANGUP"] = "Hangup";
    ChimeActions["PAUSE"] = "Pause";
    ChimeActions["START_CALL_RECORDING"] = "StartCallRecording";
    ChimeActions["STOP_CALL_RECORDING"] = "StopCallRecording";
    ChimeActions["CALL_AND_BRIDGE"] = "CallAndBridge";
    ChimeActions["START_BOT_CONVERSATION"] = "StartBotConversation";
})(ChimeActions = exports.ChimeActions || (exports.ChimeActions = {}));
