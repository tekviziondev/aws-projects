export declare class PlayAudio {
    processPlayAudio(smaEvent: any, action: any, defaultLogger: string, puaseAction: any): Promise<{
        SchemaVersion: string;
        Actions: any[];
        TransactionAttributes: {
            currentFlowBlock: any;
        };
    }>;
}
