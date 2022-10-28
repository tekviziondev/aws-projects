/**
  * This function get connect flow data from contact flow loader
  * and send the connect flow data to respective functions.
  * @param smaEvent
  * @param amazonConnectInstanceID
  * @param amazonConnectFlowID
  * @param bucketName
  * @returns SMA Action
  */
export declare function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string, bucketName: string): Promise<any>;
/**
  * This function is starting of the flow exection.
  * Get current action from the flow block and send to process flow action
  * @param smaEvent
  * @param contactFlow
  * @param _transactionAttributes
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export declare function processRootFlowBlock(smaEvent: any, contactFlow: any, _transactionAttributes: any, amazonConnectInstanceID: string, bucketName: string): any;
/**
  * This function process the flow actions and call the respective SMA Mapping Class based on the action type.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export declare function processFlowAction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string): any;
