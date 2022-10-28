"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const call_details_1 = require("./utility/call-details");
const ConstantValues_1 = require("./utility/ConstantValues");
const input_for_lambda_invoking_1 = require("./utility/input-for-lambda-invoking");
const find_action_id_1 = require("./utility/find-action-id");
const ErrorTypes_1 = require("./utility/ErrorTypes");
const contact_flow_processor_1 = require("./contact-flow-processor");
/**
  * Invokes the External Lambda Function and stores the result of the Lambda function in Key Value Pair
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns The Next SMA Action to perform
  */
class InvokeLambda {
    async processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextAttributs, loopMap, tmpMap) {
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        let callId;
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        const AWS = require("aws-sdk");
        const lambda = new AWS.Lambda({ region: ConstantValues_1.ConstData.region });
        let LambdaARN = action.Parameters.LambdaFunctionARN;
        let inputForInvoking = await (0, input_for_lambda_invoking_1.inputForInvokingLambda)(action, contextAttributs);
        const params = { FunctionName: LambdaARN,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(inputForInvoking)
        };
        let result = await lambda.invoke(params).promise();
        if (result === null && result === "undefined" && !result) {
            let nextAction = await (0, contact_flow_processor_1.getNextActionForError)(action, actions, ErrorTypes_1.ErrorTypes.NoMatchingError, smaEvent);
            return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        }
        let x = JSON.parse(result.Payload);
        console.log(defaultLogger + callId + " The Result After Invoking Lambda is" + JSON.stringify(x));
        const keys = Object.keys(x);
        keys.forEach((key, index) => {
            contextAttributs.set("$.External." + key, x[key]);
            tmpMap.set(key, x[key]);
        });
        let nextAction = (0, find_action_id_1.findActionByID)(actions, action.Transitions.NextAction);
        console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
        return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }
}
