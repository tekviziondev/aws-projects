"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvokeLambda = void 0;
const call_details_1 = require("../utility/call-details");
const constant_values_1 = require("../utility/constant-values");
const termination_action_1 = require("../utility/termination-action");
const find_action_id_1 = require("../utility/find-action-id");
const error_types_1 = require("../utility/error-types");
const contact_flow_processor_1 = require("../contact-flow-processor");
const next_action_error_1 = require("../utility/next-action-error");
const aws_sdk_1 = require("aws-sdk");
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
    async processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName, contextStore) {
        let callId;
        let regionVal = "";
        if (constant_values_1.Attributes.region)
            regionVal = constant_values_1.Attributes.region;
        else
            regionVal = 'us-east-1';
        const lambda = new aws_sdk_1.Lambda({ region: regionVal });
        try {
            const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let LambdaARN = action.Parameters.LambdaFunctionARN;
            let inputForInvoking = await inputForInvokingLambda(action, contextStore);
            const params = {
                FunctionName: LambdaARN,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(inputForInvoking)
            };
            let result = await lambda.invoke(params).promise();
            if (!result) {
                let nextAction = await (0, next_action_error_1.getNextActionForError)(action, actions, error_types_1.ErrorTypes.NO_MATCHING_ERROR, smaEvent);
                return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
            let x = JSON.parse(result.Payload.toString());
            console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " The Result After Invoking Lambda is" + JSON.stringify(x));
            const keys = Object.keys(x);
            keys.forEach((key, index) => {
                contextStore[constant_values_1.ContextStore.CONTEXT_ATTRIBUTES]["$.External." + key] = x[key];
                contextStore[constant_values_1.ContextStore.TMP_MAP][key] = x[key];
            });
            let nextAction = (0, find_action_id_1.findActionByID)(actions, action.Transitions.NextAction);
            console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        }
        catch (error) {
            console.error(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution InvokeLambda" + error.message);
            return await (0, termination_action_1.terminatingFlowAction)(smaEvent, "error");
        }
    }
}
exports.InvokeLambda = InvokeLambda;
/**
  * Gets the input for invoking the Lambda from the Amazon connect action Block
  * @param smaEvent
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */
async function inputForInvokingLambda(action, contextStore) {
    let InvocationAttributes = Object.entries(action.Parameters.LambdaInvocationAttributes);
    let contextAttributes = contextStore[constant_values_1.ContextStore.CONTEXT_ATTRIBUTES];
    for (let i = 0; i < InvocationAttributes.length; i++) {
        // checking if the attribute value contains any user defined, system or External attributes for replacing it to the corresponding value
        if (InvocationAttributes[i][1].includes("$.External.") || InvocationAttributes[i][1].includes("$.Attributes.")) {
            const keys = Object.keys(contextAttributes);
            keys.forEach((key, index) => {
                if (InvocationAttributes[i][1] == key)
                    InvocationAttributes[i][1] = InvocationAttributes[i][1].replace(key, contextAttributes[key]);
            });
        }
    }
    let lambdaFunctionParameters = Object.fromEntries(InvocationAttributes.map(([k, v]) => [k, v]));
    let inputForInvoking = {
        "Details": {
            "ContactData": {
                "Attributes": {},
                [constant_values_1.LambdaFunctionParameters.CHANNEL]: contextAttributes[constant_values_1.ContextAttributes.CHANNEL],
                [constant_values_1.LambdaFunctionParameters.CONTACTID]: contextAttributes[constant_values_1.ContextAttributes.CONTACTID],
                [constant_values_1.LambdaFunctionParameters.CUSTOMER_ENDPOINT]: {
                    [constant_values_1.LambdaFunctionParameters.ADDRESS]: contextAttributes[constant_values_1.ContextAttributes.CUSTOMER_ENDPOINT_ADDRESS],
                    [constant_values_1.LambdaFunctionParameters.TYPE]: contextAttributes[constant_values_1.ContextAttributes.CUSTOMER_ENDPOINT_TYPE]
                },
                [constant_values_1.LambdaFunctionParameters.INITIAL_CONTACTID]: contextAttributes[constant_values_1.ContextAttributes.INSTANCE_ARN],
                [constant_values_1.LambdaFunctionParameters.INITIATION_METHOD]: contextAttributes[constant_values_1.ContextAttributes.INITIATION_METHOD],
                [constant_values_1.LambdaFunctionParameters.INSTANCE_ARN]: contextAttributes[constant_values_1.ContextAttributes.INSTANCE_ARN],
                [constant_values_1.LambdaFunctionParameters.SYSTEM_ENDPOINT]: {
                    [constant_values_1.LambdaFunctionParameters.ADDRESS]: contextAttributes[constant_values_1.ContextAttributes.SYSTEM_ENDPOINT_ADDRESS],
                    [constant_values_1.LambdaFunctionParameters.TYPE]: contextAttributes[constant_values_1.ContextAttributes.SYSTEM_ENDPOINT_TYPE]
                }
            },
            "Parameters": lambdaFunctionParameters
        },
        "Name": "ContactFlowEvent"
    };
    return inputForInvoking;
}
