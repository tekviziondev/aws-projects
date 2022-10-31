import { getLegACallDetails } from "../utility/call-details";
import { terminatingFlowAction } from "../utility/termination-event";
import { findActionByID } from "../utility/find-action-id";
import { processFlowAction } from "../contact-flow-processor";

/**
  * Sets the voice parameters to interact with the customer
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export class SetVoice {
    async processFlowActionUpdateContactTextToSpeechVoice(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, SpeechAttributeMap: Map<string, string>, puaseAction: any, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
        let callId: string;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            let SpeechParameters = action.Parameters
            const keys = Object.keys(SpeechParameters);
            keys.forEach((key, index) => {
                SpeechAttributeMap.set(key, SpeechParameters[key]);
            });
            let nextAction = findActionByID(actions, action.Transitions.NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
            if (nextAction.Type == "UpdateContactData") {
                console.log(defaultLogger + callId + " Next Action Type:" + nextAction.Type);
                let SpeechParameter = nextAction.Parameters
                const keys = Object.keys(SpeechParameter);
                keys.forEach((key, index) => {
                    SpeechAttributeMap.set(key, SpeechParameter[key]);
                });
                nextAction = findActionByID(actions, nextAction.Transitions.NextAction);
                console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
            }
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
        } catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of UpdateContactTextToSpeechVoice " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }
    }
}