import { getLegACallDetails } from "../utility/call-details";
import { findActionByID } from "../utility/find-action-id";
import { ErrorTypes } from "../utility/ErrorTypes";
import { processFlowAction } from "../contact-flow-processor";
import { Operators } from "../utility/ComparisonOperators";
import { getNextActionForError} from "../utility/next-action-error"
/**
  * Making a SMA action to Ends the current flow and transfers the customer to a flow of type contact flow.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */

export class CompareAttribute {
    async processFlowActionCompareContactAttributes(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, contextAttributes: Map<any, any>) {
        const legA = getLegACallDetails(smaEvent);
        let callId: string;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let comparVariable = action.Parameters.ComparisonValue;
        let nextAction: any;
        try {
            let ComparisonValue = contextAttributes.get(comparVariable);
            const condition = action.Transitions.Conditions;
            for (let index = 0; index < condition.length; index++) {
                console.log(defaultLogger + callId + "Recieved Value " + ComparisonValue);
                console.log(defaultLogger + callId + "Expected Value " + condition[index].Condition.Operands[0]);
                switch (condition[index].Condition.Operator) {
                    case Operators.Equals:
                        if (condition[index].Condition.Operands[0] === ComparisonValue) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;

                    case Operators.NumberLessThan:
                        if (ComparisonValue < condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NumberLessOrEqualTo:
                        if (ComparisonValue <= condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NumberGreaterThan:
                        if (ComparisonValue > condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NumberLessOrEqualTo:
                        if (ComparisonValue >= condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TextStartsWith:
                        if (ComparisonValue.startsWith(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TextEndsWith:
                        if (ComparisonValue.endsWith(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TextContains:
                        if (ComparisonValue.includes(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                }
            }
            if (nextAction === null || !nextAction ) {
                console.log(defaultLogger + callId + " Next Action is inValid");
                let nextAction = await getNextActionForError(action, actions, ErrorTypes.NoMatchingCondition, smaEvent,defaultLogger);
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
            }
        } catch (e) {
            let nextAction = await getNextActionForError(action, actions, ErrorTypes.NoMatchingCondition, smaEvent,defaultLogger);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        }
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }

}
