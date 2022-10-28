/**
  * Invokes the External Lambda Function and stores the result of the Lambda function in Key Value Pair
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns The Next SMA Action to perform
  */
export declare class InvokeLambda {
    processFlowActionInvokeLambdaFunction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, contextAttributes: Map<any, any>, loopMap: Map<string, string>, tmpMap: Map<any, any>, puaseAction: any, SpeechAttributeMap: Map<string, string>, ContactFlowARNMap: Map<string, string>, ActualFlowARN: Map<string, string>): any;
}
