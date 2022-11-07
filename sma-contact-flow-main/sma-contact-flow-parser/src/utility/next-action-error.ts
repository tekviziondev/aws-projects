import { getLegACallDetails } from "./call-details";
import { findActionByID } from "./find-action-id";
import { terminatingFlowAction } from "./termination-action";
/**
  * Based on the Error condition, the Next action will be performed
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param defaultLogger
  * @returns SMA Action
  */
export async function getNextActionForError(currentAction: any, contactFlow: any, ErrorType: any, smaEvent: any, defaultLogger: string, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, pauseAction: any) {
    let callId: string;
    try {
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let nextAction: any;
        console.log(defaultLogger + callId + " Error Action Count:" + currentAction.Transitions.Errors);
        console.log(defaultLogger + callId + " Next Action Validation:" + currentAction.Transitions.Errors.length);
        if (currentAction.Transitions.Errors.length > 2 && currentAction.Transitions.Errors[2].ErrorType.includes(ErrorType)) {
            nextAction = findActionByID(contactFlow, currentAction.Transitions.Errors[2].NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + currentAction.Transitions.Errors[2].NextAction);
        } else if (currentAction.Transitions.Errors.length > 1 && currentAction.Transitions.Errors[1].ErrorType.includes(ErrorType)) {
            nextAction = findActionByID(contactFlow, currentAction.Transitions.Errors[1].NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + currentAction.Transitions.Errors[1].NextAction);
        }
        else if (currentAction.Transitions.Errors.length > 0 && currentAction.Transitions.Errors[0].ErrorType.includes(ErrorType)) {
            nextAction = findActionByID(contactFlow, currentAction.Transitions.Errors[0].NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + currentAction.Transitions.Errors[0].NextAction);
        }
        return nextAction;
    } catch (error) {
        console.error(defaultLogger + callId + " There is an Error in execution of getting the Next action for Error case " + error.message);
        return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
    }
}
