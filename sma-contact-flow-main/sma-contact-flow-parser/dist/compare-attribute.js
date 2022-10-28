"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareAttribute = void 0;
const call_details_1 = require("./utility/call-details");
const find_action_id_1 = require("./utility/find-action-id");
const ErrorTypes_1 = require("./utility/ErrorTypes");
const contact_flow_processor_1 = require("./contact-flow-processor");
const ComparisonOperators_1 = require("./utility/ComparisonOperators");
/**
  * Making a SMA action to Ends the current flow and transfers the customer to a flow of type contact flow.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
class CompareAttribute {
    async processFlowActionCompareContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextAttributs) {
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        let callId;
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        let comparVariable = action.Parameters.ComparisonValue;
        let nextAction;
        try {
            let ComparisonValue = contextAttributs.get(comparVariable);
            const condition = action.Transitions.Conditions;
            for (let index = 0; index < condition.length; index++) {
                console.log(defaultLogger + callId + "Recieved Value " + ComparisonValue);
                console.log(defaultLogger + callId + "Expected Value " + condition[index].Condition.Operands[0]);
                switch (condition[index].Condition.Operator) {
                    case ComparisonOperators_1.Operators.Equals:
                        if (condition[index].Condition.Operands[0] === ComparisonValue) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                            nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction_id);
                        }
                        break;
                    case ComparisonOperators_1.Operators.NumberLessThan:
                        if (ComparisonValue < condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                            nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction_id);
                        }
                        break;
                    case ComparisonOperators_1.Operators.NumberLessOrEqualTo:
                        if (ComparisonValue <= condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                            nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction_id);
                        }
                        break;
                    case ComparisonOperators_1.Operators.NumberGreaterThan:
                        if (ComparisonValue > condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                            nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction_id);
                        }
                        break;
                    case ComparisonOperators_1.Operators.NumberLessOrEqualTo:
                        if (ComparisonValue >= condition[index].Condition.Operands[0]) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                            nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction_id);
                        }
                        break;
                    case ComparisonOperators_1.Operators.TextStartsWith:
                        if (ComparisonValue.startsWith(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                            nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction_id);
                        }
                        break;
                    case ComparisonOperators_1.Operators.TextEndsWith:
                        if (ComparisonValue.endsWith(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                            nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction_id);
                        }
                        break;
                    case ComparisonOperators_1.Operators.TextContains:
                        if (ComparisonValue.includes(condition[index].Condition.Operands[0])) {
                            let nextAction_id = condition[index].NextAction;
                            console.log(defaultLogger + callId + " Next Action identifier" + nextAction_id);
                            nextAction = (0, find_action_id_1.findActionByID)(actions, nextAction_id);
                        }
                        break;
                }
            }
            if (nextAction === null || !nextAction || nextAction === "undefined") {
                console.log(defaultLogger + callId + " Next Action is inValid");
                let nextAction = await (0, contact_flow_processor_1.getNextActionForError)(action, actions, ErrorTypes_1.ErrorTypes.NoMatchingCondition, smaEvent);
                return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
            }
        }
        catch (e) {
            let nextAction = await (0, contact_flow_processor_1.getNextActionForError)(action, actions, ErrorTypes_1.ErrorTypes.NoMatchingCondition, smaEvent);
            return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        }
        return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }
}
exports.CompareAttribute = CompareAttribute;
