"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetVoice = void 0;
const call_details_1 = require("../utility/call-details");
const termination_event_1 = require("../utility/termination-event");
const find_action_id_1 = require("../utility/find-action-id");
const contact_flow_processor_1 = require("../contact-flow-processor");
/**
  * Sets the voice parameters to interact with the customer
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
class SetVoice {
    async processFlowActionUpdateContactTextToSpeechVoice(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, SpeechAttributeMap, puaseAction, contextAttributes, ActualFlowARN, ContactFlowARNMap) {
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            let SpeechParameters = action.Parameters;
            const keys = Object.keys(SpeechParameters);
            keys.forEach((key, index) => {
                SpeechAttributeMap.set(key, SpeechParameters[key]);
            });
            let nextAction = (0, find_action_id_1.findActionByID)(actions, action.Transitions.NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
            if (nextAction.Type == "UpdateContactData") {
                console.log(defaultLogger + callId + " Next Action Type:" + nextAction.Type);
                let SpeechParameter = nextAction.Parameters;
                const keys = Object.keys(SpeechParameter);
                keys.forEach((key, index) => {
                    SpeechAttributeMap.set(key, SpeechParameter[key]);
                });
                nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction.Transitions.NextAction);
                console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
            }
            return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        }
        catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of UpdateContactTextToSpeechVoice " + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.SetVoice = SetVoice;
