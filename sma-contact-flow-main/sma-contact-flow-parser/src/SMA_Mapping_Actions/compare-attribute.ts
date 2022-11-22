import { getLegACallDetails } from "../utility/call-details";
import { findActionByID } from "../utility/find-action-id";
import { ErrorTypes } from "../utility/error-types";
import { processFlowAction } from "../contact-flow-processor";
import { Operators } from "../utility/comparison-operators";
import { getNextActionForError } from "../utility/next-action-error";
import { Attributes } from "../utility/constant-values";
import { IContextStore } from "../utility/context-store";
import { METRIC_PARAMS } from "../utility/constant-values"
import { updateMetric } from "../utility/metric-updation"
/**
  * Comparing Contact Attributes and based on the result navigate to the Next Action
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA Action
  */


export class CompareAttribute {
    async processFlowActionCompareContactAttributes(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let nextAction: any;
        let params = METRIC_PARAMS
        params.MetricData[0].Dimensions[0].Value = contextStore.ContextAttributes['$.InstanceARN']
        if (contextStore['InvokeModuleARN']) {
            params.MetricData[0].Dimensions[1].Name = 'Module Flow ID'
            params.MetricData[0].Dimensions[1].Value = contextStore['InvokeModuleARN']
        }
        else if (contextStore['TransferFlowARN']) {
            params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
            params.MetricData[0].Dimensions[1].Value = contextStore['TransferFlowARN']
        }
        else {
            params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
            params.MetricData[0].Dimensions[1].Value = contextStore['ActualFlowARN']
        }
        try {
            let callId: string;
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let comparVariable = action.Parameters.ComparisonValue;
            let ComparisonValue = contextStore[Attributes.CONNECT_CONTEXT_STORE][comparVariable];
            const condition = action.Transitions.Conditions;
            for (let index = 0; index < condition.length; index++) {
                console.log(Attributes.DEFAULT_LOGGER + callId + "| Recieved Value |" + ComparisonValue);
                console.log(Attributes.DEFAULT_LOGGER + callId + "Expected Value |" + condition[index].Condition.Operands[0]);
                switch (condition[index].Condition.Operator) {
                    case Operators.EQAULS:
                        if (condition[index].Condition.Operands[0] === ComparisonValue) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier|" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;

                    case Operators.NUMBER_LESS_THAN:
                        if (ComparisonValue < condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NUMBER_LESS_OR_EQUAL_TO:
                        if (ComparisonValue <= condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NUMBER_GREATER_THAN:
                        if (ComparisonValue > condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.NUMBER_LESS_OR_EQUAL_TO:
                        if (ComparisonValue >= condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TEXT_STARTS_WITH:
                        if (ComparisonValue.startsWith(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TEXT_ENDS_WITH:
                        if (ComparisonValue.endsWith(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                    case Operators.TEXT_CONTAINS:
                        if (ComparisonValue.includes(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action identifier |" + nextAction_id)
                            nextAction = findActionByID(actions, nextAction_id)
                        }
                        break;
                }
            }
            if (!nextAction) {
                console.log(Attributes.DEFAULT_LOGGER + callId + "| Next Action is inValid");
                let nextAction = await getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_CONDITION, smaEvent);
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
            params.MetricData[0].MetricName = "CompareAttributeSuccess"
            updateMetric(params);
        } catch (e) {
            params.MetricData[0].MetricName = "CompareAttributeFailure"
            updateMetric(params);
            let nextAction = await getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_CONDITION, smaEvent);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        }
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
    }

}

