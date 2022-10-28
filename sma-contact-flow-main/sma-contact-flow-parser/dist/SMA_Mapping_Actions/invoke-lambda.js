"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvokeLambda = void 0;
const call_details_1 = require("../utility/call-details");
const ConstantValues_1 = require("../utility/ConstantValues");
const termination_event_1 = require("../utility/termination-event");
const find_action_id_1 = require("../utility/find-action-id");
const ErrorTypes_1 = require("../utility/ErrorTypes");
const contact_flow_processor_1 = require("../contact-flow-processor");
const next_action_error_1 = require("../utility/next-action-error");
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
    async processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextAttributes, loopMap, tmpMap, puaseAction, SpeechAttributeMap, ContactFlowARNMap, ActualFlowARN) {
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        let callId;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        const AWS = require("aws-sdk");
        const lambda = new AWS.Lambda({ region: ConstantValues_1.ConstData.region });
        try {
            let LambdaARN = action.Parameters.LambdaFunctionARN;
            let inputForInvoking = await inputForInvokingLambda(action, contextAttributes);
            const params = {
                FunctionName: LambdaARN,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(inputForInvoking)
            };
            let result = await lambda.invoke(params).promise();
            if (result === null && !result) {
                let nextAction = await (0, next_action_error_1.getNextActionForError)(action, actions, ErrorTypes_1.ErrorTypes.NoMatchingError, smaEvent, defaultLogger);
                return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
            }
            let x = JSON.parse(result.Payload);
            console.log(defaultLogger + callId + " The Result After Invoking Lambda is" + JSON.stringify(x));
            const keys = Object.keys(x);
            keys.forEach((key, index) => {
                contextAttributes.set("$.External." + key, x[key]);
                tmpMap.set(key, x[key]);
            });
            let nextAction = (0, find_action_id_1.findActionByID)(actions, action.Transitions.NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
            return await (0, contact_flow_processor_1.processFlowAction)(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        }
        catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution InvokeLambda" + error.message);
            return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error");
        }
    }
}
exports.InvokeLambda = InvokeLambda;
async function inputForInvokingLambda(action, contextAttributs) {
    let InvocationAttributes = Object.entries(action.Parameters.LambdaInvocationAttributes);
    for (let i = 0; i < InvocationAttributes.length; i++) {
        if (InvocationAttributes[i][1].includes("$.External.") || InvocationAttributes[i][1].includes("$.Attributes.")) {
            contextAttributs.forEach((value, key) => {
                if (InvocationAttributes[i][1] == key)
                    InvocationAttributes[i][1] = InvocationAttributes[i][1].replace(key, value);
            });
        }
    }
    let lambdaFunctionParameters = Object.fromEntries(InvocationAttributes.map(([k, v]) => [k, v]));
    let inputForInvoking = {
        "Details": {
            "ContactData": {
                "Attributes": {},
                "Channel": contextAttributs.get("$.Channel"),
                "ContactId": contextAttributs.get("$.ContactId"),
                "CustomerEndpoint": {
                    "Address": contextAttributs.get("$.CustomerEndpoint.Address"),
                    "Type": contextAttributs.get("$.CustomerEndpoint.Type")
                },
                "InitialContactId": contextAttributs.get("$.ContactId"),
                "InitiationMethod": contextAttributs.get("$.InitiationMethod"),
                "InstanceARN": contextAttributs.get("$.InstanceARN"),
                "SystemEndpoint": {
                    "Address": contextAttributs.get("$.SystemEndpoint.Address"),
                    "Type": contextAttributs.get("$.SystemEndpoint.Type")
                }
            },
            "Parameters": lambdaFunctionParameters
        },
        "Name": "ContactFlowEvent"
    };
    return inputForInvoking;
}
