/**
  * Making a SMA action to perform Ends the interaction.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
export declare class DisconnectParticipant {
    processFlowActionDisconnectParticipant(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any): Promise<{
        SchemaVersion: string;
        Actions: any[];
        TransactionAttributes: {
            currentFlowBlock: any;
        };
    }>;
}
