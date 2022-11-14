import { getLegACallDetails } from "../utility/call-details";
import { Attributes, ContextAttributes, ContextStore, LambdaFunctionParameters } from "../utility/constant-values"
import { terminatingFlowAction } from "../utility/termination-action";
import { findActionByID } from "../utility/find-action-id";
import { ErrorTypes } from "../utility/error-types";
import { processFlowAction } from "../contact-flow-processor"
import { getNextActionForError } from "../utility/next-action-error"
import { Lambda } from "aws-sdk"
import { IContextStore } from "../utility/context-store";

/**
  * Invokes the External Lambda Function and stores the result of the Lambda function in Key Value Pair
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns The Next SMA Action to perform
  */
export class InvokeLambda {
    async processFlowActionInvokeLambdaFunction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore:IContextStore ){
        let callId: string;
        let regionVal="";
        if(Attributes.region)
        regionVal=Attributes.region;
        else
        regionVal='us-east-1';
        const lambda = new Lambda({ region: regionVal });
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
                let nextAction = await getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent)
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
            let x = JSON.parse(result.Payload.toString())
            console.log(Attributes.DEFAULT_LOGGER + callId + " The Result After Invoking Lambda is" + JSON.stringify(x))
            const keys = Object.keys(x);
            keys.forEach((key, index) => {
                contextStore[ContextStore.CONTEXT_ATTRIBUTES]["$.External." + key]= x[key];
                contextStore[ContextStore.TMP_MAP][key]= x[key];
            });

            let nextAction = findActionByID(actions, action.Transitions.NextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution InvokeLambda" + error.message);
            return await terminatingFlowAction(smaEvent, "error")
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
    let contextAttributes=contextStore[ContextStore.CONTEXT_ATTRIBUTES]
 
    for (let i = 0; i < InvocationAttributes.length; i++) {
        // checking if the attribute value contains any user defined, system or External attributes for replacing it to the corresponding value
        if (InvocationAttributes[i][1].includes("$.External.") || InvocationAttributes[i][1].includes("$.Attributes.")) {
            const keys = Object.keys(contextAttributes);
                keys.forEach((key, index) => {
                    if (InvocationAttributes[i][1] == key)
                    InvocationAttributes[i][1] = InvocationAttributes[i][1].replace(key, contextAttributes[key])
            });
        }
    }
    
    let lambdaFunctionParameters = Object.fromEntries(InvocationAttributes.map(([k, v]) => [k, v]));
    let inputForInvoking = {
        "Details": {
            "ContactData": {
                "Attributes": {},
                [LambdaFunctionParameters.CHANNEL]: contextAttributes[ContextAttributes.CHANNEL],
                [LambdaFunctionParameters.CONTACTID]: contextAttributes[ContextAttributes.CONTACTID],
                [LambdaFunctionParameters.CUSTOMER_ENDPOINT]: {
                    [LambdaFunctionParameters.ADDRESS]: contextAttributes[ContextAttributes.CUSTOMER_ENDPOINT_ADDRESS],
                    [LambdaFunctionParameters.TYPE]: contextAttributes[ContextAttributes.CUSTOMER_ENDPOINT_TYPE]
                },
                [LambdaFunctionParameters.INITIAL_CONTACTID]: contextAttributes[ContextAttributes.INSTANCE_ARN],
                [LambdaFunctionParameters.INITIATION_METHOD]: contextAttributes[ContextAttributes.INITIATION_METHOD],
                [LambdaFunctionParameters.INSTANCE_ARN]: contextAttributes[ContextAttributes.INSTANCE_ARN],
                [LambdaFunctionParameters.SYSTEM_ENDPOINT]: {
                    [LambdaFunctionParameters.ADDRESS]: contextAttributes[ContextAttributes.SYSTEM_ENDPOINT_ADDRESS],
                    [LambdaFunctionParameters.TYPE]: contextAttributes[ContextAttributes.SYSTEM_ENDPOINT_TYPE]
                }
            },
            "Parameters": lambdaFunctionParameters
        },
        "Name": "ContactFlowEvent"
    }
    return inputForInvoking;
}
