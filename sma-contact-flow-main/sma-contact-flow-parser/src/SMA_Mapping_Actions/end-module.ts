import { getLegACallDetails } from "../utility/call-details";
import { terminatingFlowAction } from "../utility/termination-action";
import { findActionByID } from "../utility/find-action-id";
import { processFlowAction } from "../contact-flow-processor"
import { loadContactFlow } from "../contact-flow-loader"

/**
  * End the execution of the current Module and returns Back to Orginal Contact flow.
  * @param smaEvent 
  * @param action
  * @returns SMA Action defined after end flow Module
  */

export class EndModule {
  async processFlowActionEndFlowModuleExecution(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, InvokeModuleARNMap: Map<string, string>, InvokationModuleNextAction: Map<string, string>, ActualFlowARN: Map<string, string>, defaultLogger: string, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ContactFlowARNMap: Map<string, string>) {
    let callId: string;
    try {
      const legA = getLegACallDetails(smaEvent);
      callId = legA.CallId;
      if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
      InvokeModuleARNMap.delete(callId)
      let nextaction_id = InvokationModuleNextAction.get(callId)
      let contactFlow_id = ActualFlowARN.get(callId)
      const contactFlow = await loadContactFlow(amazonConnectInstanceID, contactFlow_id, bucketName, smaEvent, "Contact_Flow");
      let nextAction = findActionByID(contactFlow.Actions, nextaction_id);
      InvokationModuleNextAction.delete(callId);
      return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName);
    } catch (error) {
      console.error(defaultLogger + callId + " There is an Error in execution EndFlowModule" + error.message);
      return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
    }

  }
}