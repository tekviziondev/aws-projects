import { ChimeActions } from "./utility/ChimeActionTypes";
/**
  * Making a SMA action to perform delivering an audio message to obtain customer input.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
export declare class GetParticipantInput {
    processFlowActionGetParticipantInput(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributs: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any): Promise<{
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
