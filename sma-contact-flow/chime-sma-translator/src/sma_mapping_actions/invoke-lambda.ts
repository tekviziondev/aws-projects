/*
Copyright (c) 2023 tekVizion PVS, Inc. 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { CallDetailsUtil } from "../utility/call-details";
import { Attributes, ContextAttributes, ContextStore, LambdaFunctionParameters } from "../const/constant-values"
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { ErrorTypes } from "../const/error-types";
import { processFlowAction } from "../contact-flow-processor"
import { NextActionValidationUtil } from "../utility/next-action-error-handler"
import { Lambda } from "aws-sdk"
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"

/**
  * Invokes the External Lambda Function and stores the result in the ContextStore
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns The Next SMA action to perform
  */
export class InvokeLambda {
    async processFlowActionInvokeLambdaFunction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        let regionVal = Attributes.region;
        console.log("the Region Value is "+regionVal)
        //creating the lambda API to invoke from the specific region
        const lambda = new Lambda({ region: regionVal });
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new CloudWatchMetric();
        let params1 = metric.createParams(contextStore, smaEvent);
        console.log(Attributes.DEFAULT_LOGGER + callId + " Invoke Lombda Action:");
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let LambdaARN = action.Parameters.LambdaFunctionARN
            // getting the input parameter form the Contact flow for invoking the external Lambda function
            let inputForInvoking = await inputForInvokingLambda(action, contextStore);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Input for invoking lambda Function" + JSON.stringify(inputForInvoking));
            const params = {
                FunctionName: LambdaARN, //Mandatory
                InvocationType: 'RequestResponse', //Mandatory
                Payload: JSON.stringify(inputForInvoking) //Mandatory
            };
            // invoking the external lambda function with the parameters and getting the result
            let result = await lambda.invoke(params).promise()
            console.log(Attributes.DEFAULT_LOGGER + callId + " Invoke Lombda Action Result is " + result);
            if (!result) {
                params1.MetricData[0].MetricName = "InvokeLambdaNoResponse"
                metric.updateMetric(params1);
                let nextAction = await new NextActionValidationUtil().getNextActionForError(action, actions, ErrorTypes.NO_MATCHING_ERROR, smaEvent)
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
            params1.MetricData[0].MetricName = "InvokeLambdaSuccess"
            metric.updateMetric(params1);
            // parsing and storing the response after invoking the Lambda function 
            let x = JSON.parse(result.Payload.toString())
            console.log(Attributes.DEFAULT_LOGGER + callId + " The Result After Invoking Lambda is" + JSON.stringify(x))
            // iterate the lambda response and store it in the contextStore
            const keys = Object.keys(x);
            keys.forEach((key, index) => {
                contextStore[ContextStore.CONTEXT_ATTRIBUTES]["$.External." + key] = x[key];
                contextStore[ContextStore.TMP_MAP][key] = x[key];
            });
            // getting the next action object to execute
            let nextAction = callDetails.findActionObjectByID(actions, action.Transitions.NextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
        } catch (error) {
            params1.MetricData[0].MetricName = "InvokeLambdaFailure"
            metric.updateMetric(params1);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution InvokeLambda" + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }


}

/**
  * Get the inputs for invoking the Lambda from the Contact Flow action object
  * @param action
  * @param contextStore
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
