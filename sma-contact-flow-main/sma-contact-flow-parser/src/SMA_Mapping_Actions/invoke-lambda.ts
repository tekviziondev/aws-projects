import { getLegACallDetails } from "../utility/call-details";
import { ConstData } from "../utility/ConstantValues"
import { terminatingFlowAction } from "../utility/termination-event";
import { findActionByID } from "../utility/find-action-id";
import { ErrorTypes } from "../utility/ErrorTypes";
import { processFlowAction } from "../contact-flow-processor"
import { getNextActionForError} from "../utility/next-action-error"

/**
  * Invokes the External Lambda Function and stores the result of the Lambda function in Key Value Pair
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns The Next SMA Action to perform
  */
export class InvokeLambda {
    async processFlowActionInvokeLambdaFunction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, contextAttributes: Map<any, any>, loopMap: Map<string, string>, tmpMap: Map<any, any>, puaseAction: any, SpeechAttributeMap: Map<string, string>, ContactFlowARNMap: Map<string, string>, ActualFlowARN: Map<string, string>) {
        const legA = getLegACallDetails(smaEvent);
        let callId: string;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        const AWS = require("aws-sdk")
        const lambda = new AWS.Lambda({ region: ConstData.region })
        try {
            let LambdaARN = action.Parameters.LambdaFunctionARN

            let inputForInvoking = await inputForInvokingLambda(action, contextAttributes);
            const params = {
                FunctionName: LambdaARN,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(inputForInvoking)
            };
            let result = await lambda.invoke(params).promise()
            if (result === null  && !result) {
                let nextAction = await getNextActionForError(action, actions, ErrorTypes.NoMatchingError, smaEvent,defaultLogger);
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
            }
            let x = JSON.parse(result.Payload)
            console.log(defaultLogger + callId + " The Result After Invoking Lambda is" + JSON.stringify(x))
            const keys = Object.keys(x);
            keys.forEach((key, index) => {
                contextAttributes.set("$.External." + key, x[key]);
                tmpMap.set(key, x[key]);


            });

            let nextAction = findActionByID(actions, action.Transitions.NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        } catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution InvokeLambda" + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }
    }


}
async function inputForInvokingLambda(action: any, contextAttributs: Map<any, any>) {
    let InvocationAttributes: any[][] = Object.entries(action.Parameters.LambdaInvocationAttributes);
    for (let i = 0; i < InvocationAttributes.length; i++) {
        if (InvocationAttributes[i][1].includes("$.External.") || InvocationAttributes[i][1].includes("$.Attributes.")) {
            contextAttributs.forEach((value, key) => {
                if (InvocationAttributes[i][1] == key)
                    InvocationAttributes[i][1] = InvocationAttributes[i][1].replace(key, value)
            })
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
    }
    return inputForInvoking;
}