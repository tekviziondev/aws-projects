/**
  * Sets the voice parameters to interact with the customer
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export declare class SetVoice {
    processFlowActionUpdateContactTextToSpeechVoice(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, SpeechAttributeMap: Map<string, string>, puaseAction: any, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>): any;
}
