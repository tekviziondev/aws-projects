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
  async processFlowActionEndFlowModuleExecution(smaEvent: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger:string, contextStore:any) {
    let callId: string;
    try {
      const legA = getLegACallDetails(smaEvent);
      callId = legA.CallId;
      if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
      let nextaction_id = contextStore['invokationModuleNextAction']
      let contactFlow_id = contextStore['actualFlowARN']
      contextStore['invokationModuleNextAction']=null;
      contextStore['invokeModuleARN']=null;
      const contactFlow = await loadContactFlow(amazonConnectInstanceID, contactFlow_id, bucketName, smaEvent, "Contact_Flow");
      let nextAction = findActionByID(contactFlow.Actions, nextaction_id);
      return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,contextStore);
    } catch (error) {
      console.error(defaultLogger + callId + " There is an Error in execution EndFlowModule" + error.message);
      return await terminatingFlowAction(smaEvent, defaultLogger, "error")
    }

  }
}