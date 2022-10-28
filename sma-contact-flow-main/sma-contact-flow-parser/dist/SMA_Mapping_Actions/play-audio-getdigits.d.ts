import { ChimeActions } from "../utility/ChimeActionTypes";
/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
export declare class PlayAudioAndGetDigits {
    processPlayAudioAndGetDigits(smaEvent: any, action: any, defaultLogger: string, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>): Promise<{
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
