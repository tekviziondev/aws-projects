/**
  * End the execution of the current Module and returns Back to Orginal Contact flow.
  * @param smaEvent
  * @param action
  * @returns SMA Action defined after end flow Module
  */
export declare class EndModule {
    processFlowActionEndFlowModuleExecution(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, InvokeModuleARNMap: Map<string, string>, InvokationModuleNextAction: Map<string, string>, ActualFlowARN: Map<string, string>, defaultLogger: string, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ContactFlowARNMap: Map<string, string>): any;
}
