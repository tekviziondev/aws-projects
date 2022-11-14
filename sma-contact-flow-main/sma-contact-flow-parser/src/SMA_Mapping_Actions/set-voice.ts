import { getLegACallDetails } from "../utility/call-details";
import { terminatingFlowAction } from "../utility/termination-action";
import { findActionByID } from "../utility/find-action-id";
import { processFlowAction } from "../contact-flow-processor";
import { Attributes, ContextStore } from "../utility/constant-values";
import { IContextStore } from "../utility/context-store";


/**
  * Sets the voice parameters to interact with the customer
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA Action
  */
export class SetVoice {
    async processFlowActionUpdateContactTextToSpeechVoice(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore:IContextStore){
        let callId: string;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId; 
            let speechAttributes=contextStore[ContextStore.SPEECH_ATTRIBUTES]
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let SpeechParameters = action.Parameters
            const keys = Object.keys(SpeechParameters);
            keys.forEach((key, index) => {
                speechAttributes[key]= SpeechParameters[key];
            });
            let nextAction = findActionByID(actions, action.Transitions.NextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            if (nextAction.Type == "UpdateContactData") {
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action Type:" + nextAction.Type);
                let SpeechParameter = nextAction.Parameters
                const keys = Object.keys(SpeechParameter);
                keys.forEach((key, index) => {
                    speechAttributes[key]= SpeechParameters[key];
                });
                nextAction = findActionByID(actions, nextAction.Transitions.NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.NextAction);
            }
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName,contextStore);
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of UpdateContactTextToSpeechVoice " + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }
    }
}
