"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndModule = void 0;
const call_details_1 = require("../utility/call-details");
const termination_event_1 = require("../utility/termination-event");
const find_action_id_1 = require("../utility/find-action-id");
const contact_flow_processor_1 = require("../contact-flow-processor");
const contact_flow_loader_1 = require("../contact-flow-loader");
/**
  * End the execution of the current Module and returns Back to Orginal Contact flow.
  * @param smaEvent
  * @param action
  * @returns SMA Action defined after end flow Module
  */
class EndModule {
    async processFlowActionEndFlowModuleExecution(smaEvent, action, actions, amazonConnectInstanceID, bucketName, InvokeModuleARNMap, InvokationModuleNextAction, ActualFlowARN, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ContactFlowARNMap) {
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            InvokeModuleARNMap.delete(callId);
            let nextaction_id = InvokationModuleNextAction.get(callId);
            let contactFlow_id = ActualFlowARN.get(callId);
            const contactFlow = await (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, contactFlow_id, bucketName, smaEvent, "Contact_Flow");
            let nextAction = (0, find_action_id_1.findActionByID)(contactFlow.Actions, nextaction_id);
            InvokationModuleNextAction.delete(callId);
            return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName);
        }
        catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution EndFlowModule" + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.EndModule = EndModule;
