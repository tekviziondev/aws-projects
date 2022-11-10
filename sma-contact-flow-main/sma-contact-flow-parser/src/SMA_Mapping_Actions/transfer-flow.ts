import { getLegACallDetails } from "../utility/call-details";
import { terminatingFlowAction } from "../utility/termination-action";
import { loadContactFlow } from "../contact-flow-loader"
import { processRootFlowBlock } from "../contact-flow-processor"
import { Attributes, ContextStore } from "../utility/constant-values";

/**
  * Transfer to another Contact Flow to Execute.
  * @param smaEvent 
  * @param action
  * @returns SMA Action of Another Contact Flow
  */

export class TrasferToFlow {
    async processFlowActionTransferToFlow(smaEvent: any, action: any, amazonConnectInstanceID: string, bucketName: string, contextStore:any ){
        let callId: string;
        try {
            let TransferFlowARN = action.Parameters.ContactFlowId;
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
            contextStore[ContextStore.TRANSFER_FLOW_ARN]=TransferFlowARN
            const contactFlow = await loadContactFlow(amazonConnectInstanceID, TransferFlowARN, bucketName, smaEvent, "Contact_Flow");
            console.log(Attributes.DEFAULT_LOGGER + callId + " Transfering to Another contact FLow function")
            return await processRootFlowBlock(smaEvent, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of TransferToFlow " + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }

    }
}