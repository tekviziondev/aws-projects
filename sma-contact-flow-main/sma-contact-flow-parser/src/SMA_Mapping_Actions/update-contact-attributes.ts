import { getLegACallDetails } from "../utility/call-details";
import { findActionByID } from "../utility/find-action-id";
import { ErrorTypes } from "../utility/error-types";
import { processFlowAction } from "../contact-flow-processor"
import { getNextActionForError } from "../utility/next-action-error"
/**
  * Updating the Contact Attribute Details
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns The Next SMA Action to perform
  */
export class UpdateContactAttrbts {
    async processFlowActionUpdateContactAttributes(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string,contextStore:any) {
        let callId: string;
        let tmpMap=contextStore['tmpMap']
        let contextAttributes=contextStore['contextAttributes']
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            
            let ContactAttributes: any[][] = Object.entries(action.Parameters.Attributes);
            for (let i = 0; i < ContactAttributes.length; i++) {
                let x: string = ContactAttributes[i][1]
                if (x.includes("$.External.")) {
                    let tmp: any[] = x.split("$.External.")
                    if (tmpMap.has(tmp[1])) {
                        contextAttributes.set("$.Attributes." + ContactAttributes[i][0], tmpMap.get(tmp[1]))
                    }
                }
                else if (x.includes("$.Attributes.")) {
                    let tmp: any[] = x.split("$.Attributes.")
                    if (tmpMap.has(tmp[1])) {
                        contextAttributes.set("$.Attributes." + ContactAttributes[i][0], tmpMap.get(tmp[1]))
                    }
                }
                else {
                    contextAttributes.set("$.Attributes." + ContactAttributes[i][0], ContactAttributes[i][1])
                }
            }
        } catch (e) {
            let nextAction = await getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent, defaultLogger);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName,contextStore);
        }
        tmpMap.clear();
        let nextAction = findActionByID(actions, action.Transitions.NextAction);
        console.error(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName,contextStore);
    }
}