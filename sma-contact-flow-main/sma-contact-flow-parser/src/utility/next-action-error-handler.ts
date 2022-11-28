import { CallDetailsUtil } from "./call-details";
import { TerminatingFlowUtil } from "./default-termination-action";
import { Attributes } from "../const/constant-values";

export class NextActionValidationUtil {

    /**
      * Based on the Error condition, the Next SMA action will be performed
      * @param smaEvent 
      * @param currentAction
      * @param contactFlow
      * @param ErrorType
      * @returns SMA action
      */
    async getNextActionForError(currentAction: any, contactFlow: any, ErrorType: any, smaEvent: any) {
        let callId: string;
        try {
            let callDetails = new CallDetailsUtil();
            // getting the CallID of the Active call from the SMA Event
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let nextAction: any;
            console.log(Attributes.DEFAULT_LOGGER + callId + " Error Action Count:" + currentAction.Transitions.Errors);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action Validation:" + currentAction.Transitions.Errors.length);
            //Based on the error type the next action will be performed
            if (currentAction.Transitions.Errors.length > 2 && currentAction.Transitions.Errors[2].ErrorType.includes(ErrorType)) {
                nextAction = callDetails.findActionObjectByID(contactFlow, currentAction.Transitions.Errors[2].NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + currentAction.Transitions.Errors[2].NextAction);
            } else if (currentAction.Transitions.Errors.length > 1 && currentAction.Transitions.Errors[1].ErrorType.includes(ErrorType)) {
                nextAction = callDetails.findActionObjectByID(contactFlow, currentAction.Transitions.Errors[1].NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + currentAction.Transitions.Errors[1].NextAction);
            }
            else if (currentAction.Transitions.Errors.length > 0 && currentAction.Transitions.Errors[0].ErrorType.includes(ErrorType)) {
                nextAction = callDetails.findActionObjectByID(contactFlow, currentAction.Transitions.Errors[0].NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + currentAction.Transitions.Errors[0].NextAction);
            }
            return nextAction;
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of getting the Next action for Error case " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }
}
