/**
  * Making a SMA action to perform delvier a Chat message and obtain customer input.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
export declare class LexBot {
    processFlowActionConnectParticipantWithLexBot(smaEvent: any, action: any, defaultLogger: string, puaseAction: any): Promise<{
        SchemaVersion: string;
        Actions: any[];
        TransactionAttributes: {
            currentFlowBlock: any;
        };
    }>;
}
