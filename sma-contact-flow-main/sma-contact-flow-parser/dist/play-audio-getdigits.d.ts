/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
export declare class PlayAudioAndGetDigits {
    processPlayAudioAndGetDigits(smaEvent: any, action: any, defaultLogger: string, puaseAction: any): Promise<{
        SchemaVersion: string;
        Actions: any[];
        TransactionAttributes: {
            currentFlowBlock: any;
        };
    }>;
}
