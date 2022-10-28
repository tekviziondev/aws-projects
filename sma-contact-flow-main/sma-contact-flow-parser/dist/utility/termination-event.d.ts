import { ChimeActions } from "./ChimeActionTypes";
/**
  * This Terminates the existing call if there are any error occured in the Flow execution
  * @param smaEvent
  * @param SpeechAttributeMap
  * @param contextAttributes
  * @param ActualFlowARN
  * @param ContactFlowARNMap
  * @param defaultLogger
  * @param actionType
  * @returns SMA Error Speak Action and Hang UP action
  */
export declare function terminatingFlowAction(smaEvent: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>, defaultLogger: string, puaseAction: any, actionType: string): Promise<{
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
