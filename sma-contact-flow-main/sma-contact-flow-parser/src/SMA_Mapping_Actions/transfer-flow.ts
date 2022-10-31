import { getLegACallDetails } from "../utility/call-details";
import { terminatingFlowAction } from "../utility/termination-event";
import { loadContactFlow } from "../contact-flow-loader"
import { processRootFlowBlock } from "../contact-flow-processor"

/**
  * Transfer to another Contact Flow to Execute.
  * @param smaEvent 
  * @param action
  * @returns SMA Action of Another Contact Flow
  */

export class TrasferToFlow {
    async processFlowActionTransferToFlow(smaEvent: any, action: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, ContactFlowARNMap: Map<string, string>, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>) {
        let TransferFlowARN = action.Parameters.ContactFlowId;
        let callId: string;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            ContactFlowARNMap.set(callId, TransferFlowARN)
            const contactFlow = await loadContactFlow(amazonConnectInstanceID, TransferFlowARN, bucketName, smaEvent, "Contact_Flow");
            console.log(defaultLogger + callId + " Transfering to Another contact FLow function")
            return await processRootFlowBlock(smaEvent, contactFlow, smaEvent.CallDetails.TransactionAttributes, amazonConnectInstanceID, bucketName);
        } catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of TransferToFlow " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }

    }
}