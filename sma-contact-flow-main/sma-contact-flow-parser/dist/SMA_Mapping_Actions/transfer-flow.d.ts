/**
  * Transfer to another Contact Flow to Execute.
  * @param smaEvent
  * @param action
  * @returns SMA Action of Another Contact Flow
  */
export declare class TrasferToFlow {
    processFlowActionTransferToFlow(smaEvent: any, action: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, ContactFlowARNMap: Map<string, string>, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>): any;
}
