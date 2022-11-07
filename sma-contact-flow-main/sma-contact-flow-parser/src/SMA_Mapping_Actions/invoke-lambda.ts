import { getLegACallDetails } from "../utility/call-details";
import { Attributes } from "../utility/constant-values"
import { terminatingFlowAction } from "../utility/termination-action";
import { findActionByID } from "../utility/find-action-id";
import { ErrorTypes } from "../utility/error-types";
import { processFlowAction } from "../contact-flow-processor"
import { getNextActionForError } from "../utility/next-action-error"
import { Lambda } from "aws-sdk"

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
    async processFlowActionInvokeLambdaFunction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, contextStore:any ){
        let callId: string;
        const lambda = new Lambda({ region: Attributes.region });
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let LambdaARN = action.Parameters.LambdaFunctionARN

            let inputForInvoking = await inputForInvokingLambda(action, contextStore);
            const params = {
                FunctionName: LambdaARN,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(inputForInvoking)
            };
            let result = await lambda.invoke(params).promise()
            if (!result) {
                let nextAction = await getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent, defaultLogger)
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
            let x = JSON.parse(result.Payload.toString())
            console.log(defaultLogger + callId + " The Result After Invoking Lambda is" + JSON.stringify(x))
            const keys = Object.keys(x);
            keys.forEach((key, index) => {
                contextStore.contextAttributes.set("$.External." + key, x[key]);
                contextStore.tmpMap.set(key, x[key]);
            });

            let nextAction = findActionByID(actions, action.Transitions.NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            console.error(defaultLogger + callId + " There is an Error in execution InvokeLambda" + error.message);
            return await terminatingFlowAction(smaEvent, defaultLogger,"error")
        }
    }


}

/**
  * Gets the input for invoking the Lambda from the Amazon connect action Block
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */
async function inputForInvokingLambda(action: any, contextStore:any) {
    let InvocationAttributes: any[][] = Object.entries(action.Parameters.LambdaInvocationAttributes);
    let contextAttributes=contextStore['contextAttributes']
    for (let i = 0; i < InvocationAttributes.length; i++) {
        // checking if the attribute value contains any user defined, system or External attributes for replacing it to the corresponding value
        if (InvocationAttributes[i][1].includes("$.External.") || InvocationAttributes[i][1].includes("$.Attributes.")) {
            contextAttributes.forEach((value, key) => {
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
                "Channel": contextAttributes.get("$.Channel"),
                "ContactId": contextAttributes.get("$.ContactId"),
                "CustomerEndpoint": {
                    "Address": contextAttributes.get("$.CustomerEndpoint.Address"),
                    "Type": contextAttributes.get("$.CustomerEndpoint.Type")
                },
                "InitialContactId": contextAttributes.get("$.ContactId"),
                "InitiationMethod": contextAttributes.get("$.InitiationMethod"),
                "InstanceARN": contextAttributes.get("$.InstanceARN"),
                "SystemEndpoint": {
                    "Address": contextAttributes.get("$.SystemEndpoint.Address"),
                    "Type": contextAttributes.get("$.SystemEndpoint.Type")
                }
            },
            "Parameters": lambdaFunctionParameters
        },
        "Name": "ContactFlowEvent"
    }
    return inputForInvoking;
}