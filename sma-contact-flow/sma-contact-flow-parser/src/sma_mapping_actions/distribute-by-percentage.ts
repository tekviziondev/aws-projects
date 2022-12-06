import { CallDetailsUtil } from "../utility/call-details";
import { processFlowAction } from "../contact-flow-processor"
import { Attributes} from "../const/constant-values";
import { IContextStore } from "../const/context-store";

export class DistributeByPercentage{
    async execute (smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent) as any;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;    
        let nextAction = callDetails.findActionObjectByID(actions, action.Transitions.NextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
    }
}