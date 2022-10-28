"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateContactAttrbts = void 0;
const call_details_1 = require("../utility/call-details");
const find_action_id_1 = require("../utility/find-action-id");
const ErrorTypes_1 = require("../utility/ErrorTypes");
const contact_flow_processor_1 = require("../contact-flow-processor");
const next_action_error_1 = require("../utility/next-action-error");
/**
  * Updating the Contact Attribute Details
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns The Next SMA Action to perform
  */
class UpdateContactAttrbts {
    async processFlowActionUpdateContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, tmpMap, contextAttributes) {
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        let callId;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let ContactAttributes = Object.entries(action.Parameters.Attributes);
        try {
            for (let i = 0; i < ContactAttributes.length; i++) {
                let x = ContactAttributes[i][1];
                if (x.includes("$.External.")) {
                    let tmp = x.split("$.External.");
                    if (tmpMap.has(tmp[1])) {
                        contextAttributes.set("$.Attributes." + ContactAttributes[i][0], tmpMap.get(tmp[1]));
                    }
                }
                else if (x.includes("$.Attributes.")) {
                    let tmp = x.split("$.Attributes.");
                    if (tmpMap.has(tmp[1])) {
                        contextAttributes.set("$.Attributes." + ContactAttributes[i][0], tmpMap.get(tmp[1]));
                    }
                }
                else {
                    contextAttributes.set("$.Attributes." + ContactAttributes[i][0], ContactAttributes[i][1]);
                }
            }
        }
        catch (e) {
            let nextAction = await (0, next_action_error_1.getNextActionForError)(action, actions, ErrorTypes_1.ErrorTypes.NoMatchingError, smaEvent, defaultLogger);
            return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        }
        tmpMap.clear();
        let nextAction = (0, find_action_id_1.findActionByID)(actions, action.Transitions.NextAction);
        console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
        return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }
}
exports.UpdateContactAttrbts = UpdateContactAttrbts;
