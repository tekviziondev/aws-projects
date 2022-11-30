import { CallDetailsUtil } from "../utility/call-details";
import { Attributes } from "../const/constant-values";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { PlayAudio } from "./play-audio";
import { IContextStore } from "../const/context-store";
import { SpeakAction } from "./speak-action";
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */
export class MessageParticipant {
    async execute(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        // getting the CallID of the Active call from the SMA Event
        let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent) as any;
        try {
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.Media != null) {
                console.log(Attributes.DEFAULT_LOGGER + callId + "Play Audio Action");
                let playAudio = new PlayAudio();
                return await playAudio.execute(smaEvent, action, contextStore);
            }
            else {
                console.log(Attributes.DEFAULT_LOGGER + callId + "Speak Action");
                let speakAction = new SpeakAction();
                return await speakAction.execute(smaEvent, action, contextStore);
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of MessageParticipant " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}
