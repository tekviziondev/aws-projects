import { ChimeActions } from "../utility/ChimeActionTypes";
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
export declare class MessageParticipant {
    processFlowActionMessageParticipant(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any): Promise<{
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
