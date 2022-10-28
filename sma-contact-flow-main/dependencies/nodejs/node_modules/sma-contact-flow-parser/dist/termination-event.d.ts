import { ChimeActions } from "./utility/ChimeActionTypes";
export declare function terminatingFlowAction(smaEvent: any, action: any, SpeechAttributeMap: Map<string, string>, contextAttributs: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any, actionType: string): Promise<{
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
}>;
