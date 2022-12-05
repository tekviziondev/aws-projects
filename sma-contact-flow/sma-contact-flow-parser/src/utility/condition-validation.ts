import { CallDetailsUtil } from "./call-details";
import { TerminatingFlowUtil } from "./default-termination-action"
import { processFlowAction } from "../contact-flow-processor";
import { AmazonConnectActions } from "../const/amazon-connect-action-types"
import { NextActionValidationUtil } from "./next-action-error-handler"
import { ErrorTypes } from "../const/error-types"
import { Attributes } from "../const/constant-values";
import { IContextStore } from "../const/context-store";

export class ConditionValidationUtil {

    /**
      * This method will validate the Recieved digits from the SMA Event and perform the next action based on the condition defined in the Contact Flow
      * @param smaEvent 
      * @param actionObj
      * @param contactFlow
      * @param amazonConnectInstanceID
      * @param bucketName
      * @param recieved_digits
      * @param contextStore
      * @returns SMA Action
      */
    async processFlowConditionValidation(smaEvent: any, actionObj: any, contactFlow: any, recieved_digits: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let nextAction: any;
        let nextAction_id: any;
        let callId: string;
        try {
            let currentAction = contactFlow.Actions.find((action: any) => action.Identifier === actionObj.Identifier);
            const condition = currentAction.Transitions.Conditions;
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
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
                        nextAction = callDetails.findActionObjectByID(contactFlow.Actions, nextAction_id)
                        break;
                    }
                }

                if (!nextAction_id && actionObj.Parameters.StoreInput == "False") {
                    nextAction = await new NextActionValidationUtil().getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.NO_MATCHING_CONDITION, smaEvent);
                    console.log(Attributes.DEFAULT_LOGGER + callId + " Conditions are not matching with Recieved Digits ");

                } else if ((!nextAction_id && actionObj.Parameters.StoreInput == "True")) {
                    nextAction = await new NextActionValidationUtil().getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent);
                    console.log(Attributes.DEFAULT_LOGGER + callId + " Conditions are not matching with Recieved Digits ");
                }
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + nextAction_id);
                let actionType = nextAction.Type;
                //checking for supported action if not supported invoke default call termination handler
                if (!Object.values(AmazonConnectActions).includes(actionType)) {
                    return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, actionType)
                }
                return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName, contextStore);
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of validating the Recieved Digits " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }
}