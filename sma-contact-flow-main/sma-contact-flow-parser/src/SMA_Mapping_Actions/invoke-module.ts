
import { getLegACallDetails } from "../utility/call-details";
import { terminatingFlowAction } from "../utility/termination-action";
import { loadContactFlow } from "../contact-flow-loader"
import { processRootFlowBlock } from "../contact-flow-processor"

/**
  * Invoke a Module from the existing contact flow, to perform a particular task
  * @param smaEvent 
  * @param action
  * @returns SMA Action defined in the Module
  */

export class InvokeModule {
    async processFlowActionInvokeFlowModule(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, InvokeModuleARNMap: Map<string, string>, InvokationModuleNextAction: Map<string, string>, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, pauseAction: any) {
        let ModuleARN = action.Parameters.FlowModuleId;
        let callId: string;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            InvokeModuleARNMap.set(callId, ModuleARN)
            let endModuleNextAction = action.Transitions.NextAction;
            InvokationModuleNextAction.set(callId, endModuleNextAction);
            const contactFlow = await loadContactFlow(amazonConnectInstanceID, ModuleARN, bucketName, smaEvent, "Invoke_Module");
            console.log(defaultLogger + callId + " Transfering to Another contact FLow function")
            return await processRootFlowBlock(smaEvent, contactFlow, smaEvent.CallDetails.TransactionAttributes, amazonConnectInstanceID, bucketName);
        } catch (error) {
            console.error(defaultLogger + callId + " There is an Error in execution of InvokeModule" + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
        }

    }
}