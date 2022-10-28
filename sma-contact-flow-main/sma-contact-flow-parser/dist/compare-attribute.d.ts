/**
  * Making a SMA action to Ends the current flow and transfers the customer to a flow of type contact flow.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export declare class CompareAttribute {
    processFlowActionCompareContactAttributes(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, contextAttributs: Map<any, any>): any;
}
