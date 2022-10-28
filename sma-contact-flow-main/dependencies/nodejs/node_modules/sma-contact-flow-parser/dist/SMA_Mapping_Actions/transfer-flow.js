"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrasferToFlow = void 0;
const call_details_1 = require("../utility/call-details");
const termination_event_1 = require("../utility/termination-event");
const contact_flow_loader_1 = require("../contact-flow-loader");
const contact_flow_processor_1 = require("../contact-flow-processor");
/**
  * Transfer to another Contact Flow to Execute.
  * @param smaEvent
  * @param action
  * @returns SMA Action of Another Contact Flow
  */
class TrasferToFlow {
    async processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName, defaultLogger, ContactFlowARNMap, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN) {
        let TransferFlowARN = action.Parameters.ContactFlowId;
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            ContactFlowARNMap.set(callId, TransferFlowARN);
            const contactFlow = await (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, TransferFlowARN, bucketName, smaEvent, "Contact_Flow");
            console.log(defaultLogger + callId + " Transfering to Another contact FLow function");
            return await (0, contact_flow_processor_1.processRootFlowBlock)(smaEvent, contactFlow, smaEvent.CallDetails.TransactionAttributes, amazonConnectInstanceID, bucketName);
        }
        catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of TransferToFlow " + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.TrasferToFlow = TrasferToFlow;
