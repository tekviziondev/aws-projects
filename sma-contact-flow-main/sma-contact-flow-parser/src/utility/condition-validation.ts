import { getLegACallDetails } from "./call-details";
import { findActionByID } from "./find-action-id";
import { terminatingFlowAction } from "./termination-event"
import { processFlowAction } from "../contact-flow-processor";
import { AmazonConnectActions} from "./AmazonConnectActionTypes"
import { getNextActionForError} from "./next-action-error"
import {ErrorTypes }from "./ErrorTypes"
/**
  * This function will validate the Recieved digits based on the condition defined in the Block
  * @param smaEvent 
  * @param actionObj
  * @param contactFlow
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param recieved_digits
  * @returns SMA Action
  */
export async function processFlowConditionValidation(smaEvent: any, actionObj: any, contactFlow: any, recieved_digits: any, amazonConnectInstanceID: string, bucketName: string,defaultLogger:string,puaseAction:any,SpeechAttributeMap:Map<string, string>, contextAttributs:Map<any, any>, ActualFlowARN:Map<string, string>, ContactFlowARNMap: Map<string, string>) {
    let currentAction = contactFlow.Actions.find((action: any) => action.Identifier === actionObj.Identifier);
    let smaAction: any;
    let nextAction: any;
    let nextAction_id: any;
    const condition = currentAction.Transitions.Conditions;
    let callId: string;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    if (smaEvent != null && condition.length > 0) {
        for (let index = 0; index < condition.length; index++) {
            console.log(defaultLogger + callId + " Recieved Digits " + recieved_digits);
            console.log(defaultLogger + callId + " Condition Operands " + condition[index].Condition.Operands[0]);
            if (condition[index].Condition.Operands[0] === recieved_digits) {
                nextAction_id = condition[index].NextAction;
                console.log(defaultLogger + callId + " The condition passsed with recieved digit " + recieved_digits);
                console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                nextAction = findActionByID(contactFlow.Actions, nextAction_id)
                break;
            }
        }

        if (!nextAction_id && actionObj.Parameters.StoreInput == "False") {
            nextAction = await getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.NoMatchingCondition, smaEvent,defaultLogger);
            console.log(defaultLogger + callId + " Conditions are not matching with Recieved Digits ");

        } else if ((!nextAction_id && actionObj.Parameters.StoreInput == "True")) {
            nextAction = await getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.NoMatchingError, smaEvent,defaultLogger);
            console.log(defaultLogger + callId + " Conditions are not matching with Recieved Digits ");
        }
        console.log(defaultLogger + callId + " Next Action identifier:" + nextAction_id);
        let actionType = nextAction.Type;
        if (!AmazonConnectActions.hasOwnProperty(actionType)) {
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributs, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, actionType)
        }
        return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName);
    }
}