export declare function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string, bucketName: string): Promise<{
    SchemaVersion: string;
    Actions: {
        Type: string;
        Parameters: {
            CallId: any;
            SpeechParameters: any;
            FailureSpeechParameters: any;
            MinNumberOfDigits: number;
        };
    }[];
    TransactionAttributes: {
        currentFlowBlock: any;
    };
} | {
    SchemaVersion: string;
    Actions: {
        Type: string;
        Parameters: {
            AudioSource: any;
        };
    }[];
    TransactionAttributes: {
        currentFlowBlock: any;
    };
} | {
    SchemaVersion: string;
    Actions: {
        Type: string;
        Parameters: {
            Engine: string;
            CallId: any;
            Text: string;
            TextType: string;
            VoiceId: string;
        };
    }[];
    TransactionAttributes: {
        currentFlowBlock: any;
    };
} | {
    SchemaVersion: string;
    Actions: {
        Type: string;
        Parameters: {
            SipResponseCode: string;
        };
    }[];
    TransactionAttributes: {
        currentFlowBlock: any;
    };
} | {
    SchemaVersion: string;
    Actions: {
        Type: string;
        Parameters: {
            DurationInMilliseconds: any;
        };
    }[];
    TransactionAttributes: {
        currentFlowBlock: any;
    };
}>;
