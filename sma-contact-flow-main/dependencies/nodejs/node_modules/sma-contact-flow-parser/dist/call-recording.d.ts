/**
  * Making a SMA action to perform Call Recording.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
export declare class CallRecording {
    processFlowActionUpdateContactRecordingBehavior(smaEvent: any, action: any, puaseAction: any): Promise<{
        SchemaVersion: string;
        Actions: any[];
        TransactionAttributes: {
            currentFlowBlock: any;
        };
    }>;
}
