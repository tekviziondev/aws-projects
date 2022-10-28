import { ChimeActions } from "../utility/ChimeActionTypes";
/**
  * Making a SMA action to perform Call Recording.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
export declare class CallRecording {
    processFlowActionUpdateContactRecordingBehavior(smaEvent: any, action: any, puaseAction: any, defaultLogger: string, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>): Promise<{
        SchemaVersion: string;
        Actions: ({
            Type: ChimeActions;
            Parameters: {
                Engine: string;
                CallId: any;
                Text: string;
                TextType: string;
                LanguageCode: string;
                VoiceId: string;
            };
        } | {
            Type: ChimeActions;
            Parameters: {
                SipResponseCode: string;
                CallId: string;
            };
        })[];
    } | {
        SchemaVersion: string;
        Actions: any[];
        TransactionAttributes: {
            currentFlowBlock: any;
        };
    }>;
}
