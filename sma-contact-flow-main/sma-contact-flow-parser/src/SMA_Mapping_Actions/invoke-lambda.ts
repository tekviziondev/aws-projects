import { CallDetailsUtil } from "../utility/call-details";
import { Attributes, ContextAttributes, ContextStore, LambdaFunctionParameters } from "../const/constant-values"
import { TerminatingFlowUtil } from "../utility/termination-action";
import { ErrorTypes } from "../const/error-types";
import { processFlowAction } from "../contact-flow-processor"
import { NextActionValidationUtil } from "../utility/next-action-error"
import { Lambda } from "aws-sdk"
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"

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
    async processFlowActionInvokeLambdaFunction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        let regionVal = Attributes.region;
        const lambda = new Lambda({ region: regionVal });
        console.log(Attributes.DEFAULT_LOGGER + callId + " Invoke Lombda Action:");
        let params1 = METRIC_PARAMS
        try {
            params1.MetricData[0].Dimensions[0].Value = contextStore.ContextAttributes['$.InstanceARN']
            if (contextStore['InvokeModuleARN']) {
                params1.MetricData[0].Dimensions[1].Name = 'Module Flow ID'
                params1.MetricData[0].Dimensions[1].Value = contextStore['InvokeModuleARN']
            }
            else if (contextStore['TransferFlowARN']) {
                params1.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
                params1.MetricData[0].Dimensions[1].Value = contextStore['TransferFlowARN']
            }
            else {
                params1.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
                params1.MetricData[0].Dimensions[1].Value = contextStore['ActualFlowARN']
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId + Attributes.METRIC_ERROR + error.message);
        }
        let updateMetric=new UpdateMetricUtil();
        try {
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let LambdaARN = action.Parameters.LambdaFunctionARN
            let inputForInvoking = await inputForInvokingLambda(action, contextStore);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Input for invoking lambda Function" + JSON.stringify(inputForInvoking));
            const params = {
                FunctionName: LambdaARN, //Mandatory
                InvocationType: 'RequestResponse', //Mandatory
                Payload: JSON.stringify(inputForInvoking) //Mandatory
            };
            let result = await lambda.invoke(params).promise()
            console.log(Attributes.DEFAULT_LOGGER + callId + " Invoke Lombda Action Result is " + result);
            if (!result) {
                params1.MetricData[0].MetricName = "InvokeLambdaNoResponse"
                updateMetric.updateMetric(params1);
                let nextAction = await new NextActionValidationUtil().getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent)
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
            params1.MetricData[0].MetricName = "InvokeLambdaSuccess"
            updateMetric.updateMetric(params1);
            let x = JSON.parse(result.Payload.toString())
            console.log(Attributes.DEFAULT_LOGGER + callId + " The Result After Invoking Lambda is" + JSON.stringify(x))
            const keys = Object.keys(x);
            keys.forEach((key, index) => {
                contextStore[ContextStore.CONTEXT_ATTRIBUTES]["$.External." + key] = x[key];
                contextStore[ContextStore.TMP_MAP][key] = x[key];
            });
            let nextAction = callDetails.findActionByID(actions, action.Transitions.NextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            params1.MetricData[0].MetricName = "InvokeLambdaFailure"
            updateMetric.updateMetric(params1);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution InvokeLambda" + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
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
async function inputForInvokingLambda(action: any, contextStore: any) {
    let InvocationAttributes: any[][] = Object.entries(action.Parameters.LambdaInvocationAttributes);
    let contextAttributes = contextStore[ContextStore.CONTEXT_ATTRIBUTES]

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
