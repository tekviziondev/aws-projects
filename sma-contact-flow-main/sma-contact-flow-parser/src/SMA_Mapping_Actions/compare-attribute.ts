import { CallDetailsUtil } from "../utility/call-details";
import { ErrorTypes } from "../const/error-types";
import { processFlowAction } from "../contact-flow-processor";
import { Operators } from "../const/comparison-operators";
import { NextActionValidationUtil } from "../utility/next-action-error-handler";
import { Attributes } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"
/**
  * Comparing Contact Attributes with the operator specified by the user and navigating to the Next Contact Flow Action based on the result of comparison
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA action
  */
export class CompareAttribute {
    async processFlowActionCompareContactAttributes(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let nextAction: any;
        // creating cloud watch metric parameter and updating the metric in cloud watch
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            let callId: string;
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let comparVariable = action.Parameters.ComparisonValue;
            let ComparisonValue = contextStore[Attributes.CONNECT_CONTEXT_STORE][comparVariable];
            const condition = action.Transitions.Conditions;
            // iterating the specified conditional statements by the user
            for (let index = 0; index < condition.length; index++) {
                console.log(Attributes.DEFAULT_LOGGER + callId + "| Recieved Value |" + ComparisonValue);
                console.log(Attributes.DEFAULT_LOGGER + callId + "Expected Value |" + condition[index].Condition.Operands[0]);
                switch (condition[index].Condition.Operator) {
                    case Operators.EQAULS:
                        if (condition[index].Condition.Operands[0] === ComparisonValue) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier|" + nextAction_id)
                            let callDetails = new CallDetailsUtil();
                            nextAction = callDetails.findActionObjectByID(actions, nextAction_id)
                        }
                        break;

                    case Operators.NUMBER_LESS_THAN:
                        if (ComparisonValue < condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            let callDetails = new CallDetailsUtil();
                            nextAction = callDetails.findActionObjectByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NUMBER_LESS_OR_EQUAL_TO:
                        if (ComparisonValue <= condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            let callDetails = new CallDetailsUtil();
                            nextAction = callDetails.findActionObjectByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NUMBER_GREATER_THAN:
                        if (ComparisonValue > condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            let callDetails = new CallDetailsUtil();
                            nextAction = callDetails.findActionObjectByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NUMBER_LESS_OR_EQUAL_TO:
                        if (ComparisonValue >= condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            let callDetails = new CallDetailsUtil();
                            nextAction = callDetails.findActionObjectByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TEXT_STARTS_WITH:
                        if (ComparisonValue.startsWith(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            let callDetails = new CallDetailsUtil();
                            nextAction = callDetails.findActionObjectByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TEXT_ENDS_WITH:
                        if (ComparisonValue.endsWith(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            let callDetails = new CallDetailsUtil();
                            nextAction = callDetails.findActionObjectByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TEXT_CONTAINS:
                        if (ComparisonValue.includes(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            let callDetails = new CallDetailsUtil();
                            nextAction = callDetails.findActionObjectByID(actions, nextAction_id)
                        }
                        break;
                }
            }
            if (!nextAction) {
                console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action is inValid");
                let nextAction = await new NextActionValidationUtil().getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_CONDITION, smaEvent);
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
            params.MetricData[0].MetricName = "CompareAttributeSuccess"
            metric.updateMetric(params);
        } catch (e) {
            params.MetricData[0].MetricName = "CompareAttributeFailure"
            metric.updateMetric(params);
            let nextAction = await new NextActionValidationUtil().getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_CONDITION, smaEvent);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        }
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
    }

}

