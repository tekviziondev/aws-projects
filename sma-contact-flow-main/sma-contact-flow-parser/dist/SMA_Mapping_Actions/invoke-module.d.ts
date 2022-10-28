/**
  * Invoke the Module for performing opertions
  * @param smaEvent
  * @param action
  * @returns SMA Action defined in the Module
  */
export declare class InvokeModule {
    processFlowActionInvokeFlowModule(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, InvokeModuleARNMap: Map<string, string>, InvokationModuleNextAction: Map<string, string>, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, puaseAction: any): Promise<any>;
}
