import { getLegACallDetails } from "../utility/call-details";
import { terminatingFlowAction } from "../utility/termination-action";
import { findActionByID } from "../utility/find-action-id";
import { processFlowAction } from "../contact-flow-processor"
import { loadContactFlow } from "../contact-flow-loader"
import { Attributes, ContextStore } from "../utility/constant-values";
/**
  * End the execution of the current Module and returns Back to Orginal Contact flow.
  * @param smaEvent 
  * @param action
  * @returns SMA Action defined after end flow Module
  */

export class EndModule {
  async processFlowActionEndFlowModuleExecution(smaEvent: any, amazonConnectInstanceID: string, bucketName: string,contextStore:any) {
    let callId: string;
    try {
      const legA = getLegACallDetails(smaEvent);
      callId = legA.CallId;
      if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
      let nextaction_id = contextStore[ContextStore.INVOKATION_MODULE_NEXT_ACTION]
      let contactFlow_id = contextStore[ContextStore.ACTUAL_FLOW_ARN]
      contextStore[ContextStore.INVOKATION_MODULE_NEXT_ACTION]=null;
      contextStore[ContextStore.INVOKE_MODULE_ARN]=null;
      const contactFlow = await loadContactFlow(amazonConnectInstanceID, contactFlow_id, bucketName, smaEvent, "Contact_Flow");
      let nextAction = findActionByID(contactFlow.Actions, nextaction_id);
      return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,contextStore);
    } catch (error) {
      console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution EndFlowModule" + error.message);
      return await terminatingFlowAction(smaEvent, "error")
    }

  }
}
