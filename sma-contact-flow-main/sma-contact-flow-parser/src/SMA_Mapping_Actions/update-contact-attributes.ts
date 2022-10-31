import { getLegACallDetails } from "../utility/call-details";
import { findActionByID } from "../utility/find-action-id";
import { ErrorTypes } from "../utility/ErrorTypes";
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
    async processFlowActionUpdateContactAttributes(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, tmpMap: Map<any, any>, contextAttributes: Map<any, any>) {
        const legA = getLegACallDetails(smaEvent);
        let callId: string;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let ContactAttributes: any[][] = Object.entries(action.Parameters.Attributes);
        try {
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
            let nextAction = await getNextActionForError(action, actions, ErrorTypes.NoMatchingError, smaEvent,defaultLogger);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        }
        tmpMap.clear();
        let nextAction = findActionByID(actions, action.Transitions.NextAction);
        console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }
}