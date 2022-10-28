"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndModule = void 0;
const call_details_1 = require("./utility/call-details");
const find_action_id_1 = require("./utility/find-action-id");
const contact_flow_processor_1 = require("./contact-flow-processor");
const contact_flow_loader_1 = require("./contact-flow-loader");
class EndModule {
    async processFlowActionEndFlowModuleExecution(smaEvent, action, actions, amazonConnectInstanceID, bucketName, InvokeModuleARNMap, InvokationModuleNextAction, ActualFlowARN) {
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        InvokeModuleARNMap.delete(callId);
        let nextaction_id = InvokationModuleNextAction.get(callId);
        let contactFlow_id = ActualFlowARN.get(callId);
        const contactFlow = await (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, contactFlow_id, bucketName, smaEvent, "Contact_Flow");
        let nextAction = (0, find_action_id_1.findActionByID)(contactFlow.Actions, nextaction_id);
        InvokationModuleNextAction.delete(callId);
        return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName);
    }
}
exports.EndModule = EndModule;
