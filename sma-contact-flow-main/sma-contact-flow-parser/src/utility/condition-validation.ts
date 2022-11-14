import { getLegACallDetails } from "./call-details";
import { findActionByID } from "./find-action-id";
import { terminatingFlowAction } from "./termination-action"
import { processFlowAction } from "../contact-flow-processor";
import { AmazonConnectActions } from "./amazon-connect-actionTypes"
import { getNextActionForError } from "./next-action-error"
import { ErrorTypes } from "./error-types"
import { Attributes } from "../utility/constant-values";
import { IContextStore } from "./context-store";
/**
  * This function will validate the Recieved digits based on the condition defined in the Block
  * @param smaEvent 
  * @param actionObj
  * @param contactFlow
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param recieved_digits
  * @param contextStore
  * @returns SMA Action
  */
export async function processFlowConditionValidation(smaEvent: any, actionObj: any, contactFlow: any, recieved_digits: any, amazonConnectInstanceID: string, bucketName: string, contextStore:IContextStore) {
    let nextAction: any;
    let nextAction_id: any;
    let callId: string;
    try {
        let currentAction = contactFlow.Actions.find((action: any) => action.Identifier === actionObj.Identifier);
        const condition = currentAction.Transitions.Conditions;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        if (smaEvent && condition.length > 0) {
            for (let index = 0; index < condition.length; index++) {
                console.log(Attributes.DEFAULT_LOGGER + callId + " Recieved Digits " + recieved_digits);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Condition Operands " + condition[index].Condition.Operands[0]);
                if (condition[index].Condition.Operands[0] === recieved_digits) {
                    nextAction_id = condition[index].NextAction;
                    console.log(Attributes.DEFAULT_LOGGER + callId + " The condition passsed with recieved digit " + recieved_digits);
                    console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier" + nextAction_id)
                    nextAction = findActionByID(contactFlow.Actions, nextAction_id)
                    break;
                }
            }

            if (!nextAction_id && actionObj.Parameters.StoreInput == "False") {
                nextAction = await getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.NO_MATCHING_CONDITION, smaEvent);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Conditions are not matching with Recieved Digits ");

            } else if ((!nextAction_id && actionObj.Parameters.StoreInput == "True")) {
                nextAction = await getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Conditions are not matching with Recieved Digits ");
            }
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + nextAction_id);
            let actionType = nextAction.Type;
            if (!Object.values(AmazonConnectActions).includes(actionType)) {
                return await terminatingFlowAction(smaEvent, actionType)
            }
            return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName, contextStore);
        }
    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of validating the Recieved Digits " + error.message);
        return await terminatingFlowAction(smaEvent, "error")
    }
}
