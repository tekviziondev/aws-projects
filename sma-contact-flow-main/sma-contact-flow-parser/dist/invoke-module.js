"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvokeModule = void 0;
const call_details_1 = require("./utility/call-details");
const contact_flow_loader_1 = require("./contact-flow-loader");
const contact_flow_processor_1 = require("./contact-flow-processor");
class InvokeModule {
    async processFlowActionInvokeFlowModule(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, InvokeModuleARNMap, InvokationModuleNextAction) {
        let ModuleARN = action.Parameters.FlowModuleId;
        let callId;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        InvokeModuleARNMap.set(callId, ModuleARN);
        let endModuleNextAction = action.Transitions.NextAction;
        InvokationModuleNextAction.set(callId, endModuleNextAction);
        const contactFlow = await (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, ModuleARN, bucketName, smaEvent, "Invoke_Module");
        console.log(defaultLogger + callId + " Transfering to Another contact FLow function");
        return await (0, contact_flow_processor_1.processRootFlowBlock)(smaEvent, contactFlow, smaEvent.CallDetails.TransactionAttributes, amazonConnectInstanceID, bucketName);
    }
}
exports.InvokeModule = InvokeModule;
