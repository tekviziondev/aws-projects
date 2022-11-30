"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const disconnect_participant_1 = require("../sma-contact-flow-parser/src/sma_mapping_actions/disconnect-participant");
const message_participant_1 = require("../sma-contact-flow-parser/src/sma_mapping_actions/message-participant");
const sma_event_json_1 = __importDefault(require("./sma-event.json"));
const contextstoreVariables_json_1 = __importDefault(require("./contextstoreVariables.json"));
const action_json_1 = __importDefault(require("./action.json"));
// Sample Test case to check the  SMA action
(async () => {
    try {
        const messageParticipant = new message_participant_1.MessageParticipant().execute(sma_event_json_1.default, action_json_1.default, contextstoreVariables_json_1.default);
        console.log("The SMA action object is " + JSON.stringify(messageParticipant));
        const disconnect = new disconnect_participant_1.DisconnectParticipant().processFlowActionDisconnectParticipant(sma_event_json_1.default, contextstoreVariables_json_1.default);
        console.log("The SMA action object for disconnet participant is" + JSON.stringify(disconnect));
    }
    catch (e) {
        console.log(e);
    }
})();
