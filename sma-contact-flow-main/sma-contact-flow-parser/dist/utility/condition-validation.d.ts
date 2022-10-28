/**
  * This function will validate the Recieved digits based on the condition defined in the Block
  * @param smaEvent
  * @param actionObj
  * @param contactFlow
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param recieved_digits
  * @returns SMA Action
  */
export declare function processFlowConditionValidation(smaEvent: any, actionObj: any, contactFlow: any, recieved_digits: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributs: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>): Promise<any>;
