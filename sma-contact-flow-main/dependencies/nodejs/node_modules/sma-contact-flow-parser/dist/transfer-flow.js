"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrasferToFlow = void 0;
const call_details_1 = require("./utility/call-details");
const contact_flow_loader_1 = require("./contact-flow-loader");
const contact_flow_processor_1 = require("./contact-flow-processor");
class TrasferToFlow {
    async processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName, defaultLogger, ContactFlowARNMap) {
        let TransferFlowARN = action.Parameters.ContactFlowId;
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        ContactFlowARNMap.set(callId, TransferFlowARN);
        const contactFlow = await (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, TransferFlowARN, bucketName, smaEvent, "Contact_Flow");
        console.log(defaultLogger + callId + " Transfering to Another contact FLow function");
        return await (0, contact_flow_processor_1.processRootFlowBlock)(smaEvent, contactFlow, smaEvent.CallDetails.TransactionAttributes, amazonConnectInstanceID, bucketName);
    }
}
exports.TrasferToFlow = TrasferToFlow;
